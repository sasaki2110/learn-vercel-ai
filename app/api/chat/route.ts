import { convertToModelMessages, streamText, UIMessage, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { tools } from '../tools';

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const modelMessages = await convertToModelMessages(messages);

    console.log('[DEBUG] Calling streamText with tools...');

    // streamText()を使用してストリーミングレスポンスを返す
    // stopWhen: デフォルトはstepCountIs(1)で、1ステップで停止してしまいます
    // ツール呼び出し後に最終回答を生成するために、複数のステップを許可する必要があります
    const result = await streamText({
      model: openai('gpt-5-nano'),
      messages: modelMessages,
      tools, // 理解出来たら、この１文でapp/api/tools/index.tsのツールを使用できるようになるんだ。
      stopWhen: stepCountIs(5),  // ツール呼び出し後の最終回答を生成するために、最大5ステップまで許可
      onStepFinish: async (step) => {
        // 各ステップの完了をログに記録
        console.log(`[DEBUG] Step finished:`, {
          textLength: step.text?.length || 0,
          textPreview: step.text?.substring(0, 100) || '(no text)',
          toolCalls: step.toolCalls?.length || 0,
          toolResults: step.toolResults?.length || 0,
          finishReason: step.finishReason,
        });
      },
    });

    console.log('[DEBUG] Returning stream response...');
    return result.toUIMessageStreamResponse();
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

