import { tool } from 'ai';
import { z } from 'zod';

/**
 * ツール定義
 * 
 * AI SDKのTools機能を使用して、LLMが外部機能を呼び出すためのツールを定義します。
 * LLMが会話の文脈を判断して、必要に応じて自動的にツールを呼び出します。
 * 
 * AI SDK 6では、`tool()`関数を使用してツールを定義し、`inputSchema`でパラメータを指定します。
 */

/**
 * 天気情報を取得するツール
 */
export const getWeather = tool({
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA"),
  }),
  execute: async ({ location }) => {
    console.log('[DEBUG] getWeather.execute called with:', { location });
    
    try {
      // 実際の天気APIを呼び出す
      // ここでは例として固定値を返す
      const result = {
        location,
        temperature: '72°F',
        condition: 'Sunny',
      };
      
      console.log('[DEBUG] getWeather.execute returning:', result);
      return result;
    } catch (error: any) {
      console.error('[DEBUG] getWeather.execute error:', error);
      throw error;
    }
  },
});

/**
 * 数学計算を実行するツール
 */
export const calculate = tool({
  description: "Perform a mathematical calculation. Supports basic arithmetic operations like addition, subtraction, multiplication, and division.",
  inputSchema: z.object({
    expression: z.string().describe("Mathematical expression to evaluate (e.g., '2 + 2', '10 * 5', '100 / 4')"),
  }),
  execute: async ({ expression }) => {
    console.log('[DEBUG] calculate.execute called with:', { expression });
    
    try {
      // セキュリティのため、許可された文字のみをチェック
      // 数字、演算子（+、-、*、/）、括弧、小数点、空白のみを許可
      const sanitized = expression.trim();
      console.log('[DEBUG] calculate.execute sanitized:', sanitized);
      
      if (!/^[\d+\-*/().\s]+$/.test(sanitized)) {
        const errorResult = { 
          error: 'Invalid expression. Only numbers and basic operators (+, -, *, /) are allowed.',
          expression 
        };
        console.log('[DEBUG] calculate.execute validation failed:', errorResult);
        return errorResult;
      }

      // 安全な計算処理（簡易版）
      // 注意: 本番環境では、より安全な計算ライブラリ（例: mathjs）を使用することを推奨
      // ここでは、Functionコンストラクタを使用して計算を実行
      // ただし、これは簡易実装であり、本番環境ではmathjsなどのライブラリを使用すべきです
      console.log('[DEBUG] calculate.execute evaluating expression...');
      const result = Function(`"use strict"; return (${sanitized})`)();
      console.log('[DEBUG] calculate.execute result:', result);
      
      if (typeof result !== 'number' || !isFinite(result)) {
        const errorResult = { 
          error: 'Calculation resulted in an invalid number',
          expression 
        };
        console.log('[DEBUG] calculate.execute invalid result:', errorResult);
        return errorResult;
      }

      const successResult = { 
        result,
        expression: sanitized,
        message: `${sanitized} = ${result}`
      };
      console.log('[DEBUG] calculate.execute returning:', successResult);
      return successResult;
    } catch (error: any) {
      const errorResult = { 
        error: 'Calculation failed',
        details: error.message,
        expression 
      };
      console.error('[DEBUG] calculate.execute error:', error, errorResult);
      return errorResult;
    }
  },
});

/**
 * すべてのツールをエクスポート
 */
export const tools = {
  getWeather,
  calculate,
};

