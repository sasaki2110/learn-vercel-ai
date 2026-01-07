
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
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error('[ERROR] Messages is not an array:', messages);
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
    // フロントエンドから送信される形式: {role: 'user' | 'assistant', content: string}
    // toBaseMessagesを使わずに、直接LangGraph形式に変換
    const langgraphMessages = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'human' : 'ai',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }));

    // LangGraphのストリームエンドポイントを呼び出し
    // langgraph dev は /runs/stream エンドポイントを提供（stateless run）
    const requestBody = {
      assistant_id: graphId,  // グラフIDを指定
      input: {
        messages: langgraphMessages,
      },
      stream_mode: 'messages',  // 'messages' のみを使用（推奨）
    };

    let response: Response;
    try {
      response = await fetch(
        `${langgraphUrl}/runs/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );
    } catch (fetchError: any) {
      console.error('[ERROR] Failed to connect to LangGraph:', fetchError);
      
      // 接続エラーの場合、より分かりやすいメッセージを返す
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('ECONNREFUSED')) {
        return Response.json(
          {
            error: 'LangGraphサーバーに接続できません',
            details: `LangGraphサーバー（${langgraphUrl}）が起動しているか確認してください。`,
            hint: 'LangGraphサーバーを起動するには、別のターミナルで `langgraph dev` を実行してください。',
          },
          { status: 503 }
        );
      }
      
      throw new Error(`LangGraph接続エラー: ${fetchError.message}`);
    }

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
    // 案2: カスタムストリーム形式でメッセージIDとコンテンツを一緒に送信
    const stream = async function* () {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';
      // メッセージIDごとにlastContentを追跡
      const messageContentMap = new Map<string, string>();
      // 現在処理中のメッセージID
      let currentMessageId: string | null = null;
      // 送信済みのツール呼び出しIDと引数の組み合わせを記録（重複送信を防ぐため）
      const sentToolCallArgs = new Map<string, string>(); // toolCallId -> JSON.stringify(args)

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
                  const latestMessage = data[data.length - 1];
                  if (!latestMessage || !latestMessage.id) continue;
                  
                  const messageId = latestMessage.id;
                  const currentContent = latestMessage.content || '';
                  
                  // ツール呼び出しを検出（引数が空でない場合、かつ前回と異なる場合のみ送信）
                  if (latestMessage.tool_calls && Array.isArray(latestMessage.tool_calls) && latestMessage.tool_calls.length > 0) {
                    for (const toolCall of latestMessage.tool_calls) {
                      // 引数が空でない場合のみ処理
                      if (Object.keys(toolCall.args).length > 0) {
                        const argsKey = JSON.stringify(toolCall.args);
                        const previousArgs = sentToolCallArgs.get(toolCall.id);
                        
                        // 前回と異なる引数の場合のみ送信
                        if (previousArgs !== argsKey) {
                          console.log(`[TOOL CALL] Tool: ${toolCall.name}, Args:`, toolCall.args);
                          sentToolCallArgs.set(toolCall.id, argsKey);
                          yield {
                            type: 'tool-call',
                            messageId: messageId,
                            toolCall: {
                              id: toolCall.id,
                              name: toolCall.name,
                              args: toolCall.args,
                            },
                          };
                        }
                      }
                    }
                  }
                  
                  // メッセージIDが変わった場合、メッセージID変更を通知
                  if (messageId !== currentMessageId) {
                    console.log(`[MESSAGE ID CHANGE] ${currentMessageId || '(none)'} -> ${messageId}`);
                    // メッセージID変更を通知する特別なチャンク
                    yield {
                      type: 'message-id-change',
                      messageId: messageId,
                      previousMessageId: currentMessageId,
                    };
                    currentMessageId = messageId;
                    // メッセージの内容をリセット
                    messageContentMap.clear();
                    messageContentMap.set(messageId, currentContent);
                    // ツール呼び出しの追跡もリセット
                    sentToolCallArgs.clear();
                  }
                  
                  // メッセージの内容を更新（contentがある場合のみ）
                  if (currentContent) {
                    const previousContent = messageContentMap.get(messageId) || '';
                    
                    // 内容が更新された場合のみ処理
                    if (currentContent !== previousContent) {
                      // コンテンツチャンクを送信
                      yield {
                        type: 'content',
                        messageId: messageId,
                        content: currentContent,
                      };
                      
                      // メッセージの内容を更新
                      messageContentMap.set(messageId, currentContent);
                    }
                  }
                } else if (currentEvent === 'messages/complete' && Array.isArray(data)) {
                  // ツール結果を検出（messages/completeイベントでtype: "tool"のメッセージ）
                  for (const message of data) {
                    if (message.type === 'tool' && message.tool_call_id) {
                      console.log(`[TOOL RESULT] Tool call ID: ${message.tool_call_id}, Result: ${message.content}, Status: ${message.status}`);
                      yield {
                        type: 'tool-result',
                        toolCallId: message.tool_call_id,
                        result: message.content,
                        status: message.status || 'success',
                      };
                    }
                  }
                }
              } catch (parseError) {
                console.error('[ERROR] Failed to parse SSE data:', parseError, line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    };

    // カスタムストリーム形式をSSE形式で送信
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          try {
            for await (const chunk of stream()) {
              // SSE形式で送信
              const data = JSON.stringify(chunk);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            controller.close();
          } catch (error) {
            console.error('[ERROR] Stream error:', error);
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
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

