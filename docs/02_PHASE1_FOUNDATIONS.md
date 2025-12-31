# フェーズ1: 基礎編 - AI SDK Getting Started

このドキュメントは、Vercel AI SDKの基礎を学習するための詳細ガイドです。段階的に進めながら、実際にコードを書いて動作確認をしていきましょう。

---

## 📋 目次

1. [環境準備](#1-環境準備)
2. [AI SDKのインストール](#2-ai-sdkのインストール)
3. [基礎概念の理解](#3-基礎概念の理解)
4. [Next.js App Routerでの実装](#4-nextjs-app-routerでの実装)
5. [実践タスク](#5-実践タスク)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. 環境準備

### 1.1 前提条件の確認

#### Node.jsのバージョン確認
```bash
node --version
```
**要件**: Node.js 18以上が必要です。

もし古いバージョンがインストールされている場合は、[Node.js公式サイト](https://nodejs.org/)から最新のLTS版をインストールしてください。

#### Next.jsプロジェクトの確認
現在のプロジェクトがNext.jsであることを確認します：

```bash
cat package.json | grep next
```

プロジェクトの構造を確認：
```bash
ls -la
```

### 1.2 プロジェクト構造の理解

Next.js App Routerを使用する場合、以下のような構造になります：

```
learn-vercel-ai/
├── app/
│   ├── api/
│   │   └── chat/          # API Route Handler
│   ├── page.tsx            # メインページ
│   └── layout.tsx
├── package.json
└── .env.local              # 環境変数（後で作成）
```

---

## 2. AI SDKのインストール

### 2.1 パッケージのインストール

```bash
npm i ai
```

インストールが完了したら、`package.json`に`ai`パッケージが追加されていることを確認します：

```bash
cat package.json | grep ai
```

### 2.2 プロバイダーの選択とAPIキーの設定

AI SDKを使用するには、AIプロバイダーのAPIキーが必要です。以下のいずれかを選択できます：

#### オプション1: AI Gateway（推奨）
AI Gatewayを使用すると、複数のプロバイダーを1つのAPIキーで管理できます。

1. [Vercel AI Gateway](https://vercel.com/ai-gateway)にアクセス
2. APIキーを取得
3. `.env.local`ファイルを作成（プロジェクトルートに）

```bash
touch .env.local
```

4. `.env.local`に以下を追加：

```env
AI_GATEWAY_API_KEY=your_api_key_here
```

#### オプション2: 個別のプロバイダー

**OpenAIを使用する場合:**
```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Anthropic (Claude)を使用する場合:**
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Google (Gemini)を使用する場合:**
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
```

### 2.3 環境変数の確認

`.env.local`ファイルが`.gitignore`に含まれていることを確認します（機密情報のため）：

```bash
cat .gitignore | grep .env.local
```

もし含まれていない場合は、`.gitignore`に追加してください。

---

## 3. 基礎概念の理解

### 3.1 AI SDKとは

AI SDKは、複数のAIプロバイダー（OpenAI、Anthropic、Googleなど）を統一されたAPIで使用できるようにするライブラリです。

**主な利点:**
- プロバイダー間の切り替えが容易
- 統一されたAPI
- ストリーミング対応
- 型安全性

### 3.2 主要な概念

#### 3.2.1 Providers and Models（プロバイダーとモデル）

**プロバイダー**: AIサービスを提供する企業（例: OpenAI、Anthropic）
**モデル**: プロバイダーが提供する具体的なAIモデル（例: `gpt-4`、`claude-3-opus`）

##### モデル指定の方法

AI SDKでは、モデルを指定する方法が2つあります：

**方法1: AI Gatewayを使用する場合（文字列形式）**

```typescript
// AI Gatewayを使用する場合
const model = "openai/gpt-4";           // OpenAIのGPT-4
const model = "openai/gpt-4-turbo";     // OpenAIのGPT-4 Turbo
const model = "openai/gpt-4o";          // OpenAIのGPT-4o
const model = "openai/gpt-3.5-turbo";   // OpenAIのGPT-3.5 Turbo
const model = "anthropic/claude-3-opus"; // AnthropicのClaude 3 Opus
const model = "google/gemini-pro";       // GoogleのGemini Pro
```

**方法2: 直接プロバイダーを使用する場合（関数形式）**

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

// OpenAIを直接使用
const model = openai('gpt-4');
const model = openai('gpt-4-turbo');
const model = openai('gpt-4o');
const model = openai('gpt-3.5-turbo');

// Anthropicを直接使用
const model = anthropic('claude-3-opus-20240229');

// Googleを直接使用
const model = google('gemini-pro');
```

##### OpenAIモデルの使用について

**重要なポイント:**

1. **OpenAI APIで利用可能なモデルは、基本的にAI SDKでも使用可能です**
   - OpenAIの価格ページ（https://platform.openai.com/docs/pricing）に記載されているモデルは、OpenAI APIで利用可能であれば、AI SDKでも使用できます
   - ただし、モデル名は正確に指定する必要があります

2. **モデル名の指定方法**
   - AI Gatewayを使用する場合: `"openai/gpt-4"` のような形式
   - 直接OpenAIを使用する場合: `openai('gpt-4')` のような形式

3. **利用可能なモデルの確認**
   - OpenAI APIで利用可能なモデルは、[OpenAI Models Documentation](https://platform.openai.com/docs/models)で確認できます
   - 最新のモデル（例: `gpt-4o`, `gpt-4-turbo`）も使用可能です

4. **注意事項**
   - モデル名は正確に指定する必要があります（例: `gpt-5-nano`, `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`）
   - モデル名は正確に指定する必要があります（大文字小文字を区別）
   - 新しいモデルがリリースされた場合、AI SDKの更新が必要な場合があります

**使用例:**

```typescript
// AI Gatewayを使用する場合
import { streamText } from 'ai';

const result = await streamText({
  model: "openai/gpt-4o",  // 最新のGPT-4oモデル
  prompt: "Hello, world!",
});

// 直接OpenAIを使用する場合
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await streamText({
  model: openai('gpt-4o'),  // 最新のGPT-4oモデル
  prompt: "Hello, world!",
});
```

**よく使用されるOpenAIモデル:**

- `gpt-4o`: 最新のGPT-4モデル（2024年5月リリース）
- `gpt-4-turbo`: GPT-4 Turbo
- `gpt-4`: GPT-4
- `gpt-3.5-turbo`: GPT-3.5 Turbo（コスト効率が良い）
- `o1-preview`: 推論最適化モデル（2024年1月リリース）
- `o1-mini`: 推論最適化モデルの軽量版

**モデルの選択ガイド:**

- **コスト効率を重視**: `gpt-3.5-turbo`
- **バランス**: `gpt-4o` または `gpt-4-turbo`
- **最高品質**: `gpt-4` または `o1-preview`
- **推論タスク**: `o1-preview` または `o1-mini`

#### 3.2.2 Prompts（プロンプト）

プロンプトは、AIモデルに入力するテキストです。適切なプロンプトを書くことで、より良い結果を得られます。

```typescript
const prompt = "What is the capital of Japan?";
```

**プロンプトエンジニアリングのヒント:**
- 明確で具体的な指示を書く
- 必要なコンテキストを含める
- 出力形式を指定する（必要に応じて）

#### 3.2.3 Streaming（ストリーミング）

ストリーミングは、AIの応答をリアルタイムで受信する機能です。ユーザーは応答の完了を待たずに、生成されたテキストを順次確認できます。

```typescript
// ストリーミングの例
const stream = await streamText({
  model: "openai/gpt-4",
  prompt: "Tell me a story",
});

for await (const chunk of stream.textStream) {
  console.log(chunk);
}
```

#### 3.2.4 Tools（ツール）

ツールは、AIモデル（LLM）が外部機能を呼び出すための仕組みです。例えば、天気情報を取得したり、データベースを検索したりできます。

**Tools機能の仕組み:**

Toolsは、**呼び出しているLLMへツールを提供する**機能です。開発者がツールを定義してLLMに提供すると、LLMが会話の文脈を判断して、必要に応じて自動的にツールを呼び出します。

**動作フロー:**

1. **開発者がツールを定義**
   - `description`: LLMがこのツールを理解するための説明
   - `parameters`: ツールが受け取るパラメータの定義（Zodスキーマ）
   - `execute`: 実際に実行される関数

2. **`streamText()`や`generateText()`にツールを渡す**
   - `tools`パラメータとしてツール定義を渡す

3. **LLMが会話の文脈を判断し、必要に応じてツールを呼び出す**
   - ユーザーの質問を理解し、「このツールを使う必要がある」と判断
   - 適切なパラメータでツールを呼び出す

4. **AI SDKがツールの`execute`関数を実行**
   - 実行結果を取得

5. **実行結果をLLMに返す**
   - LLMがツールの実行結果を受け取り、それを基に最終的な回答を生成

**重要なポイント:**

- **LLMが自動で判断**: 開発者がツールを呼び出すタイミングを指定する必要はありません。LLMが会話の文脈から自動的に判断します。
- **ループ処理は不要**: AI SDKがツール呼び出しのループを自動で処理します。自前でReactループなどを作成する必要はありません。
- **複数ツールの連鎖**: LLMが必要に応じて複数のツールを順番に呼び出すことも可能です。

**基本的な使用例:**

```typescript
import { z } from 'zod';

const tools = {
  getWeather: {
    description: "Get the current weather for a location",
    parameters: z.object({
      location: z.string().describe("The city and state, e.g. San Francisco, CA"),
    }),
    execute: async ({ location }) => {
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
    description: "Perform a mathematical calculation",
    parameters: z.object({
      expression: z.string().describe("Mathematical expression to evaluate"),
    }),
    execute: async ({ expression }) => {
      // セキュリティのため、evalは使用しない
      // 実際の実装では、安全な計算ライブラリを使用
      try {
        // 例: 簡単な計算のみを許可
        if (/^[\d+\-*/().\s]+$/.test(expression)) {
          // 安全な計算処理
          return { result: 'Calculation result' };
        }
        return { error: 'Invalid expression' };
      } catch (error) {
        return { error: 'Calculation failed' };
      }
    },
  },
};

// streamText()にツールを渡す
const result = await streamText({
  model: openai('gpt-5-nano'),
  messages: await convertToModelMessages(messages),
  tools,  // ← ここでLLMにツールを提供
});
```

**使用例の動作:**

```
ユーザー: "東京の天気を教えて"
↓
LLM: 「getWeatherツールを呼び出す必要がある」と判断
↓
AI SDK: getWeather.execute({ location: "Tokyo" })を実行
↓
結果: { location: "Tokyo", temperature: "72°F", condition: "Sunny" }
↓
LLM: 結果を受け取り、最終的な回答を生成
↓
LLM: "東京の現在の天気は晴れで、気温は72°Fです。"
```

**複数ツールの連鎖例:**

```
ユーザー: "東京の天気を教えて、それからその気温を摂氏に変換して"
↓
1. LLMがgetWeather({ location: "Tokyo" })を呼び出す
2. 結果: { temperature: '72°F' }
3. LLMがconvertTemperature({ fahrenheit: 72 })を呼び出す（もしそのツールがあれば）
4. 最終的な回答を生成
```

### 3.3 主要なAPI

#### generateText
テキストを生成する基本的な関数：

```typescript
import { generateText } from "ai";

const { text } = await generateText({
  model: "openai/gpt-4",
  prompt: "What is AI?",
});
```

#### streamText
ストリーミングでテキストを生成：

```typescript
import { streamText } from "ai";

const result = await streamText({
  model: "openai/gpt-4",
  prompt: "Write a poem",
});
```

#### generateObject
構造化されたデータを生成：

```typescript
import { generateObject } from "ai";
import { z } from "zod";

const { object } = await generateObject({
  model: "openai/gpt-4",
  schema: z.object({
    name: z.string(),
    age: z.number(),
  }),
  prompt: "Generate a person",
});
```

---

## 4. Next.js App Routerでの実装

### 4.1 プロジェクト構造の準備

Next.js App Routerを使用する場合、以下の構造で実装します：

```
app/
├── api/
│   └── chat/
│       └── route.ts        # API Route Handler
├── page.tsx                # クライアントコンポーネント
└── layout.tsx
```

### 4.2 API Route Handlerの作成

まず、AI SDKを使用するAPI Route Handlerを作成します。

**`app/api/chat/route.ts`**を作成：

```typescript
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';

// ストリーミングレスポンスを返すAPI Route
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await streamText({
    model: openai('gpt-4'),
    messages: await convertToModelMessages(messages),  // AI SDK 6ではUIMessageをModelMessageに変換
  });

  return result.toUIMessageStreamResponse();  // AI SDK 6ではuseChat()がこの形式を期待
}
```

**注意**: AI SDK v6では、プロバイダーは別パッケージからインポートします。プロバイダーによってインポートが異なります：

- OpenAI: `import { openai } from '@ai-sdk/openai';` （`@ai-sdk/openai`パッケージをインストールする必要があります）
- Anthropic: `import { anthropic } from '@ai-sdk/anthropic';` （`@ai-sdk/anthropic`パッケージをインストールする必要があります）
- Google: `import { google } from '@ai-sdk/google';` （`@ai-sdk/google`パッケージをインストールする必要があります）
- AI Gateway: `import { createGateway } from 'ai/gateway';`

**AI SDK 6の重要な変更点**:
- `useChat`から送られてくるメッセージは`UIMessage[]`型です
- `streamText`に渡す前に`convertToModelMessages()`で`ModelMessage[]`に変換する必要があります
- レスポンスは`toUIMessageStreamResponse()`を使用します（`useChat`や`useCompletion`が期待する形式）

**必要なパッケージのインストール:**

```bash
# OpenAIを使用する場合
npm install @ai-sdk/openai

# Anthropicを使用する場合
npm install @ai-sdk/anthropic

# Googleを使用する場合
npm install @ai-sdk/google
```

### 4.3 クライアントコンポーネントの作成

次に、フロントエンドのコンポーネントを作成します。

**`app/page.tsx`**を作成：

```typescript
'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="whitespace-pre-wrap">
            <strong>{message.role === 'user' ? 'User: ' : 'AI: '}</strong>
            {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
```

### 4.4 基本的なテキスト生成の実装

ストリーミングを使わない、シンプルなテキスト生成の例：

**`app/api/generate/route.ts`**:

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // AI Gatewayを使わずに、直接OpenAIを指定
  // gpt-5-nanoを指定（高速かつコスト効率の高いモデル）
  const { text } = await generateText({
    model: openai('gpt-5-nano'),
    prompt,
  });

  return Response.json({ text });
}
```

**注意**: 
- この例では、AI Gatewayを使わずに直接OpenAIプロバイダーを使用しています
- `openai('gpt-5-nano')`のように、関数形式でモデルを指定します
- 実際に使用する場合は、OpenAI APIで利用可能なモデル名を指定してください（例: `gpt-5-nano`, `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`）
- 利用可能なモデルは、[OpenAI Models Documentation](https://platform.openai.com/docs/models)で確認できます

**`app/generate/page.tsx`**:

```typescript
'use client';

import { useState } from 'react';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const { text } = await response.json();
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Text Generation</h1>
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
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}
```

### 4.5 ストリーミングテキスト生成の実装

ストリーミングを使用してリアルタイムでテキストを生成する例：

**`app/api/stream/route.ts`**:

```typescript
import { streamText } from 'ai';
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

    // streamText()を使用してストリーミングレスポンスを返す
    // generateText()とは異なり、結果を段階的に返すことができる
    const result = await streamText({
      model: openai('gpt-5-nano'),  // モデルオブジェクトを指定（高速かつコスト効率の高いモデル）
      prompt,                        // この時点でOpenAI APIが呼び出される
    });

    // toUIMessageStreamResponse()でストリーミングレスポンスを返す
    // useCompletionはこの形式を期待している
    // これにより、クライアント側でリアルタイムにテキストを受信できる
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Stream API error:', error);
    
    // モデルが存在しない場合のエラーハンドリング
    if (error.message?.includes('model') || error.status === 404) {
      return Response.json(
        { 
          error: 'Model not found. Please check if the model name is correct.',
          details: 'The model may not exist. Try using "gpt-5-nano", "gpt-4o" or "gpt-3.5-turbo" instead.'
        },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        error: 'Failed to stream text',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
```

**注意**: 
- `streamText`は`generateText`と異なり、結果を段階的に返すことができます
- `toUIMessageStreamResponse()`を使用してストリーミングレスポンスを返します（`useCompletion`や`useChat`などのUIフックが期待する形式です）
- クライアント側では`useCompletion`フックを使用してストリーミングを処理します

**`app/stream/page.tsx`**:

```typescript
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
```

**重要なポイント**:
- `useCompletion`フックは`@ai-sdk/react`からインポートします（AI SDK v6では`ai/react`ではなく`@ai-sdk/react`を使用します）
- `@ai-sdk/react`パッケージをインストールする必要があります: `npm install @ai-sdk/react`
- ストリーミングでは、テキストが段階的に表示されるため、ユーザーは応答の完了を待たずに結果を確認できます

#### 4.5.1 `useCompletion`フックの詳細解説

`useCompletion`は、AI SDKのReactフックで、シンプルなプロンプト→レスポンスのストリーミング処理を提供します。

**主な機能**:
- **ストリーミング処理**: APIから受信したチャンクをリアルタイムで`completion`ステートに反映します
- **状態管理**: `input`、`completion`、`isLoading`、`error`などの状態を自動管理します
- **イベントハンドラ**: `handleInputChange`、`handleSubmit`などのイベントハンドラを提供します

**返される値の詳細**:
- `completion`: 現在の完了テキスト（ストリーミング中は段階的に更新される）
- `input`: 入力フィールドの値
- `handleInputChange`: 入力フィールドの変更を処理するハンドラ
- `handleSubmit`: フォーム送信を処理するハンドラ
- `isLoading`: ストリーミング中のローディング状態（`true`/`false`）
- `error`: エラーが発生した場合のエラーオブジェクト

**`useChat`との違い**:
- `useChat`: メッセージ履歴を管理する（`messages`配列を持つ）。チャット形式の会話に適している
- `useCompletion`: シンプルなプロンプト→レスポンス（履歴なし）。単発のテキスト生成に適している

**使用例**:
```typescript
const { completion, input, handleInputChange, handleSubmit, isLoading, error } = useCompletion({
  api: '/api/stream',  // APIエンドポイント
  onFinish: (prompt, completion) => {
    // ストリーミング完了時のコールバック
    console.log('Completed:', completion);
  },
  onError: (error) => {
    // エラー発生時のコールバック
    console.error('Error:', error);
  },
});
```

#### 4.5.2 `toUIMessageStreamResponse()`メソッドの詳細解説

`toUIMessageStreamResponse()`は、`streamText()`の戻り値が持つメソッドで、UI向けのストリーミングレスポンスを生成します。

**主な特徴**:
- **UI向けフォーマット**: `useCompletion`や`useChat`などのUIフックが期待する形式でレスポンスを返します
- **ストリーミング対応**: チャンクを順次送信するため、リアルタイムでテキストを表示できます
- **メタデータ付与**: チャンクに必要なメタデータを含めるため、UIフックが正しく動作します

**他のメソッドとの違い**:
- `toTextStreamResponse()`: テキストのみのストリーミングレスポンス（UIフック非対応の可能性あり）
- `toUIMessageStreamResponse()`: UIフック（`useCompletion`、`useChat`）向けの形式（推奨）

**使用例**:
```typescript
const result = await streamText({
  model: openai('gpt-5-nano'),  // 高速かつコスト効率の高いモデル
  prompt,
});

// useCompletionが期待する形式でレスポンスを返す
return result.toUIMessageStreamResponse();
```

**内部的な動作**:
1. `streamText()`がストリームを生成
2. `toUIMessageStreamResponse()`がUIフック向けの形式に変換
3. クライアント側の`useCompletion`が受信して`completion`ステートを更新

**注意点**:
- `useCompletion`を使用する場合は、必ず`toUIMessageStreamResponse()`を使用してください
- `toTextStreamResponse()`を使用すると、`useCompletion`が正しく動作しない可能性があります

### 4.6 環境変数の設定確認

API Route Handlerで環境変数が正しく読み込まれているか確認します。

**`app/api/chat/route.ts`**にデバッグコードを追加（開発時のみ）：

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  // 開発環境でのみ環境変数を確認
  if (process.env.NODE_ENV === 'development') {
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
  }

  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4'),
    messages,
  });

  return result.toTextStreamResponse();
}
```

---

## 5. 実践タスク

### タスク1: シンプルなチャットボットの作成

**目標**: 基本的なチャットボットを実装する

**手順**:
1. `app/api/chat/route.ts`を作成（上記のコードを参考）
2. `app/page.tsx`にチャットUIを実装
3. 動作確認

**チェックリスト**:
- [ ] API Route Handlerが正しく動作する
- [ ] メッセージが送信できる
- [ ] ストリーミングレスポンスが表示される
- [ ] エラーハンドリングが実装されている

### タスク2: テキスト生成機能の実装

**目標**: プロンプトからテキストを生成する機能を実装する

**手順**:
1. `app/api/generate/route.ts`を作成
2. `app/generate/page.tsx`にUIを実装
3. 様々なプロンプトでテスト

**チェックリスト**:
- [ ] テキスト生成が動作する
- [ ] ローディング状態が表示される
- [ ] エラーが適切に処理される

### タスク3: ストリーミングレスポンスの実装

**目標**: ストリーミングを使用してリアルタイムでテキストを表示する

**手順**:
1. `app/api/stream/route.ts`を作成（上記のコードを参考）
2. `app/stream/page.tsx`にUIを実装
3. `@ai-sdk/react`パッケージをインストール: `npm install @ai-sdk/react`
4. ストリーミングの動作を確認

**チェックリスト**:
- [ ] `app/api/stream/route.ts`が正しく動作する
- [ ] `useCompletion`フックが正しく動作する
- [ ] ストリーミングが正しく動作する
- [ ] テキストが段階的に表示される
- [ ] エラーハンドリングが実装されている
- [ ] ユーザー体験が向上している

### タスク4: プロンプトエンジニアリングの練習

**目標**: 様々なプロンプトを試して、最適な結果を得る

**試すべきプロンプト**:
- 明確な指示: "Write a 200-word essay about artificial intelligence."
- コンテキスト付き: "You are a helpful assistant. Explain quantum computing in simple terms."
- 出力形式指定: "List 5 benefits of exercise in bullet points."
- 創造的なタスク: "Write a short story about a robot learning to paint."

**チェックリスト**:
- [ ] 様々なプロンプトを試した
- [ ] プロンプトの違いによる結果の違いを理解した
- [ ] 最適なプロンプトの書き方を学んだ

---

## 6. トラブルシューティング

### 6.1 よくあるエラーと解決方法

#### エラー: "API key not found"
**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. `.env.local`ファイルがプロジェクトルートにあることを確認
2. 環境変数名が正しいことを確認（例: `OPENAI_API_KEY`）
3. サーバーを再起動（環境変数の変更後は必須）

#### エラー: "Module not found: Can't resolve 'ai'"
**原因**: `ai`パッケージがインストールされていない

**解決方法**:
```bash
npm i ai
```

#### エラー: "Streaming not supported"
**原因**: クライアントコンポーネントで`useChat`を使用していない、またはAPI Route Handlerが正しく実装されていない

**解決方法**:
1. `'use client'`ディレクティブがコンポーネントの先頭にあることを確認
2. API Route Handlerで`toTextStreamResponse()`を使用していることを確認

### 6.2 デバッグのヒント

#### サーバー側のログを確認
```typescript
console.log('Request received:', { messages });
console.log('Environment:', process.env.NODE_ENV);
```

#### クライアント側のログを確認
```typescript
console.log('Messages:', messages);
console.log('Input:', input);
```

#### ネットワークタブを確認
ブラウザの開発者ツールで、APIリクエストとレスポンスを確認します。

### 6.3 パフォーマンスの最適化

#### レート制限の考慮
APIプロバイダーにはレート制限があるため、適切なエラーハンドリングを実装します：

```typescript
try {
  const result = await streamText({ ... });
} catch (error) {
  if (error.status === 429) {
    // レート制限エラー
    return Response.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }
  throw error;
}
```

#### タイムアウトの設定
長時間実行されるリクエストにはタイムアウトを設定します：

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒

try {
  const result = await streamText({
    ...,
    abortSignal: controller.signal,
  });
} finally {
  clearTimeout(timeoutId);
}
```

---

## 7. 次のステップ

フェーズ1を完了したら、以下のステップに進みましょう：

1. **フェーズ2: UIコンポーネント編（AI Elements）**
   - 事前構築されたUIコンポーネントの使用
   - より洗練されたチャットインターフェースの構築

2. **高度な機能の学習**
   - ツール呼び出しの実装
   - エージェントの構築
   - 構造化データの生成

3. **ベストプラクティスの適用**
   - エラーハンドリングの改善
   - セキュリティ対策の実装
   - パフォーマンスの最適化

---

## 📚 参考リソース

### 公式ドキュメント
- [AI SDK Getting Started](https://ai-sdk.dev/getting-started)
- [Foundations: Overview](https://ai-sdk.dev/docs/foundations/overview)
- [Foundations: Providers and Models](https://ai-sdk.dev/docs/foundations/providers-and-models)
- [Foundations: Prompts](https://ai-sdk.dev/docs/foundations/prompts)
- [Foundations: Streaming](https://ai-sdk.dev/docs/foundations/streaming)
- [Next.js App Router Guide](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)

### コード例
- [AI SDK Examples](https://ai-sdk.dev/examples)
- [Cookbook](https://ai-sdk.dev/cookbook)

### コミュニティ
- [GitHub Discussions](https://github.com/vercel/ai/discussions)
- [GitHub Repository](https://github.com/vercel/ai)

---

## ✅ フェーズ1完了チェックリスト

### 環境準備
- [ ] Node.js 18以上がインストールされている
- [ ] Next.jsプロジェクトがセットアップされている
- [ ] AI SDKがインストールされている
- [ ] 環境変数が正しく設定されている

### 基礎概念の理解
- [ ] プロバイダーとモデルの違いを理解している
- [ ] プロンプトの重要性を理解している
- [ ] ストリーミングの仕組みを理解している
- [ ] 主要なAPI（generateText、streamText）を理解している

### 実装スキル
- [ ] API Route Handlerを作成できる
- [ ] クライアントコンポーネントでAI SDKを使用できる
- [ ] 基本的なチャットボットを実装できる
- [ ] ストリーミングレスポンスを実装できる

### 実践タスク
- [ ] シンプルなチャットボットを作成した
- [ ] テキスト生成機能を実装した
- [ ] ストリーミングレスポンスを実装した
- [ ] プロンプトエンジニアリングを練習した

---

**次のステップ**: [フェーズ2: UIコンポーネント編（AI Elements）](../01_LEARNING_PLAN.md#フェーズ2-uiコンポーネント編---ai-elements)に進みましょう！

---

**学習ログ**:
- 開始日: ___________
- 完了日: ___________
- メモ: 

