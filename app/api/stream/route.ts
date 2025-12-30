import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received request body:', body);
    
    // useCompletionはpromptフィールドを送信する
    const prompt = body.prompt;

    if (!prompt) {
      return Response.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // streamText()を使用してストリーミングレスポンスを返す
    // generateText()とは異なり、結果を段階的に返すことができる
    // 呼び出し自体は、generateと大差ない。
    const result = await streamText({
      model: openai('gpt-5-nano'),  // モデルオブジェクトを指定
      prompt,                        // この時点でOpenAI APIが呼び出される
    });

    // toUIMessageStreamResponse()でストリーミングレスポンスを返す
    // useCompletionはこの形式を期待している
    // これにより、クライアント側でリアルタイムにテキストを受信できる
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Stream API error:', error);
    
    // モデルが存在しない場合のエラーハンドリング
    if (error.message?.includes('model') || error.status === 404) {
      return Response.json(
        { 
          error: 'Model not found. Please check if the model name is correct.',
          details: 'The model "gpt-5-nano" may not exist. Try using "gpt-4o" or "gpt-3.5-turbo" instead.'
        },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        error: 'Failed to stream text',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

