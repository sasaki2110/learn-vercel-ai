'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

/**
 * LangGraph チャットページ
 * 
 * 方法1: @ai-sdk/langchain アダプターを使用する方法の実装例
 * 
 * LangSmithDeploymentTransportを使用して、langgraph devで起動した
 * サーバー（http://localhost:2024）に直接接続します。
 * 
 * この方法では、バックエンドAPIルートは不要です。
 * 
 * 使用している LangGraph:
 * - URL: http://localhost:2024
 * - Graph ID: p31_streaming
 */
export default function LangGraphChatPage() {
  // AI SDK 6の新しいAPIを使用
  // バックエンドAPIルートを使用してストリーミングを確実に処理
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/langgraph',  // LangGraph API エンドポイント
    }),
  });

  // 入力フィールドの状態を手動で管理
  const [input, setInput] = useState('');

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">LangGraph チャット</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          LangGraph エージェント（p31_streaming）と対話します
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
          API: http://localhost:2024 | Assistant ID: p31_streaming
        </p>
      </div>
      
      {/* メッセージ表示エリア */}
      <div className="space-y-4 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p>メッセージを入力して LangGraph エージェントと会話を始めましょう</p>
            <p className="text-xs mt-2 text-gray-400">
              このエージェントは、トピック抽出 → トピック精緻化 → ジョーク生成の処理を行います
            </p>
          </div>
        )}
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 dark:bg-blue-900 ml-auto max-w-[80%]'
                  : 'bg-gray-100 dark:bg-gray-800 mr-auto max-w-[80%]'
              }`}
            >
              <div className="font-semibold mb-1 text-sm">
                {message.role === 'user' ? 'あなた' : 'LangGraph エージェント'}
              </div>
              {/* AI SDK 6では、message.partsからテキストを抽出 */}
              <div className="whitespace-pre-wrap space-y-2">
                {message.parts?.map((part: any, index: number) => {
                  // テキストパートの表示
                  if (part.type === 'text' && 'text' in part) {
                    return (
                      <div key={index} className="whitespace-pre-wrap">
                        {part.text}
                      </div>
                    );
                  }
                  
                  // ステップ開始（スキップ）
                  if (part.type === 'step-start') {
                    return null;
                  }
                  
                  // 推論（reasoning）パートの表示
                  if (part.type === 'reasoning' && part.text) {
                    return (
                      <div key={index} className="mt-2 p-2 bg-purple-100 dark:bg-purple-900 rounded text-sm">
                        <div className="font-semibold">💭 推論中...</div>
                        {part.text && (
                          <div className="text-gray-600 dark:text-gray-300 mt-1 text-xs">
                            {part.text}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  // ツール呼び出しの表示
                  if (part.type?.startsWith('tool-')) {
                    const toolName = part.type.replace('tool-', '');
                    const state = part.state || 'unknown';
                    
                    return (
                      <div key={index} className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-sm">
                        <div className="font-semibold">
                          🔧 ツール呼び出し: {toolName}
                          {state === 'input-streaming' && <span className="ml-2 text-xs">(入力中...)</span>}
                          {state === 'input-available' && <span className="ml-2 text-xs">(実行中...)</span>}
                          {state === 'output-available' && <span className="ml-2 text-xs">(完了)</span>}
                        </div>
                        
                        {/* 入力パラメータの表示 */}
                        {part.input && (
                          <div className="text-gray-600 dark:text-gray-300 mt-1">
                            <div className="text-xs font-semibold">パラメータ:</div>
                            <div className="text-xs font-mono bg-white dark:bg-gray-800 p-1 rounded mt-1">
                              {JSON.stringify(part.input, null, 2)}
                            </div>
                          </div>
                        )}
                        
                        {/* 出力結果の表示 */}
                        {part.output && (
                          <div className="text-gray-600 dark:text-gray-300 mt-2">
                            <div className="text-xs font-semibold">✅ 結果:</div>
                            <div className="text-xs font-mono bg-green-50 dark:bg-green-950 p-1 rounded mt-1 whitespace-pre-wrap">
                              {JSON.stringify(part.output, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </div>
          );
        })}
        {(status === 'submitted' || status === 'streaming') && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mr-auto max-w-[80%]">
            <div className="font-semibold mb-1 text-sm">LangGraph エージェント</div>
            <div className="text-gray-500">処理中...</div>
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
          <p className="text-xs mt-2 text-red-600 dark:text-red-400">
            LangGraph サーバー（http://localhost:2024）が起動しているか確認してください。
          </p>
        </div>
      )}

      {/* 入力フォーム */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
          }
        }}
        className="space-y-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力（例: プログラミングについて教えて）..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status !== 'ready'}
          />
          <button
            type="submit"
            disabled={status !== 'ready' || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {status === 'submitted' || status === 'streaming' ? '送信中...' : '送信'}
          </button>
        </div>
      </form>
    </div>
  );
}

