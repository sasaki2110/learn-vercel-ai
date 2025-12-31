# フェーズ4: 実践編 - 統合プロジェクト

このドキュメントは、これまでに学習した内容を統合して実用的なAIアプリケーションを構築するための詳細ガイドです。フェーズ1〜3で学んだ知識を活用し、ベストプラクティスを適用しながら本格的なプロジェクトを作成します。

---

## 📋 目次

1. [フェーズ4の概要](#1-フェーズ4の概要)
2. [これまでの学習内容の復習](#2-これまでの学習内容の復習)
3. [プロジェクト1: 高度なチャットボット](#3-プロジェクト1-高度なチャットボット)
4. [プロジェクト2: AI支援ドキュメント生成ツール](#4-プロジェクト2-ai支援ドキュメント生成ツール)
5. [プロジェクト3: マルチモーダルAIアプリケーション](#5-プロジェクト3-マルチモーダルaiアプリケーション)
6. [ベストプラクティス](#6-ベストプラクティス)
7. [プロジェクト構造とアーキテクチャ](#7-プロジェクト構造とアーキテクチャ)
8. [実践タスク](#8-実践タスク)
9. [トラブルシューティング](#9-トラブルシューティング)

---

## 1. フェーズ4の概要

### 1.1 目標

フェーズ4では、以下の目標を達成します：

- **統合**: フェーズ1〜3で学習した内容を統合する
- **実践**: 実用的なAIアプリケーションを構築する
- **ベストプラクティス**: プロダクション品質のコードを書く
- **拡張性**: 将来の拡張を考慮した設計

### 1.2 前提条件

フェーズ4を開始する前に、以下を完了している必要があります：

- [ ] フェーズ1: AI SDKの基礎を理解している
- [ ] フェーズ2: AI Elementsを使用できる
- [ ] フェーズ3: Streamdownを実装できる
- [ ] 基本的なNext.jsの知識がある
- [ ] TypeScriptの基礎を理解している

### 1.3 プロジェクトの選択

以下の3つのプロジェクトから選択できます：

1. **高度なチャットボット**: 最も包括的なプロジェクト
2. **AI支援ドキュメント生成ツール**: 実用的なツール
3. **マルチモーダルAIアプリケーション**: 高度な機能を学ぶ

**推奨**: まずはプロジェクト1から始め、その後プロジェクト2、3に進むことをお勧めします。

---

## 2. これまでの学習内容の復習

### 2.1 フェーズ1: AI SDK Core

**主要な概念:**
- `generateText`: テキスト生成
- `streamText`: ストリーミングテキスト生成
- `generateObject`: 構造化データ生成
- プロバイダーとモデルの選択
- API Route Handlerの作成

**重要なポイント:**
```typescript
// API Route Handlerの基本構造（AI SDK 6対応）
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = await streamText({
    model: openai('gpt-4'),
    messages: await convertToModelMessages(messages),  // AI SDK 6ではUIMessageをModelMessageに変換
  });
  return result.toUIMessageStreamResponse();  // AI SDK 6ではuseChat()がこの形式を期待
}
```

### 2.2 フェーズ2: AI Elements

**主要なコンポーネント:**
- `Message`: メッセージ表示
- `Conversation`: 会話コンテナ
- `Input`: 入力フィールド

**重要なポイント:**
```typescript
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { useChat } from '@ai-sdk/react';

const { messages } = useChat({ api: '/api/chat' });
```

### 2.3 フェーズ3: Streamdown

**主要な機能:**
- 未終了Markdownブロックのサポート
- コードブロックのハイライト
- Mermaid図の表示
- 数式表現

**重要なポイント:**
```typescript
import { Streamdown } from 'streamdown';

<Streamdown isAnimating={isLoading}>
  {message.content}
</Streamdown>
```

---

## 3. プロジェクト1: 高度なチャットボット

### 3.1 プロジェクト概要

高度なチャットボットは、以下を含む包括的なAIアプリケーションです：

- AI SDK Coreを使用したバックエンド実装
- AI Elementsを使用したフロントエンド実装
- Streamdownを使用したメッセージレンダリング
- ツール呼び出しの実装
- メッセージの永続化
- エラーハンドリング

### 3.2 プロジェクト構造

```
app/
├── api/
│   ├── chat/
│   │   └── route.ts          # チャットAPI
│   └── tools/
│       └── route.ts          # ツール呼び出しAPI
├── chat/
│   └── page.tsx              # チャットページ
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   └── ChatInput.tsx
│   └── ui/                   # shadcn/uiコンポーネント
├── lib/
│   ├── db.ts                 # データベース接続
│   └── utils.ts
└── types/
    └── chat.ts               # TypeScript型定義
```

### 3.3 実装手順

#### ステップ1: プロジェクトのセットアップ

```bash
# 必要なパッケージをインストール
npm i ai @ai-sdk/react streamdown
npm i -D @types/node
```

#### ステップ2: データベースのセットアップ（オプション）

メッセージの永続化には、データベースが必要です。例として、SQLiteを使用：

```bash
npm i better-sqlite3
npm i -D @types/better-sqlite3
```

**`lib/db.ts`**を作成：

```typescript
import Database from 'better-sqlite3';

const db = new Database('chat.db');

// メッセージテーブルの作成
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export { db };
```

#### ステップ3: API Route Handlerの作成

**`app/api/chat/route.ts`**を作成：

```typescript
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { messages, conversationId }: { messages: UIMessage[]; conversationId?: string } = await req.json();

    // メッセージをデータベースに保存（オプション）
    if (conversationId) {
      messages.forEach((msg: UIMessage) => {
        db.prepare(
          'INSERT OR REPLACE INTO messages (id, role, content) VALUES (?, ?, ?)'
        ).run(`${conversationId}-${msg.id}`, msg.role, msg.content);
      });
    }

    const result = await streamText({
      model: openai('gpt-4'),
      messages: await convertToModelMessages(messages),  // AI SDK 6ではUIMessageをModelMessageに変換
      maxTokens: 1000,
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();  // AI SDK 6ではuseChat()がこの形式を期待
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
```

#### ステップ4: ツール呼び出しの実装

**`app/api/chat/route.ts`**にツールを追加：

```typescript
import { z } from 'zod';

const tools = {
  getWeather: {
    description: 'Get the current weather for a location',
    parameters: z.object({
      location: z.string().describe('The city and state, e.g. San Francisco, CA'),
    }),
    execute: async ({ location }: { location: string }) => {
      // 実際の天気APIを呼び出す
      // ここでは例として固定値を返す
      return {
        location,
        temperature: '72°F',
        condition: 'Sunny',
      };
    },
  },
  calculate: {
    description: 'Perform a mathematical calculation',
    parameters: z.object({
      expression: z.string().describe('Mathematical expression to evaluate'),
    }),
    execute: async ({ expression }: { expression: string }) => {
      try {
        // セキュリティのため、evalは使用しない
        // 実際の実装では、安全な計算ライブラリを使用
        return { result: 'Calculation result' };
      } catch (error) {
        return { error: 'Invalid expression' };
      }
    },
  },
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await streamText({
    model: openai('gpt-4'),
    messages: await convertToModelMessages(messages),  // AI SDK 6ではUIMessageをModelMessageに変換
    tools,
  });

  return result.toUIMessageStreamResponse();  // AI SDK 6ではuseChat()がこの形式を期待
}
```

#### ステップ5: チャットインターフェースの作成

**`app/chat/page.tsx`**を作成：

```typescript
'use client';

import { Conversation } from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { Input } from '@/components/ai-elements/input';
import { Streamdown } from 'streamdown';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';

export default function ChatPage() {
  const [conversationId] = useState(() => `conv-${Date.now()}`);
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: '/api/chat',
      body: {
        conversationId,
      },
      onError: (error) => {
        console.error('Chat error:', error);
      },
    });

  // メッセージの永続化（ローカルストレージ）
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(
        `chat-${conversationId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, conversationId]);

  // メッセージの復元
  useEffect(() => {
    const saved = localStorage.getItem(`chat-${conversationId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // useChatのsetMessagesを使用して復元
      } catch (error) {
        console.error('Failed to restore messages:', error);
      }
    }
  }, [conversationId]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800 p-4">
        <h1 className="text-xl font-semibold">Advanced Chat Bot</h1>
      </header>

      {/* Messages */}
      <Conversation className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation by typing a message below.</p>
            <p className="text-sm mt-2">
              Try asking about the weather or requesting a calculation!
            </p>
          </div>
        )}
        {messages.map((message) => (
          <Message
            key={message.id}
            from={message.role}
            className="max-w-3xl mx-auto"
          >
            <MessageContent>
              <MessageResponse>
                {message.role === 'assistant' ? (
                  <Streamdown isAnimating={isLoading}>
                    {message.content}
                  </Streamdown>
                ) : (
                  message.content
                )}
              </MessageResponse>
              {message.toolInvocations && message.toolInvocations.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.toolInvocations.map((tool, index) => (
                    <div
                      key={index}
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                    >
                      <p className="font-semibold">Tool: {tool.toolName}</p>
                      <pre className="text-xs mt-1">
                        {JSON.stringify(tool.args, null, 2)}
                      </pre>
                      {tool.result && (
                        <p className="mt-1">Result: {JSON.stringify(tool.result)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
        {error && (
          <div className="max-w-3xl mx-auto p-4 bg-red-100 dark:bg-red-900 rounded">
            <p className="text-red-800 dark:text-red-200">
              Error: {error.message}
            </p>
          </div>
        )}
      </Conversation>

      {/* Input */}
      <div className="border-t bg-white dark:bg-gray-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 3.4 チェックリスト

- [ ] プロジェクト構造が正しく作成されている
- [ ] API Route Handlerが動作している
- [ ] チャットインターフェースが表示される
- [ ] ストリーミングが動作している
- [ ] ツール呼び出しが実装されている
- [ ] メッセージの永続化が動作している
- [ ] エラーハンドリングが実装されている
- [ ] ローディング状態が表示される

---

## 4. プロジェクト2: AI支援ドキュメント生成ツール

### 4.1 プロジェクト概要

AI支援ドキュメント生成ツールは、以下の機能を持つ実用的なツールです：

- テキスト生成機能
- 構造化データの生成
- Markdown形式での出力
- Streamdownを使用したリアルタイムプレビュー

### 4.2 プロジェクト構造

```
app/
├── api/
│   ├── generate/
│   │   └── route.ts          # テキスト生成API
│   └── generate-object/
│       └── route.ts          # 構造化データ生成API
├── docs/
│   └── page.tsx              # ドキュメント生成ページ
└── components/
    ├── DocumentEditor.tsx
    ├── DocumentPreview.tsx
    └── TemplateSelector.tsx
```

### 4.3 実装手順

#### ステップ1: テキスト生成APIの作成

**`app/api/generate/route.ts`**を作成：

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  try {
    const { prompt, template } = await req.json();

    const systemPrompt = template
      ? `You are a professional document writer. Generate a document following this template: ${template}`
      : 'You are a professional document writer. Generate a well-structured document.';

    const result = await streamText({
      model: openai('gpt-4'),
      system: systemPrompt,
      prompt,
      maxTokens: 2000,
    });

    return result.toUIMessageStreamResponse();  // AI SDK 6ではuseChat()がこの形式を期待
  } catch (error) {
    console.error('Generate API error:', error);
    return Response.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}
```

#### ステップ2: 構造化データ生成APIの作成

**`app/api/generate-object/route.ts`**を作成：

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const documentSchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.string(),
    })
  ),
  conclusion: z.string(),
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const { object } = await generateObject({
      model: openai('gpt-4'),
      schema: documentSchema,
      prompt,
    });

    return Response.json({ document: object });
  } catch (error) {
    console.error('Generate object API error:', error);
    return Response.json(
      { error: 'Failed to generate structured document' },
      { status: 500 }
    );
  }
}
```

#### ステップ3: ドキュメント生成ページの作成

**`app/docs/page.tsx`**を作成：

```typescript
'use client';

import { useState } from 'react';
import { Streamdown } from 'streamdown';
import { useChat } from '@ai-sdk/react';

const TEMPLATES = [
  { id: 'article', name: 'Article', prompt: 'Write an article about...' },
  { id: 'tutorial', name: 'Tutorial', prompt: 'Create a tutorial about...' },
  { id: 'api-docs', name: 'API Documentation', prompt: 'Write API documentation for...' },
];

export default function DocsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/generate',
      body: {
        template: selectedTemplate,
      },
    });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setPrompt(template.prompt);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50 dark:bg-gray-900 p-4">
        <h2 className="font-semibold mb-4">Templates</h2>
        <div className="space-y-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={`w-full text-left p-2 rounded ${
                selectedTemplate === template.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100'
              }`}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Editor */}
        <div className="border-b p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              className="w-full p-2 border rounded"
              rows={4}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Document'}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p>Select a template and enter a prompt to generate a document.</p>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className="prose max-w-none">
              <Streamdown isAnimating={isLoading}>
                {message.content}
              </Streamdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 4.4 チェックリスト

- [ ] テキスト生成APIが動作している
- [ ] 構造化データ生成APIが動作している
- [ ] ドキュメント生成ページが表示される
- [ ] テンプレート選択が動作している
- [ ] リアルタイムプレビューが表示される
- [ ] Markdownが正しくレンダリングされる

---

## 5. プロジェクト3: マルチモーダルAIアプリケーション

### 5.1 プロジェクト概要

マルチモーダルAIアプリケーションは、以下の機能を持つ高度なアプリケーションです：

- テキスト生成
- 画像生成
- 音声転写
- 統合UIの構築

### 5.2 実装手順

#### ステップ1: 画像生成APIの作成

**`app/api/generate-image/route.ts`**を作成：

```typescript
import { generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const { image } = await generateImage({
      model: openai('dall-e-3'),
      prompt,
    });

    return Response.json({ image });
  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
```

#### ステップ2: 音声転写APIの作成

**`app/api/transcribe/route.ts`**を作成：

```typescript
import { transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    const { text } = await transcribe({
      model: openai('whisper-1'),
      file,
    });

    return Response.json({ text });
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
```

#### ステップ3: 統合UIの作成

**`app/multimodal/page.tsx`**を作成：

```typescript
'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Streamdown } from 'streamdown';

export default function MultimodalPage() {
  const [mode, setMode] = useState<'text' | 'image' | 'audio'>('text');
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
    });

  const handleImageGenerate = async (prompt: string) => {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const { image } = await response.json();
    // 画像を表示
  };

  const handleAudioTranscribe = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });
    const { text } = await response.json();
    // 転写結果を表示
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Mode Selector */}
      <div className="border-b p-4 flex gap-2">
        <button
          onClick={() => setMode('text')}
          className={`px-4 py-2 rounded ${
            mode === 'text' ? 'bg-blue-500 text-white' : ''
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setMode('image')}
          className={`px-4 py-2 rounded ${
            mode === 'image' ? 'bg-blue-500 text-white' : ''
          }`}
        >
          Image
        </button>
        <button
          onClick={() => setMode('audio')}
          className={`px-4 py-2 rounded ${
            mode === 'audio' ? 'bg-blue-500 text-white' : ''
          }`}
        >
          Audio
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {mode === 'text' && (
          <div>
            {messages.map((message) => (
              <div key={message.id}>
                <Streamdown isAnimating={isLoading}>
                  {message.content}
                </Streamdown>
              </div>
            ))}
          </div>
        )}
        {mode === 'image' && (
          <div>
            {/* 画像生成UI */}
          </div>
        )}
        {mode === 'audio' && (
          <div>
            {/* 音声転写UI */}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Enter your input..."
            className="w-full p-2 border rounded"
            disabled={isLoading}
          />
        </form>
      </div>
    </div>
  );
}
```

### 5.3 チェックリスト

- [ ] テキスト生成が動作している
- [ ] 画像生成が動作している
- [ ] 音声転写が動作している
- [ ] 統合UIが表示される
- [ ] モード切り替えが動作している

---

## 6. ベストプラクティス

### 6.1 エラーハンドリング

#### API Route Handlerでのエラーハンドリング

```typescript
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  try {
    // リクエストの検証
    const { messages }: { messages: UIMessage[] } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // API呼び出し
    const result = await streamText({
      model: openai('gpt-4'),
      messages: await convertToModelMessages(messages),  // AI SDK 6ではUIMessageをModelMessageに変換
    });

    return result.toUIMessageStreamResponse();  // AI SDK 6ではuseChat()がこの形式を期待
  } catch (error) {
    // エラーログ
    console.error('API error:', error);

    // ユーザーフレンドリーなエラーメッセージ
    return Response.json(
      {
        error: 'An error occurred while processing your request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
```

#### クライアント側でのエラーハンドリング

```typescript
const { messages, error, handleSubmit } = useChat({
  api: '/api/chat',
  onError: (error) => {
    console.error('Chat error:', error);
    // エラーノティフィケーションを表示
    toast.error('Failed to send message. Please try again.');
  },
});
```

### 6.2 ローディング状態の管理

```typescript
const { isLoading, messages } = useChat({
  api: '/api/chat',
});

// ローディングインジケーター
{isLoading && (
  <div className="flex items-center gap-2">
    <Spinner />
    <span>Generating response...</span>
  </div>
)}
```

### 6.3 レート制限の考慮

```typescript
// API Route Handlerでレート制限を実装
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  // 続きの処理...
}
```

### 6.4 セキュリティ対策

#### 入力の検証

```typescript
import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(10000), // 最大文字数制限
});

export async function POST(req: Request) {
  const body = await req.json();
  const validated = messageSchema.parse(body);
  // ...
}
```

#### APIキーの保護

```typescript
// .env.localに保存（Gitにコミットしない）
OPENAI_API_KEY=your_key_here

// API Route Handlerで使用
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('API key not configured');
}
```

### 6.5 パフォーマンス最適化

#### メモ化の使用

```typescript
import { memo } from 'react';

const MemoizedStreamdown = memo(Streamdown);

function MessageContent({ content, isAnimating }: { content: string; isAnimating: boolean }) {
  return (
    <MemoizedStreamdown isAnimating={isAnimating}>
      {content}
    </MemoizedStreamdown>
  );
}
```

#### 仮想化の使用（大量のメッセージがある場合）

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
});
```

### 6.6 テストの作成

#### ユニットテストの例

```typescript
// __tests__/api/chat.test.ts
import { POST } from '@/app/api/chat/route';

