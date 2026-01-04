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
      let lastContent = '';

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
              currentEvent = line.slice(7).trim();
              continue;
            }
            
            // データを取得
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // messages/partial イベントを処理
                if (currentEvent === 'messages/partial' && Array.isArray(data)) {
                  // メッセージ配列から最新のメッセージを取得
                  const message = data[data.length - 1];
                  if (message && message.content && message.content !== lastContent) {
                    // 新しいコンテンツのみを抽出（差分）
                    const newContent = message.content.slice(lastContent.length);
                    if (newContent) {
                      yield new AIMessageChunk(newContent);
                      lastContent = message.content;
                    }
                  }
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
    const uiMessageStream = toUIMessageStream(stream());

    // UIメッセージストリームレスポンスを返す
    return createUIMessageStreamResponse({
      stream: uiMessageStream,
    });
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

