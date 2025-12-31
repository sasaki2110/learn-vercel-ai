import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // streamText()を使用してストリーミングレスポンスを返す
    // useChat()はmessages配列を送信する
    const result = await streamText({
      model: openai('gpt-4o'),  // GPT-4oモデルを使用
      messages,                  // メッセージ履歴を渡す
    });

    // toDataStreamResponse()でストリーミングレスポンスを返す
    // useChat()はこの形式を期待している
    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // モデルが存在しない場合のエラーハンドリング
    if (error.message?.includes('model') || error.status === 404) {
      return Response.json(
        { 
          error: 'Model not found. Please check if the model name is correct.',
          details: 'The model may not exist. Try using "gpt-4o" or "gpt-3.5-turbo" instead.'
        },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        error: 'Failed to stream chat',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