describe('Chat API', () => {
  it('should return a streaming response', async () => {
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

---

## 7. プロジェクト構造とアーキテクチャ

### 7.1 推奨されるプロジェクト構造

```
learn-vercel-ai/
├── app/
│   ├── api/                    # API Route Handlers
│   ├── (routes)/               # ページルート
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ai-elements/            # AI Elementsコンポーネント
│   ├── ui/                     # shadcn/uiコンポーネント
│   └── custom/                 # カスタムコンポーネント
├── lib/
│   ├── db.ts                   # データベース接続
│   ├── utils.ts                # ユーティリティ関数
│   └── ai.ts                   # AI関連のヘルパー
├── types/
│   └── index.ts                # TypeScript型定義
├── .env.local                  # 環境変数（Gitにコミットしない）
└── package.json
```

### 7.2 アーキテクチャパターン

#### レイヤードアーキテクチャ

```
Presentation Layer (UI Components)
    ↓
Business Logic Layer (API Routes)
    ↓
Data Access Layer (Database/External APIs)
```

#### コンポーネントの分離

- **Presentational Components**: UIのみを担当
- **Container Components**: データ取得とロジックを担当
- **Shared Components**: 再利用可能なコンポーネント

---

## 8. 実践タスク

### タスク1: プロジェクト1の実装

**目標**: 高度なチャットボットを完全に実装する

**手順**:
1. プロジェクト構造を作成
2. API Route Handlerを実装
3. チャットインターフェースを実装
4. ツール呼び出しを実装
5. メッセージの永続化を実装
6. エラーハンドリングを実装

**チェックリスト**:
- [ ] すべての機能が動作している
- [ ] エラーハンドリングが実装されている
- [ ] パフォーマンスが最適化されている
- [ ] セキュリティ対策が実装されている

### タスク2: プロジェクト2の実装

**目標**: AI支援ドキュメント生成ツールを実装する

**手順**:
1. テキスト生成APIを実装
2. 構造化データ生成APIを実装
3. ドキュメント生成ページを実装
4. テンプレート機能を実装
5. リアルタイムプレビューを実装

**チェックリスト**:
- [ ] すべての機能が動作している
- [ ] テンプレートが正しく動作している
- [ ] プレビューが正しく表示される

### タスク3: プロジェクト3の実装

**目標**: マルチモーダルAIアプリケーションを実装する

**手順**:
1. 画像生成APIを実装
2. 音声転写APIを実装
3. 統合UIを実装
4. モード切り替えを実装

**チェックリスト**:
- [ ] すべてのモードが動作している
- [ ] 統合UIが正しく表示される
- [ ] モード切り替えがスムーズに動作する

### タスク4: ベストプラクティスの適用

**目標**: すべてのプロジェクトにベストプラクティスを適用する

**手順**:
1. エラーハンドリングを改善
2. ローディング状態を改善
3. レート制限を実装
4. セキュリティ対策を強化
5. パフォーマンスを最適化
6. テストを作成

**チェックリスト**:
- [ ] すべてのベストプラクティスが適用されている
- [ ] テストが作成されている
- [ ] ドキュメントが整備されている

---

## 9. トラブルシューティング

### 9.1 よくあるエラーと解決方法

#### エラー: "API key not found"
**解決方法**: `.env.local`ファイルにAPIキーが設定されているか確認

#### エラー: "Rate limit exceeded"
**解決方法**: レート制限を実装し、適切なエラーメッセージを表示

#### エラー: "Streaming not working"
**解決方法**: API Route Handlerで`toUIMessageStreamResponse()`を使用しているか確認（AI SDK 6では`useChat()`がこの形式を期待）

### 9.2 パフォーマンスの問題

#### 大量のメッセージで遅い
**解決方法**: メモ化や仮想化を使用

#### ストリーミングが遅い
**解決方法**: ネットワーク接続を確認し、必要に応じて最適化

### 9.3 デバッグのヒント

#### ログの追加

```typescript
console.log('Request:', { messages, conversationId });
console.log('Response:', response);
```

#### ブラウザの開発者ツールを使用

- ネットワークタブでAPIリクエストを確認
- コンソールでエラーを確認
- React DevToolsでコンポーネントの状態を確認

---

## 10. 次のステップ

フェーズ4を完了したら、以下のステップに進みましょう：

1. **プロジェクトの拡張**
   - 新しい機能の追加
   - 既存機能の改善

2. **デプロイ**
   - Vercelへのデプロイ
   - 本番環境での動作確認

3. **継続的な学習**
   - 新しいAI機能の探索
   - コミュニティへの参加

---

## 📚 参考リソース

### 公式ドキュメント
- [AI SDK Documentation](https://ai-sdk.dev/docs)
- [AI Elements Documentation](https://ai-sdk.dev/elements)
- [Streamdown Documentation](https://streamdown.ai/docs)

### ベストプラクティス
- [Next.js Best Practices](https://nextjs.org/docs)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)

### コミュニティ
- [GitHub Discussions](https://github.com/vercel/ai/discussions)
- [Vercel Community](https://vercel.com/community)

---

## ✅ フェーズ4完了チェックリスト

### プロジェクト実装
- [ ] プロジェクト1を実装した
- [ ] プロジェクト2を実装した
- [ ] プロジェクト3を実装した

### ベストプラクティス
- [ ] エラーハンドリングを実装した
- [ ] ローディング状態を管理している
- [ ] レート制限を考慮している
- [ ] セキュリティ対策を実装した
- [ ] パフォーマンスを最適化した
- [ ] テストを作成した

### スキル
- [ ] AI SDK Coreを活用できる
- [ ] AI Elementsを使用できる
- [ ] Streamdownを実装できる
- [ ] 統合プロジェクトを構築できる

---

**おめでとうございます！フェーズ4を完了しました！🎉**

これで、Vercel AI SDKを使った実用的なAIアプリケーションを構築するための知識とスキルを身につけました。

---

**学習ログ**:
- 開始日: ___________
- 完了日: ___________
- メモ: 

