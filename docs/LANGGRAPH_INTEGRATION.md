# Vercel AI SDK 6.x と LangGraph の統合方法調査

## 概要

Vercel AI SDK 6.x と LangGraph を連携させる方法は、主に以下の2つがあります：

1. **`@ai-sdk/langchain` アダプターを使用する方法**
2. **LangGraph をバックエンド API として構築し、AI SDK UI から呼び出す方法**

このドキュメントでは、それぞれの方法の違いと、`streamMode` の指定方法について詳しく説明します。

---

## 方法1: `@ai-sdk/langchain` アダプターを使用する方法

### 概要

Vercel AI SDK の `@ai-sdk/langchain` パッケージを利用して、LangChain や LangGraph と統合する方法です。

### 特徴

- **統合が容易**: Vercel AI SDK と LangGraph の機能をシームレスに組み合わせることができます
- **新しい API**: AI SDK 6.x で再設計された以下の API が利用可能：
  - `toBaseMessages()`: UIメッセージをLangChain形式に変換
  - `toUIMessageStream()`: LangGraphのイベントストリームをUIメッセージストリームに変換
  - `LangSmithDeploymentTransport`: ブラウザ側からLangSmithデプロイメントへの接続をサポート

### サポートされる機能

- ツールの呼び出し
- 部分的な入力ストリーミング
- 推論ブロック
- LangGraphの割り込みを介したHuman-in-the-Loopワークフロー

### 実装例

```typescript
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse } from 'ai';
import { StateGraph } from '@langchain/langgraph';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // UIメッセージをLangChain形式に変換
  const langchainMessages = await toBaseMessages(messages);
  
  // LangGraphのストリームを取得
  const stream = await graph.stream({ messages: langchainMessages });
  
  // LangGraphのストリームをUIメッセージストリームに変換
  const uiMessageStream = toUIMessageStream(stream);
  
  // UIメッセージストリームレスポンスを返す
  return createUIMessageStreamResponse({
    stream: uiMessageStream,
  });
}
```

### `streamMode` の指定

**重要**: `@ai-sdk/langchain` アダプターを使用する場合、`streamMode` は **LangGraph の `stream()` メソッドに直接指定** します。

```typescript
// streamMode を指定する例
const stream = await graph.stream(
  { messages: langchainMessages },
  { 
    streamMode: ['values', 'messages'],  // または 'messages' のみ
    configurable: {
      // その他の設定
    },
  }
);

const uiMessageStream = toUIMessageStream(stream);
```

**`streamMode` のオプション**:
- `'values'`: 状態スナップショット全体をストリーム（各ノードの状態を含む）
- `'messages'`: メッセージのみをストリーム（AI SDK UI で表示するメッセージ）
- `['values', 'messages']`: 両方をストリーム（デバッグや詳細な状態追跡が必要な場合）

**推奨**: AI SDK UI でメッセージを表示するだけの場合は、`streamMode: 'messages'` を使用することを推奨します。`toUIMessageStream()` は `messages` を適切に処理できます。

---

## 方法2: LangGraph をバックエンド API として構築する方法

### 概要

LangGraph を独立したバックエンド API として構築し、フロントエンドの Vercel AI SDK UI からその API を呼び出す方法です。

### 特徴

- **責務の分離**: バックエンドとフロントエンドの責務を明確に分離
- **独立性**: 各コンポーネントの独立性が高く、開発や保守が容易
- **柔軟性**: バックエンドを別の言語やフレームワークで実装可能

### 実装例

#### バックエンド側（LangGraph API）

```typescript
// app/api/langgraph-backend/route.ts
import { StateGraph } from '@langchain/langgraph';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // LangGraph のストリームを取得
  const stream = await graph.stream(
    { messages },
    { 
      streamMode: 'messages',  // バックエンド側で streamMode を指定
    }
  );
  
  // ReadableStream として返す
  return new Response(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          // チャンクを JSON 形式で送信
          const data = JSON.stringify(chunk);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        controller.close();
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}
```

#### フロントエンド側（Vercel AI SDK UI）

```typescript
// app/api/langgraph/route.ts
import { createUIMessageStreamResponse } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // バックエンド API を呼び出し
  const response = await fetch('http://localhost:2024/api/langgraph-backend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  
  if (!response.body) {
    throw new Error('No response body');
  }
  
  // バックエンドからのストリームを変換
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          // Server-Sent Events 形式からデータを抽出
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              // データを AI SDK 形式に変換
              controller.enqueue(encoder.encode(JSON.stringify(data)));
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
  
  return createUIMessageStreamResponse({
    stream: stream,
  });
}
```

