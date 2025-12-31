'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect } from 'react';

export default function ChatPage() {
  // useChatフックを使用してチャットの状態を管理
  // messages: メッセージ履歴の配列
  // input: 入力フィールドの値
  // handleInputChange: 入力フィールドの変更ハンドラ
  // handleSubmit: フォーム送信ハンドラ
  // isLoading: ローディング状態
  // error: エラー状態
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',  // チャットAPIのエンドポイント
  });

  // デバッグ用: useChatの戻り値を確認
  useEffect(() => {
    console.log('useChat values:', {
      input,
      hasHandleInputChange: !!handleInputChange,
      hasHandleSubmit: !!handleSubmit,
      isLoading,
      error,
    });
  }, [input, handleInputChange, handleSubmit, isLoading, error]);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Chat with AI</h1>
      
      {/* メッセージ表示エリア */}
      <div className="space-y-4 mb-6 min-h-[400px]">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p>メッセージを入力して会話を始めましょう</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 dark:bg-blue-900 ml-auto max-w-[80%]'
                : 'bg-gray-100 dark:bg-gray-800 mr-auto max-w-[80%]'
            }`}
          >
            <div className="font-semibold mb-1 text-sm">
              {message.role === 'user' ? 'あなた' : 'AI'}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mr-auto max-w-[80%]">
            <div className="font-semibold mb-1 text-sm">AI</div>
            <div className="text-gray-500">考え中...</div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 rounded">
          <h2 className="font-bold mb-2 text-red-800 dark:text-red-200">エラー:</h2>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
            {error.message || 'エラーが発生しました。もう一度お試しください。'}
          </pre>
        </div>
      )}

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input ?? ''}
            onChange={handleInputChange}
            placeholder="メッセージを入力..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !(input ?? '').trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </div>
      </form>
    </div>
  );
}

