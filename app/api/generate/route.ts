import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return Response.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // openai('gpt-5-nano')はモデルオブジェクトを作成するだけ（まだAPI呼び出しは発生しない）
    // 実際のOpenAI API呼び出しは、generateText()が実行されたときに発生する
    const { text } = await generateText({
      model: openai('gpt-5-nano'),  // モデルオブジェクトを指定
      prompt,                        // この時点でOpenAI APIが呼び出される
    });

    return Response.json({ text });
  } catch (error: any) {
    console.error('Generate API error:', error);
    
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
        error: 'Failed to generate text',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


