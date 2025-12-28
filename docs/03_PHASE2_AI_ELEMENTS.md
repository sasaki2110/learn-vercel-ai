# フェーズ2: UIコンポーネント編 - AI Elements

このドキュメントは、AI Elementsを使用して美しいAIアプリケーションのUIを構築するための詳細ガイドです。事前構築されたコンポーネントを使用することで、開発時間を大幅に短縮できます。

---

## 📋 目次

1. [前提条件の確認](#1-前提条件の確認)
2. [shadcn/uiのセットアップ](#2-shadcnuiのセットアップ)
3. [AI Elementsのインストール](#3-ai-elementsのインストール)
4. [基本的なコンポーネントの理解](#4-基本的なコンポーネントの理解)
5. [チャットボットの実装](#5-チャットボットの実装)
6. [カスタマイズと拡張](#6-カスタマイズと拡張)
7. [高度な機能](#7-高度な機能)
8. [実践タスク](#8-実践タスク)
9. [トラブルシューティング](#9-トラブルシューティング)

---

## 1. 前提条件の確認

### 1.1 フェーズ1の完了確認

フェーズ1を完了していることを確認します：

- [ ] AI SDKがインストールされている
- [ ] 基本的なAPI Route Handlerが動作している
- [ ] 環境変数が正しく設定されている

確認方法：
```bash
# package.jsonにaiパッケージがあるか確認
cat package.json | grep ai

# .env.localファイルが存在するか確認
ls -la .env.local
```

### 1.2 プロジェクトの要件確認

AI Elementsを使用するには、以下の要件を満たしている必要があります：

- **Node.js**: 18以上
- **Next.js**: App Routerを使用したプロジェクト
- **React**: 19（forwardRefを使用しない）
- **Tailwind CSS**: 4

現在のプロジェクトを確認：
```bash
node --version  # 18以上であることを確認
cat package.json | grep -E "(next|react|tailwindcss)"
```

### 1.3 AI Gateway APIキーの取得（推奨）

AI Gatewayを使用すると、複数のプロバイダーを1つのAPIキーで管理できます。また、月額$5の無料クレジットが提供されます。

1. [Vercel AI Gateway](https://vercel.com/ai-gateway)にアクセス
2. アカウントを作成またはログイン
3. [APIキーを取得](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys&title=Get%20your%20AI%20Gateway%20key)
4. `.env.local`に追加：

```env
AI_GATEWAY_API_KEY=your_api_key_here
```

**注意**: AI Gatewayは推奨ですが、必須ではありません。個別のプロバイダーAPIキーでも動作します。

---

## 2. shadcn/uiのセットアップ

AI Elementsはshadcn/uiの上に構築されているため、まずshadcn/uiをセットアップする必要があります。

### 2.1 shadcn/uiの初期化

```bash
npx shadcn@latest init
```

初期化時に以下の質問が表示されます：

1. **Which style would you like to use?**
   - デフォルト: `Default`
   - 推奨: `Default`（AI Elementsと互換性が高い）

2. **Which color would you like to use as base color?**
   - デフォルト: `Slate`
   - お好みで選択可能

3. **Where is your global CSS file?**
   - デフォルト: `app/globals.css`
   - プロジェクトに合わせて調整

4. **Would you like to use CSS variables for colors?**
   - デフォルト: `Yes`
   - 推奨: `Yes`（テーマカスタマイズに便利）

5. **Where is your tailwind.config.js located?**
   - デフォルト: `tailwind.config.ts`または`tailwind.config.js`
   - プロジェクトに合わせて調整

6. **Configure the import alias for components?**
   - デフォルト: `@/components`
   - 推奨: デフォルトのまま

7. **Configure the import alias for utils?**
   - デフォルト: `@/lib/utils`
   - 推奨: デフォルトのまま

### 2.2 セットアップの確認

初期化が完了すると、以下のファイルが作成または更新されます：

- `components.json` - shadcn/uiの設定ファイル
- `app/globals.css` - CSS変数が追加される
- `lib/utils.ts` - `cn`関数が追加される（存在しない場合）

確認：
```bash
ls -la components.json
cat components.json
```

### 2.3 必要な依存関係の確認

shadcn/uiの初期化により、以下のパッケージが自動的にインストールされます：

- `class-variance-authority`
- `clsx`
- `tailwind-merge`

確認：
```bash
cat package.json | grep -E "(class-variance-authority|clsx|tailwind-merge)"
```

---

## 3. AI Elementsのインストール

### 3.1 AI Elements CLIを使用したインストール

AI Elements CLIを使用すると、インタラクティブにコンポーネントを選択してインストールできます。

```bash
npx ai-elements@latest
```

実行すると、以下のような選択肢が表示されます：

```
? What would you like to do?
  ❯ Install components
    View available components
    Update components
```

**Install components**を選択すると、利用可能なコンポーネントのリストが表示されます：

- `message` - メッセージコンポーネント
- `conversation` - 会話コンポーネント
- `input` - 入力コンポーネント
- その他のコンポーネント

### 3.2 個別コンポーネントのインストール

特定のコンポーネントのみをインストールする場合：

```bash
npx ai-elements@latest add message
npx ai-elements@latest add conversation
npx ai-elements@latest add input
```

### 3.3 shadcn/ui CLIを使用したインストール

既にshadcn/uiを使用している場合は、shadcn/ui CLIでもインストールできます：

```bash
npx shadcn@latest add [component-name]
```

ただし、AI Elements専用のコンポーネントは`ai-elements` CLIを使用することを推奨します。

### 3.4 インストール後の確認

コンポーネントが正しくインストールされたか確認：

```bash
ls -la components/ai-elements/
```

通常、以下のような構造になります：

```
components/
└── ai-elements/
    ├── message/
    │   ├── message.tsx
    │   └── ...
    ├── conversation/
    │   ├── conversation.tsx
    │   └── ...
    └── ...
```

### 3.5 コンポーネントの場所の確認

コンポーネントは`components.json`で指定されたディレクトリにインストールされます。デフォルトでは`@/components/ai-elements/`です。

確認：
```bash
cat components.json | grep components
```

---

## 4. 基本的なコンポーネントの理解

### 4.1 Messageコンポーネント

`Message`コンポーネントは、チャットメッセージを表示するための基本的なコンポーネントです。

#### 基本的な使用例

```typescript
'use client';

import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const { messages } = useChat();

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <Message key={index} from={message.role}>
          <MessageContent>
            <MessageResponse>{message.content}</MessageResponse>
          </MessageContent>
        </Message>
      ))}
    </div>
  );
}
```

#### Messageコンポーネントの主要なプロパティ

- `from`: メッセージの送信者（`'user'` | `'assistant'`）
- `className`: カスタムCSSクラス
- その他のHTML属性（`div`要素として機能）

#### MessageContentとMessageResponse

- `MessageContent`: メッセージのコンテナ
- `MessageResponse`: 実際のメッセージテキストを表示

### 4.2 Conversationコンポーネント

`Conversation`コンポーネントは、複数のメッセージを管理するためのコンテナです。

#### 基本的な使用例

```typescript
'use client';

import { Conversation } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const { messages } = useChat();

  return (
    <Conversation>
      {messages.map((message, index) => (
        <Message key={index} from={message.role}>
          <MessageContent>
            <MessageResponse>{message.content}</MessageResponse>
          </MessageContent>
        </Message>
      ))}
    </Conversation>
  );
}
```

### 4.3 Inputコンポーネント

`Input`コンポーネントは、ユーザー入力を受け取るためのコンポーネントです。

#### 基本的な使用例

```typescript
'use client';

import { Input } from '@/components/ai-elements/input';
import { useChat } from '@ai-sdk/react';

export default function ChatInput() {
  const { input, handleInputChange, handleSubmit } = useChat();

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={input}
        onChange={handleInputChange}
        placeholder="Type your message..."
      />
    </form>
  );
}
```

### 4.4 コンポーネントの拡張性

AI Elementsのコンポーネントは、通常のHTML要素と同じように拡張できます。例えば、`Message`コンポーネントは`HTMLAttributes<HTMLDivElement>`を拡張しているため、任意の`div`属性を使用できます。

```typescript
<Message
  from="user"
  className="custom-message-class"
  data-testid="user-message"
  onClick={() => console.log('Message clicked')}
>
  <MessageContent>
    <MessageResponse>Hello!</MessageResponse>
  </MessageContent>
</Message>
```

---

## 5. チャットボットの実装

### 5.1 基本的なチャットボット

フェーズ1で作成したAPI Route Handlerを使用して、AI Elementsでチャットボットを実装します。

#### API Route Handlerの確認

`app/api/chat/route.ts`が存在することを確認：

```typescript
import { streamText } from 'ai';
import { openai } from 'ai/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

#### チャットページの作成

`app/chat/page.tsx`を作成：

```typescript
'use client';

import { Conversation } from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { Input } from '@/components/ai-elements/input';
import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
    });

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat Bot</h1>
      
      <Conversation className="flex-1 overflow-y-auto mb-4">
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              <MessageResponse>{message.content}</MessageResponse>
            </MessageContent>
          </Message>
        ))}
        {isLoading && (
          <Message from="assistant">
            <MessageContent>
              <MessageResponse>Thinking...</MessageResponse>
            </MessageContent>
          </Message>
        )}
      </Conversation>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

### 5.2 ChatGPT風のインターフェース

より洗練されたUIを作成します：

```typescript
'use client';

import { Conversation } from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { Input } from '@/components/ai-elements/input';
import { useChat } from '@ai-sdk/react';
import { Send } from 'lucide-react';

export default function ChatGPTPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
    });

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800 p-4">
        <h1 className="text-xl font-semibold">ChatGPT</h1>
      </header>

      {/* Messages */}
      <Conversation className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Start a conversation by typing a message below.
          </div>
        )}
        {messages.map((message) => (
          <Message
            key={message.id}
            from={message.role}
            className="max-w-3xl mx-auto"
          >
            <MessageContent>
              <MessageResponse>{message.content}</MessageResponse>
            </MessageContent>
          </Message>
        ))}
        {isLoading && (
          <Message from="assistant" className="max-w-3xl mx-auto">
            <MessageContent>
              <MessageResponse>
                <span className="animate-pulse">Thinking...</span>
              </MessageResponse>
            </MessageContent>
          </Message>
        )}
      </Conversation>

      {/* Input */}
      <div className="border-t bg-white dark:bg-gray-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Message ChatGPT..."
            disabled={isLoading}
            className="flex-1"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 5.3 Claude風のインターフェース

Claude風のインターフェースを作成：

```typescript
'use client';

import { Conversation } from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { Input } from '@/components/ai-elements/input';
import { useChat } from '@ai-sdk/react';

export default function ClaudePage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
    });

  return (
    <div className="flex flex-col h-screen bg-[#f7f7f5] dark:bg-[#1a1a1a]">
      <div className="flex-1 overflow-y-auto p-6">
        <Conversation className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <Message
              key={message.id}
              from={message.role}
              className="rounded-lg"
            >
              <MessageContent>
                <MessageResponse className="prose dark:prose-invert">
                  {message.content}
                </MessageResponse>
              </MessageContent>
            </Message>
          ))}
        </Conversation>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Message Claude..."
            disabled={isLoading}
            className="w-full"
          />
        </form>
      </div>
    </div>
  );
}
```

### 5.4 カスタムプロンプトボタンの実装

よく使うプロンプトをボタンとして表示：

```typescript
'use client';