### `streamMode` の指定

**重要**: この方法では、`streamMode` は **バックエンド側の LangGraph 実装で指定** します。

```typescript
// バックエンド側で streamMode を指定
const stream = await graph.stream(
  { messages },
  { 
    streamMode: 'messages',  // または ['values', 'messages']
  }
);
```

フロントエンド側では、バックエンドから受け取ったストリームをそのまま処理するか、必要に応じて形式を変換します。

---

## `streamMode` の違いと使い分け

### `streamMode: 'messages'`

- **用途**: AI SDK UI でメッセージを表示する場合
- **返されるデータ**: メッセージのみ
- **パフォーマンス**: 軽量で高速
- **推奨**: 通常のチャットアプリケーション

### `streamMode: 'values'`

- **用途**: グラフの状態全体を追跡したい場合（デバッグ、ロギングなど）
- **返されるデータ**: 各ノードの状態スナップショット全体
- **パフォーマンス**: データ量が多い
- **推奨**: 開発・デバッグ時

### `streamMode: ['values', 'messages']`

- **用途**: メッセージと状態の両方が必要な場合
- **返されるデータ**: メッセージと状態スナップショットの両方
- **パフォーマンス**: 最も重い
- **注意**: `toUIMessageStream()` がこの形式を適切に処理できるか確認が必要

---

## 現在の問題点と解決策

### 問題: `streamMode: ['values', 'messages']` の混在が処理できない

**原因**:
- `toUIMessageStream()` が `['values', 'messages']` の混在形式を適切に処理できていない可能性
- 各チャンクに `messages` と `values` の両方が含まれ、変換処理が複雑になっている

**解決策1: `streamMode: 'messages'` のみを使用**

```typescript
const stream = await graph.stream(
  { messages: langchainMessages },
  { 
    streamMode: 'messages',  // 'messages' のみに変更
  }
);

const uiMessageStream = toUIMessageStream(stream);
```

**解決策2: カスタム変換処理を実装**

```typescript
const stream = await graph.stream(
  { messages: langchainMessages },
  { 
    streamMode: ['values', 'messages'],
  }
);

// カスタム変換処理
const customStream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();
    for await (const chunk of stream) {
      // messages のみを抽出
      if (chunk.messages) {
        const messageChunk = {
          messages: chunk.messages,
        };
        controller.enqueue(encoder.encode(JSON.stringify(messageChunk)));
      }
    }
    controller.close();
  },
});

const uiMessageStream = toUIMessageStream(customStream);
```

---

## 推奨事項

### 方法1（`@ai-sdk/langchain` アダプター）を推奨する場合

- Vercel AI SDK と LangGraph を密に統合したい場合
- 開発の迅速性を重視する場合
- 標準的なチャットアプリケーションを構築する場合

**推奨設定**:
```typescript
streamMode: 'messages'  // AI SDK UI で表示するだけなら 'messages' で十分
```

### 方法2（バックエンド API）を推奨する場合

- バックエンドとフロントエンドを完全に分離したい場合
- バックエンドを別の言語やフレームワークで実装したい場合
- 既存の LangGraph バックエンドがある場合

**推奨設定**:
```typescript
// バックエンド側
streamMode: 'messages'  // フロントエンドで表示するだけなら 'messages' で十分
```

---

## 参考資料

