import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse } from 'ai';
import { AIMessageChunk } from '@langchain/core/messages';

/**
 * LangGraph API ルート
 * 
 * 方法1: @ai-sdk/langchain アダプターを使用する方法
 * 
 * langgraph dev のHTTPストリームをAsyncIterableに変換し、
 * toUIMessageStream()に渡すことで、方法1の形式を維持します。
 * 
 * 使用している LangGraph:
 * - URL: http://localhost:2024
 * - Graph ID: p31_streaming
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // langgraph dev のAPIエンドポイントに接続
    const langgraphUrl = process.env.LANGGRAPH_API_URL || 'http://localhost:2024';
    // エージェントIDを環境変数から取得（デフォルト値: ex02_parroting）
    const graphId = process.env.LANGGRAPH_AGENT_ID || 'ex02_parroting';

    // UIメッセージをLangChain形式に変換
    const langchainMessages = await toBaseMessages(messages);

    // LangGraphのストリームエンドポイントを呼び出し
    // langgraph dev は /runs/stream エンドポイントを提供（stateless run）
    const requestBody = {
      assistant_id: graphId,  // グラフIDを指定
      input: {
        messages: langchainMessages.map((msg) => ({
          role: msg.constructor.name === 'HumanMessage' ? 'human' : 'ai',
          content: msg.content,
        })),
      },
      stream_mode: 'messages',  // 'messages' のみを使用（推奨）
    };

    const response = await fetch(
      `${langgraphUrl}/runs/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR] LangGraph API error response:', errorText);
      throw new Error(`LangGraph API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body from LangGraph');
    }

    // HTTPストリームをAsyncIterableに変換
    // langgraph dev は Server-Sent Events (SSE) 形式でストリームを返す
    const stream = async function* () {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';
      let previousEvent = ''; // 前回のイベントタイプを追跡
      // メッセージIDごとにlastContentを追跡
      const messageContentMap = new Map<string, string>();
      // 現在処理中のメッセージID（複数ノードからのメッセージを統合するため、最新のメッセージのみを追跡）
      let currentMessageId: string | null = null;
      let lastSentContent = '';
      // 前回処理したメッセージIDを追跡（メッセージIDが変わったときに前のメッセージをリセットするため）
      let previousMessageId: string | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            // イベントタイプを取得
            if (line.startsWith('event: ')) {
              const newEvent = line.slice(7).trim();
              // イベントタイプが変わったときのみログ出力
              if (newEvent !== previousEvent) {
                console.log(`[EVENT CHANGE] ${previousEvent || '(none)'} -> ${newEvent}`);
                previousEvent = newEvent;
              }
              currentEvent = newEvent;
              continue;
            }
            
            // データを取得
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // messages/partial イベントを処理
                if (currentEvent === 'messages/partial' && Array.isArray(data)) {
                  // メッセージ配列から最新のメッセージを取得
                  // 複数のメッセージがある場合、最新のものを優先
                  const latestMessage = data[data.length - 1];
                  if (!latestMessage || !latestMessage.id || !latestMessage.content) continue;
                  
                  const messageId = latestMessage.id;
                  const currentContent = latestMessage.content;
                  
                  // メッセージIDが変わった場合、前のメッセージを完全にリセット
                  if (messageId !== currentMessageId) {
                    // メッセージIDが変わったときのみログ出力
                    console.log(`[MESSAGE ID CHANGE] ${currentMessageId || '(none)'} -> ${messageId}`);
                    console.log(`[MESSAGE CONTENT] Length: ${currentContent.length}, Content: ${currentContent.substring(0, 100)}${currentContent.length > 100 ? '...' : ''}`);
                    console.log(`[PREVIOUS SENT] Length: ${lastSentContent.length}, Content: ${lastSentContent.substring(0, 50)}${lastSentContent.length > 50 ? '...' : ''}`);
                    
                    // 新しいメッセージIDが来た場合、前のメッセージを完了として扱う
                    previousMessageId = currentMessageId;
                    currentMessageId = messageId;
                    // 前のメッセージを完全にリセット
                    lastSentContent = '';
                    messageContentMap.clear();
                    // 新しいメッセージの内容を最初から送信
                    messageContentMap.set(messageId, currentContent);
                    // メッセージIDが変わったときは、前のメッセージを完全に置き換えるため、
                    // 新しいメッセージの内容を最初から送信
                    // メッセージIDが変わったときは、前のメッセージを完全に置き換えるため、
                    // 新しいメッセージの内容を最初から送信
                    console.log(`[YIELDING NEW MESSAGE] Length: ${currentContent.length}, Content: ${currentContent.substring(0, 100)}${currentContent.length > 100 ? '...' : ''}`);
                    const newChunk = new AIMessageChunk(currentContent);
                    console.log(`[YIELDING CHUNK] Chunk type: ${newChunk.constructor.name}, Content length: ${newChunk.content.length}`);
                    yield newChunk;
                    lastSentContent = currentContent;
                    continue;
                  }
                  
                  // メッセージの内容を更新
                  const previousContent = messageContentMap.get(messageId) || '';
                  
                  // 内容が更新された場合のみ処理
                  if (currentContent !== previousContent) {
                    // 差分を計算して送信
                    if (previousContent && currentContent.startsWith(previousContent)) {
                      // 既存のメッセージの更新：差分のみを送信
                      const newContent = currentContent.slice(previousContent.length);
                      if (newContent) {
                        console.log(`[CONTENT UPDATE] MessageID: ${messageId}, Added length: ${newContent.length}, Total: ${currentContent.length}, New content: ${newContent.substring(0, 50)}${newContent.length > 50 ? '...' : ''}`);
                        const updateChunk = new AIMessageChunk(newContent);
                        console.log(`[YIELDING UPDATE CHUNK] Chunk type: ${updateChunk.constructor.name}, Content length: ${updateChunk.content.length}`);
                        yield updateChunk;
                        lastSentContent = currentContent;
                      }
                    } else {
                      // 内容が完全に変わった場合（前の内容が現在の内容のプレフィックスでない場合）
                      // メッセージIDは同じだが内容が完全に変わったときのみログ出力
                      console.log(`[CONTENT REPLACED] MessageID: ${messageId}, Previous length: ${previousContent.length}, New length: ${currentContent.length}`);
                      console.log(`[NEW CONTENT] ${currentContent.substring(0, 100)}${currentContent.length > 100 ? '...' : ''}`);
                      
                      // 前回送信した内容をリセットして、新しい内容を最初から送信
                      // ただし、前回送信した内容が現在の内容のプレフィックスである場合は、差分のみを送信
                      if (lastSentContent && currentContent.startsWith(lastSentContent)) {
                        // 前回送信した内容からの差分
                        const newContent = currentContent.slice(lastSentContent.length);
                        if (newContent) {
                          yield new AIMessageChunk(newContent);
                        }
                        lastSentContent = currentContent;
                      } else {
                        // 完全に新しい内容：前回送信した内容をリセットして、新しい内容を最初から送信
                        // これは通常発生しないはずですが、念のため処理
                        lastSentContent = '';
                        yield new AIMessageChunk(currentContent);
                        lastSentContent = currentContent;
                      }
                    }
                    
                    // メッセージの内容を更新
                    messageContentMap.set(messageId, currentContent);
                  }
                } else {
                  // messages/partial以外のイベントのデータをログ出力（必要に応じて）
                  // console.log(`[OTHER EVENT DATA] ${currentEvent}:`, JSON.stringify(data, null, 2));
                }
              } catch (parseError) {
                console.error('[DEBUG] Failed to parse SSE data:', parseError, line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    };

    // LangGraphのストリームをUIメッセージストリームに変換
    console.log('[STREAM] Converting LangChain stream to UI message stream...');
    const uiMessageStream = toUIMessageStream(stream());
    console.log('[STREAM] UI message stream created');

    // UIメッセージストリームレスポンスを返す
    console.log('[STREAM] Creating UI message stream response...');
    const streamResponse = createUIMessageStreamResponse({
      stream: uiMessageStream,
    });
    console.log('[STREAM] UI message stream response created');
    return streamResponse;
  } catch (error: any) {
    console.error('[ERROR] LangGraph API error:', error);
    
    // より詳細なエラー情報を返す
    return Response.json(
      { 
        error: 'Failed to process LangGraph stream',
        details: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An error occurred while processing the request',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