import { Conversation } from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { Input } from '@/components/ai-elements/input';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

const PROMPT_SUGGESTIONS = [
  { label: 'Analyze data', prompt: 'Analyze the following data and provide insights:' },
  { label: 'Surprise me', prompt: 'Tell me something interesting and unexpected.' },
  { label: 'Summarize text', prompt: 'Summarize the following text:' },
  { label: 'Code', prompt: 'Write code to solve the following problem:' },
  { label: 'Get advice', prompt: 'I need advice on the following topic:' },
];

export default function ChatWithSuggestions() {
  const { messages, input, handleInputChange, handleSubmit, setInput, isLoading } =
    useChat({
      api: '/api/chat',
    });

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <Conversation className="flex-1 overflow-y-auto mb-4">
        {messages.length === 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-500">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => handleSuggestionClick(suggestion.prompt)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              <MessageResponse>{message.content}</MessageResponse>
            </MessageContent>
          </Message>
        ))}
      </Conversation>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

---

## 6. カスタマイズと拡張

### 6.1 コンポーネントのカスタマイズ

AI Elementsのコンポーネントは、プロジェクト内のコードとして存在するため、直接編集してカスタマイズできます。

#### Messageコンポーネントのカスタマイズ例

`components/ai-elements/message/message.tsx`を編集：

