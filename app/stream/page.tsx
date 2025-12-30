'use client';

import { useCompletion } from '@ai-sdk/react';

export default function StreamPage() {
  // useCompletionフックを使用してストリーミングを処理
  // completion: 現在の完了テキスト
  // input: 入力フィールドの値
  // handleInputChange: 入力フィールドの変更ハンドラ
  // handleSubmit: フォーム送信ハンドラ
  // isLoading: ローディング状態
  // error: エラー状態
  const { completion, input, handleInputChange, handleSubmit, isLoading, error } = useCompletion({
    api: '/api/stream',  // ストリーミングAPIのエンドポイント
  });

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Streaming Text Generation</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Enter your prompt..."
          className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
          rows={4}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
        >
          {isLoading ? 'Streaming...' : 'Stream'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 rounded">
          <h2 className="font-bold mb-2 text-red-800 dark:text-red-200">Error:</h2>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
            {error.message || 'An error occurred while streaming text. Please try again.'}
          </pre>
        </div>
      )}

      {completion && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h2 className="font-bold mb-2">Streaming Result:</h2>
          <p className="whitespace-pre-wrap">{completion}</p>
        </div>
      )}
    </div>
  );
}