- [Vercel AI SDK 6.x ブログ記事](https://vercel.com/blog/ai-sdk-6)
- [GitHub Issue #7932](https://github.com/vercel/ai/issues/7932)
- [LangGraph 公式ドキュメント](https://langchain-ai.github.io/langgraph/)

---

## インストール方法

### 方法1を使用する場合

```bash
npm install @ai-sdk/langchain @langchain/langgraph @langchain/core
```

### 方法2を使用する場合

```bash
npm install @langchain/langgraph @langchain/core
```

---

## 実装例（完全版）

### 方法1: `@ai-sdk/langchain` アダプターを使用した完全な実装例

```typescript
// app/api/langgraph/route.ts
import { toBaseMessages, toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse } from 'ai';
import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// LangGraph の定義（例）
const model = new ChatOpenAI({ modelName: 'gpt-4' });

const graph = new StateGraph({
  channels: {
    messages: {
      reducer: (x: any[], y: any[]) => x.concat(y),
      default: () => [],
    },
  },
})
  .addNode('agent', async (state) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  })
  .addEdge('agent', END)
  .compile();

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // UIメッセージをLangChain形式に変換
    const langchainMessages = await toBaseMessages(messages);

    // LangGraphのストリームを取得（streamMode: 'messages' を推奨）
    const stream = await graph.stream(
      { messages: langchainMessages },
      { 
        streamMode: 'messages',  // 'messages' のみを使用
        configurable: {
          // 必要に応じて設定を追加
        },
      }
    );

    // LangGraphのストリームをUIメッセージストリームに変換
    const uiMessageStream = toUIMessageStream(stream);

    // UIメッセージストリームレスポンスを返す
    return createUIMessageStreamResponse({
      stream: uiMessageStream,
    });
  } catch (error: any) {
    console.error('LangGraph API error:', error);
    return Response.json(
      { 
        error: 'Failed to process LangGraph stream',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
```

### 方法2: バックエンド API として構築した完全な実装例

#### バックエンド側

```typescript
// app/api/langgraph-backend/route.ts
import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// LangGraph の定義（例）
const model = new ChatOpenAI({ modelName: 'gpt-4' });

const graph = new StateGraph({
  channels: {
    messages: {
      reducer: (x: any[], y: any[]) => x.concat(y),
      default: () => [],
    },
  },
})
  .addNode('agent', async (state) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  })
  .addEdge('agent', END)
  .compile();

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // LangGraph のストリームを取得
    const stream = await graph.stream(
      { messages },
      { 
        streamMode: 'messages',  // バックエンド側で streamMode を指定
      }
    );

    // ReadableStream として返す（Server-Sent Events 形式）
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of stream) {
              // チャンクを JSON 形式で送信
              if (chunk.messages && chunk.messages.length > 0) {
                const data = JSON.stringify({
                  messages: chunk.messages.map((msg: any) => ({
                    role: msg.constructor.name === 'AIMessage' ? 'assistant' : 'user',
                    content: msg.content,
                  })),
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
          } catch (error) {
            console.error('Stream error:', error);
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  } catch (error: any) {
    console.error('LangGraph backend error:', error);
    return Response.json(
      { 
        error: 'Failed to process LangGraph stream',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
```

#### フロントエンド側（プロキシ）

```typescript
// app/api/langgraph/route.ts
import { createUIMessageStreamResponse } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // バックエンド API を呼び出し
    const backendUrl = process.env.LANGGRAPH_BACKEND_URL || 'http://localhost:2024/api/langgraph-backend';
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body from backend');
    }

    // バックエンドからのストリームを AI SDK 形式に変換
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            // Server-Sent Events 形式からデータを抽出
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  // データを AI SDK 形式に変換
                  if (data.messages) {
                    const uiMessageChunk = {
                      type: 'text-delta',
                      textDelta: data.messages[0]?.content || '',
                    };
                    controller.enqueue(encoder.encode(JSON.stringify(uiMessageChunk)));
                  }
                } catch (parseError) {
                  console.error('Failed to parse SSE data:', parseError);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
        } finally {
          controller.close();
        }
      },
    });

    return createUIMessageStreamResponse({
      stream: stream,
    });
  } catch (error: any) {
    console.error('LangGraph proxy error:', error);
    return Response.json(
      { 
        error: 'Failed to process LangGraph stream',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
```

---

## 次のステップ

1. **必要なパッケージをインストール**
   ```bash
   # 方法1を使用する場合
   npm install @ai-sdk/langchain @langchain/langgraph @langchain/core @langchain/openai
   
   # 方法2を使用する場合
   npm install @langchain/langgraph @langchain/core @langchain/openai
   ```

2. **方法1または方法2を選択**
   - 方法1: 統合が容易で、Vercel AI SDK と密に連携
   - 方法2: バックエンドとフロントエンドを完全に分離

3. **`streamMode: 'messages'` で実装を開始**
   - `streamMode: ['values', 'messages']` は避ける
   - メッセージ表示のみの場合は `'messages'` で十分

4. **必要に応じて `streamMode` を調整**
   - デバッグが必要な場合のみ `'values'` を検討
   - パフォーマンスを優先する場合は常に `'messages'` を使用

