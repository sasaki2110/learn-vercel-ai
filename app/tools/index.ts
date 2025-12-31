import { z } from 'zod';

/**
 * クライアント側で使用するツール定義
 * 
 * このファイルは、クライアント側でツールの型定義や説明を参照する場合に使用します。
 * 実際のツール実行はサーバー側（app/api/tools）で行われます。
 */

/**
 * 天気情報を取得するツールの型定義
 */
export const getWeatherSchema = z.object({
  location: z.string().describe("The city and state, e.g. San Francisco, CA"),
});

/**
 * 数学計算を実行するツールの型定義
 */
export const calculateSchema = z.object({
  expression: z.string().describe("Mathematical expression to evaluate"),
});

/**
 * ツールの説明
 */
export const toolDescriptions = {
  getWeather: "Get the current weather for a location",
  calculate: "Perform a mathematical calculation",
} as const;

