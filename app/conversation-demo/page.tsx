'use client';

import { Conversation } from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

/**
 * 4.2 Conversationコンポーネントも使ったサンプル
 * 
 * このページは、AI ElementsのConversationコンポーネントとMessageコンポーネントを
 * 組み合わせた使用方法を示しています。
 * 
 * 主なポイント:
 * - Conversation: 複数のメッセージを管理するためのコンテナ
 * - Message: メッセージのコンテナ（fromプロパティでuser/assistantを指定）
 * - MessageContent: メッセージの内容を包むコンテナ
 * - MessageResponse: 実際のメッセージテキストを表示（Streamdownを使用してMarkdownをレンダリング）
 * - PromptInput: 高度な入力コンポーネント（ファイル添付、Enter送信、Shift+Enter改行対応）
 */
export default function ConversationDemoPage() {
  // AI SDK 6の新しいAPIを使用
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  // メッセージの内容を取得するヘルパー関数
  // AI SDK 6では、message.partsからテキストを抽出する必要があります
  const getMessageText = (message: any) => {
    if (message.parts) {
      const textParts = message.parts
        .filter((p: any) => p.type === 'text' && 'text' in p)
        .map((p: any) => p.text);
      return textParts.join('');
    }
    return message.content || '';
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">4.2 Conversationコンポーネント サンプル</h1>
        <p className="text-gray-600 dark:text-gray-400">
          AI ElementsのConversationコンポーネントとMessageコンポーネントを組み合わせたチャットインターフェース
        </p>
      </div>

      {/* Conversationコンポーネントでメッセージ表示エリアを囲む */}
      <Conversation className="mb-6 min-h-[400px] p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p>メッセージを入力して会話を始めましょう</p>
            <p className="text-sm mt-2">
              Conversationコンポーネントがメッセージを管理します
            </p>
          </div>
        )}
        
        {messages.map((message) => {
          const messageText = getMessageText(message);
          
          return (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                <MessageResponse>{messageText}</MessageResponse>
              </MessageContent>
            </Message>
          );
        })}

        {/* ローディング中の表示 */}
        {(status === 'submitted' || status === 'streaming') && (
          <Message from="assistant">
            <MessageContent>
              <MessageResponse>考え中...</MessageResponse>
            </MessageContent>
          </Message>
        )}
      </Conversation>

      {/* PromptInputコンポーネントを使用した入力フォーム */}
      <PromptInput
        onSubmit={async (message) => {
          if (message.text.trim()) {
            sendMessage({ text: message.text });
          }
        }}
        className="space-y-4"
      >
        <PromptInputTextarea
          placeholder="メッセージを入力... (Enterで送信、Shift+Enterで改行)"
          disabled={status !== 'ready'}
        />
        <PromptInputSubmit
          disabled={status !== 'ready'}
        >
          {status === 'submitted' || status === 'streaming' ? '送信中...' : '送信'}
        </PromptInputSubmit>
      </PromptInput>

      {/* コード例の説明 */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">使用しているコンポーネント</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Conversation</code>: 
            複数のメッセージを管理するためのコンテナ。メッセージ間のスタイリングやレイアウトを提供
          </li>
          <li>
            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Message</code>: 
            メッセージのコンテナ。fromプロパティで'user'または'assistant'を指定
          </li>
          <li>
            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">MessageContent</code>: 
            メッセージの内容を包むコンテナ。スタイリングを提供
          </li>
          <li>
            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">MessageResponse</code>: 
            実際のメッセージテキストを表示。Streamdownを使用してMarkdownをレンダリング
          </li>
          <li>
            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">PromptInput</code>: 
            高度な入力コンポーネント。ファイル添付、ドラッグ&ドロップ、Enter送信、Shift+Enter改行、日本語入力（IME）対応
          </li>
          <li>
            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">PromptInputTextarea</code>: 
            テキスト入力エリア。自動リサイズ、Enter送信、ペースト時のファイル処理
          </li>
          <li>
            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">PromptInputSubmit</code>: 
            送信ボタン。状態に応じた自動無効化
          </li>
        </ul>
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold mb-1">💡 Conversationコンポーネントの利点:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-700 dark:text-gray-300">
            <li>メッセージ間の適切な間隔とレイアウトを自動的に管理</li>
            <li>スクロール可能な会話エリアのスタイリング</li>
            <li>複数のメッセージをグループ化して管理</li>
          </ul>
        </div>
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-800">
          <p className="text-sm font-semibold mb-1">✨ PromptInputコンポーネントの特徴:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-700 dark:text-gray-300">
            <li>Enterキーで送信、Shift+Enterで改行</li>
            <li>日本語入力（IME）の適切な処理</li>
            <li>ファイル添付機能（ドラッグ&ドロップ、クリップボードからのペースト）</li>
            <li>自動リサイズするテキストエリア</li>
            <li>統一されたスタイリングとダークモード対応</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