```typescript
// 元のコードを確認
// 必要に応じてスタイルや機能を追加

export const Message = ({ from, className, children, ...props }) => {
  return (
    <div
      className={cn(
        'message-base-styles',
        from === 'user' && 'user-specific-styles',
        from === 'assistant' && 'assistant-specific-styles',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

#### カスタムスタイルの追加

`app/globals.css`にカスタムスタイルを追加：

```css
/* カスタムメッセージスタイル */
.message-custom {
  @apply rounded-lg p-4 shadow-sm;
}

.message-user {
  @apply bg-blue-500 text-white ml-auto;
}

.message-assistant {
  @apply bg-gray-100 dark:bg-gray-800 mr-auto;
}
```

### 6.2 コンポーネントの再インストール時の注意

コンポーネントを再インストールする場合、CLIは既存のファイルを上書きする前に確認を求めます：

```
? File already exists. Overwrite? (y/N)
```

カスタマイズを保持したい場合は、`N`を選択し、手動でマージするか、変更を別ファイルに保存しておきます。

### 6.3 拡張コンポーネントの作成

既存のコンポーネントを拡張して、新しいコンポーネントを作成できます：

```typescript
// components/ai-elements/custom-message.tsx
'use client';

import {
  Message as BaseMessage,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { Avatar } from '@/components/ui/avatar';

interface CustomMessageProps {
  from: 'user' | 'assistant';
  content: string;
  avatar?: string;
}

export function CustomMessage({ from, content, avatar }: CustomMessageProps) {
  return (
    <BaseMessage from={from} className="flex gap-3">
      {avatar && <Avatar src={avatar} />}
      <MessageContent>
        <MessageResponse>{content}</MessageResponse>
      </MessageContent>
    </BaseMessage>
  );
}
```

---

## 7. 高度な機能

### 7.1 メッセージの永続化（Message Persistence）

メッセージをデータベースやローカルストレージに保存：

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect } from 'react';

export default function PersistentChat() {
  const { messages, setMessages } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      // メッセージをローカルストレージに保存
      const savedMessages = JSON.parse(
        localStorage.getItem('chat-messages') || '[]'
      );
      savedMessages.push(message);
      localStorage.setItem('chat-messages', JSON.stringify(savedMessages));
    },
  });

  useEffect(() => {
    // ページ読み込み時に保存されたメッセージを復元
    const savedMessages = JSON.parse(
      localStorage.getItem('chat-messages') || '[]'
    );
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    }
  }, [setMessages]);

  // ... 残りのコンポーネント
}
```

### 7.2 ストリームの再開（Resume Streams）

接続が切れた場合にストリームを再開：

```typescript
'use client';

import { useChat } from '@ai-sdk/react';

export default function ResumableChat() {
  const { messages, reload } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
      // エラー時にストリームを再開
      if (error.message.includes('stream')) {
        setTimeout(() => reload(), 1000);
      }
    },
  });

  // ... コンポーネントの実装
}
```

### 7.3 ツールの使用（Tool Usage）

ツール呼び出しを表示：

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';

export default function ChatWithTools() {
  const { messages } = useChat({
    api: '/api/chat',
  });

  return (
    <div>
      {messages.map((message) => (
        <Message key={message.id} from={message.role}>
          <MessageContent>
            <MessageResponse>{message.content}</MessageResponse>
            {message.toolInvocations && (
              <div className="mt-2 space-y-2">
                {message.toolInvocations.map((tool, index) => (
                  <div key={index} className="p-2 bg-gray-100 rounded">
                    <p className="font-semibold">Tool: {tool.toolName}</p>
                    <pre className="text-xs">
                      {JSON.stringify(tool.args, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </MessageContent>
        </Message>
      ))}
    </div>
  );
}
```

### 7.4 生成的なユーザーインターフェース（Generative UI）

動的にUIを生成：

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { Message, MessageContent } from '@/components/ai-elements/message';

export default function GenerativeUI() {
  const { messages } = useChat({
    api: '/api/chat',
  });

  return (
    <div>
      {messages.map((message) => (
        <Message key={message.id} from={message.role}>
          <MessageContent>
            {message.experimental_attachments?.map((attachment, index) => {
              // 画像の場合
              if (attachment.contentType?.startsWith('image/')) {
                return (
                  <img
                    key={index}
                    src={attachment.url}
                    alt="Generated content"
                    className="max-w-full rounded"
                  />
                );
              }
              // その他のコンテンツタイプ
              return null;
            })}
          </MessageContent>
        </Message>
      ))}
    </div>
  );
}
```

---

## 8. 実践タスク

### タスク1: 基本的なチャットボットの作成

**目標**: AI Elementsを使用して基本的なチャットボットを実装する

**手順**:
1. AI Elements CLIで`message`と`conversation`コンポーネントをインストール
2. 基本的なチャットページを作成
3. API Route Handlerと連携
4. 動作確認

**チェックリスト**:
- [ ] コンポーネントが正しくインストールされている
- [ ] メッセージが表示される
- [ ] ストリーミングが動作する
- [ ] ユーザー入力が正しく処理される

### タスク2: ChatGPT風のインターフェースの作成

**目標**: ChatGPTのような洗練されたUIを作成する

**手順**:
1. ヘッダーを追加
2. メッセージエリアのスタイリング
3. 入力エリアの改善
4. ダークモード対応

**チェックリスト**:
- [ ] 見た目がChatGPTに似ている
- [ ] レスポンシブデザインが実装されている
- [ ] ダークモードが動作する

### タスク3: カスタムプロンプトボタンの実装

**目標**: よく使うプロンプトをボタンとして表示する

**手順**:
1. プロンプト候補の配列を作成
2. ボタンコンポーネントを実装
3. クリック時にプロンプトを入力欄に設定
4. スタイリング

**チェックリスト**:
- [ ] プロンプトボタンが表示される
- [ ] クリックでプロンプトが入力される
- [ ] UIが使いやすい

### タスク4: メッセージの永続化の実装

**目標**: メッセージをローカルストレージに保存し、ページリロード後も保持する

**手順**:
1. `onFinish`コールバックでメッセージを保存
2. `useEffect`でメッセージを復元
3. 動作確認

**チェックリスト**:
- [ ] メッセージが保存される
- [ ] ページリロード後もメッセージが表示される
- [ ] エラーハンドリングが実装されている

---

## 9. トラブルシューティング

### 9.1 よくあるエラーと解決方法

#### エラー: "Module not found: Can't resolve '@/components/ai-elements/message'"
**原因**: コンポーネントがインストールされていない、またはパスが間違っている

**解決方法**:
1. コンポーネントがインストールされているか確認：
   ```bash
   ls -la components/ai-elements/
   ```
2. `components.json`のパス設定を確認
3. 必要に応じて再インストール：
   ```bash
   npx ai-elements@latest add message
   ```

#### エラー: "shadcn/ui is not initialized"
**原因**: shadcn/uiが初期化されていない

**解決方法**:
```bash
npx shadcn@latest init
```

#### エラー: "Tailwind CSS classes not working"
**原因**: Tailwind CSSの設定が正しくない

**解決方法**:
1. `tailwind.config.ts`を確認
2. `app/globals.css`にTailwindディレクティブがあるか確認：
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
3. サーバーを再起動

#### エラー: "Component styles look broken"
**原因**: CSS変数が正しく設定されていない

**解決方法**:
1. `app/globals.css`にCSS変数が定義されているか確認
2. shadcn/uiの初期化を再実行：
   ```bash
   npx shadcn@latest init
   ```

### 9.2 デバッグのヒント

#### コンポーネントの確認
インストールされたコンポーネントのコードを直接確認：

```bash
cat components/ai-elements/message/message.tsx
```

#### ブラウザの開発者ツールを使用
- コンポーネントのDOM構造を確認
- CSSクラスが正しく適用されているか確認
- コンソールエラーを確認

#### ログの追加
```typescript
console.log('Messages:', messages);
console.log('Input:', input);
```

### 9.3 パフォーマンスの最適化

#### メッセージの仮想化
大量のメッセージがある場合、仮想化を検討：

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// 仮想化の実装
```

#### メモ化の使用
不要な再レンダリングを防ぐ：

```typescript
import { memo } from 'react';

const MessageComponent = memo(({ message }) => {
  // ...
});
```

---

## 10. 次のステップ

フェーズ2を完了したら、以下のステップに進みましょう：

1. **フェーズ3: ストリーミング最適化編（Streamdown）**
   - Markdownレンダリングの最適化
   - ストリーミング中のMarkdown表示の改善

2. **高度な機能の学習**
   - ツール呼び出しの詳細な実装
   - エージェントの構築
   - マルチモーダル対応

3. **実践プロジェクト**
   - フェーズ4で統合プロジェクトを構築

---

## 📚 参考リソース

### 公式ドキュメント
- [AI Elements Introduction](https://ai-sdk.dev/elements)
- [AI Elements Usage](https://ai-sdk.dev/elements/usage)
- [AI Elements Examples](https://ai-sdk.dev/elements/examples)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

### コード例
- [Chatbot Example](https://ai-sdk.dev/elements/examples/chatbot)
- [v0 Clone Example](https://ai-sdk.dev/elements/examples/v0)
- [Workflow Example](https://ai-sdk.dev/elements/examples/workflow)

### コミュニティ
- [GitHub Discussions](https://github.com/vercel/ai/discussions)
- [AI Elements GitHub](https://github.com/vercel/ai-elements)

---

## ✅ フェーズ2完了チェックリスト

### 環境準備
- [ ] shadcn/uiが初期化されている
- [ ] AI Elementsがインストールされている
- [ ] コンポーネントが正しく動作している

### コンポーネントの理解
- [ ] Messageコンポーネントを理解している
- [ ] Conversationコンポーネントを理解している
- [ ] Inputコンポーネントを理解している
- [ ] コンポーネントの拡張方法を理解している

### 実装スキル
- [ ] 基本的なチャットボットを実装できる
- [ ] カスタムスタイルを適用できる
- [ ] コンポーネントをカスタマイズできる
- [ ] 高度な機能を実装できる

### 実践タスク
- [ ] 基本的なチャットボットを作成した
- [ ] ChatGPT風のインターフェースを作成した
- [ ] カスタムプロンプトボタンを実装した
- [ ] メッセージの永続化を実装した

---

**次のステップ**: [フェーズ3: ストリーミング最適化編（Streamdown）](../01_LEARNING_PLAN.md#フェーズ3-ストリーミング最適化編---streamdown)に進みましょう！

---

**学習ログ**:
- 開始日: ___________
- 完了日: ___________
- メモ: 

