# LangGraph 複数ノード問題と解決策

## 現状の状況

### 問題の概要

LangGraphで複数のノードがLLMを呼び出すグラフを作成すると、チャット画面に表示されるメッセージが、最初の回答と後の回答が混在する、または累積してしまう問題が発生しています。

### 具体的な症状

1. **一回目のLLMの回答**（ログから）
   ```
   あさの風が、窓をくすぐる、静かな部屋よ。
   ```

2. **最終的なLLMの回答**（ログから）
   ```
   あさの風が窓をくすぐる静かな部屋。かぜが眠る森で、雨が指をほどく静寂だけ。さくらの園で子どもたちの声が星に触れるよ。つまりこの三つ、本当にロマンチックだ。だけど僕の恋愛運はこの天気予報より遅れて到着。結論: 天気はロマンチック、僕のデートは風で吹き飛ばされる。
   ```

3. **チャット画面に表示される結果**
   ```
   あさの風が、窓をくすぐる、静かな部屋よ。眠る森で、雨が指をほどく静寂だけ。さくらの園で子どもたちの声が星に触れるよ。つまりこの三つ、本当にロマンチックだ。だけど僕の恋愛運はこの天気予報より遅れて到着。結論: 天気はロマンチック、僕のデートは風で吹き飛ばされる。
   ```
   - 最初の表示が消えていない
   - 複数のノードからのメッセージが累積して表示される

### 技術的な詳細

#### 現在の実装

- **バックエンド**: `app/api/langgraph/route.ts`
  - LangGraphのストリーム（SSE形式）を受信
  - `messages/partial`イベントを処理
  - メッセージIDが変わったときに新しいメッセージの内容を最初から送信
  - `toUIMessageStream()`を使用してAI SDK形式に変換
  - `createUIMessageStreamResponse()`でレスポンスを返す

- **フロントエンド**: `app/langgraph-chat/page.tsx`
  - `useChat`フックを使用
  - `DefaultChatTransport`でAPIエンドポイントに接続

#### 問題の根本原因

1. **メッセージIDの変更検出**
   - バックエンドではメッセージIDが変わったことを検出している
   - しかし、`toUIMessageStream()`がメッセージIDの変更を認識していない可能性がある
   - `AIMessageChunk`に`id`プロパティを設定しても、`toUIMessageStream()`がそれを認識しない

2. **メッセージの累積**
   - メッセージIDが変わるたびに新しいメッセージの内容を最初から送信している
   - しかし、`useChat`がすべてのチャンクを1つのメッセージとして統合している可能性がある
   - 前のメッセージがクリアされずに累積してしまう

3. **ストリームの処理**
   - `stream()`関数内で`lastSentContent`をリセットしているが、既にyieldしたチャンクはストリームに送信済み
   - AI SDK側で前のメッセージが累積してしまう

### ログから確認できること

- メッセージIDが正しく変わっている（4つのノードから4つの異なるメッセージID）
- 各メッセージIDごとに内容が正しくストリーミングされている
- バックエンドでは正しく処理されているが、フロントエンドで累積してしまう

## 打開案

### 案1: `useCompletion`を使う

**概要**
- `useChat`の代わりに`useCompletion`を使用
- メッセージ履歴を管理しない
- 単発のテキスト生成に適している

**メリット**
- シンプルな実装
- メッセージIDが変わるたびに新しいメッセージとして扱われる可能性がある
- 履歴管理が不要

**デメリット**
- メッセージ履歴が保持されない
- 会話形式のチャットには不向き
- メッセージIDの変更を自動的に検出する保証はない

**実装のポイント**
- `app/langgraph-chat/page.tsx`で`useChat`を`useCompletion`に変更
- メッセージ履歴の管理が不要になる

### 案2: 直接ストリームを処理する

**概要**
- `fetch`でストリームを直接読み取り、自分で状態管理
- メッセージIDの変更を検出して、前のメッセージをクリアし、新しいメッセージを開始
- `useChat`や`useCompletion`を使わない

**メリット**
- 最も細かい制御が可能
- メッセージIDの変更を直接検出できる
- 前のメッセージをクリアする処理を実装できる
- `useChat`の制約を受けない

**デメリット**
- 実装が複雑になる
- 状態管理を自分で行う必要がある
- AI SDKの便利な機能を使えない

**実装のポイント**
- `fetch`でストリームを読み取る
- `TextDecoder`でSSE形式をパース
- メッセージIDが変わったときに、Reactの状態を更新して前のメッセージをクリア
- 新しいメッセージIDのメッセージを開始

**実装例のイメージ**
```typescript
const [currentMessage, setCurrentMessage] = useState('');
const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

const handleStream = async () => {
  const response = await fetch('/api/langgraph', { ... });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    // SSE形式をパース
    // メッセージIDが変わったら、setCurrentMessage('')でクリア
    // 新しいメッセージを開始
  }
};
```

### 案3: `useChat`を使うが、メッセージIDごとに別のメッセージとして扱う

**概要**
- `useChat`を使いつつ、メッセージIDが変わったときに前のメッセージをクリアする処理を追加
- メッセージ配列を管理し、メッセージIDが変わったときに前のメッセージを削除

**メリット**
- `useChat`の便利な機能を使える
- メッセージ履歴を管理できる
- 既存のコードとの互換性が高い

**デメリット**
- メッセージIDの変更を検出する仕組みが必要
- バックエンドからメッセージIDの情報を取得する必要がある
- 実装が複雑になる可能性がある

**実装のポイント**
- バックエンドからメッセージIDの情報を送信する
- フロントエンドでメッセージIDを追跡
- メッセージIDが変わったときに、`useChat`の`messages`配列から前のメッセージを削除
- または、メッセージIDごとに別のメッセージとして扱う

**実装例のイメージ**
```typescript
const { messages, append } = useChat({ ... });
const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

// メッセージIDが変わったときに、前のメッセージを削除
useEffect(() => {
  if (newMessageId !== currentMessageId) {
    // 前のメッセージIDのメッセージを削除
    setMessages(prev => prev.filter(msg => msg.id !== currentMessageId));
    setCurrentMessageId(newMessageId);
  }
}, [newMessageId]);
```

#### バックエンドからフロントエンドへのメッセージID通知方法

案3を実装する場合、バックエンドからフロントエンドにメッセージIDを通知する必要があります。以下の方法が考えられます：

##### 方法1: UIMessageChunkにカスタムプロパティを追加

**バックエンド側（`app/api/langgraph/route.ts`）**
```typescript
// toUIMessageStream()の結果をラップしてメッセージIDを追加
const uiMessageStream = toUIMessageStream(stream());

const streamWithMessageId = async function* () {
  let currentMessageId: string | null = null;
  
  // LangGraphのストリームからメッセージIDを追跡
  // （stream()関数内でメッセージIDを保持する必要がある）
  
  for await (const chunk of uiMessageStream) {
    // メッセージIDを取得（stream()関数から取得する方法が必要）
    const messageId = getCurrentMessageId(); // 実装が必要
    
    yield {
      ...chunk,
      // カスタムプロパティとしてメッセージIDを追加
      messageId: messageId,
    };
  }
};

return createUIMessageStreamResponse({
  stream: streamWithMessageId(),
});
```

**問題点**: `stream()`関数内のメッセージIDを外部から取得する仕組みが必要

##### 方法2: ストリームを2段階で処理

**バックエンド側（`app/api/langgraph/route.ts`）**
```typescript
const stream = async function* () {
  // ... 既存のコード ...
  
  // メッセージIDが変わったときに、特別なチャンクを送信
  if (messageId !== currentMessageId) {
    // メッセージID変更を通知する特別なチャンク
    yield {
      type: 'message-id-change',
      messageId: messageId,
      previousMessageId: currentMessageId,
    };
    
    currentMessageId = messageId;
  }
  
  // 通常のメッセージチャンク
  yield new AIMessageChunk(currentContent);
};

// toUIMessageStream()の前に、メッセージID変更チャンクを処理
const processedStream = async function* () {
  let currentMessageId: string | null = null;
  
  for await (const chunk of stream()) {
    if (chunk.type === 'message-id-change') {
      // メッセージID変更を記録
      currentMessageId = chunk.messageId;
      // このチャンクはスキップ（AI SDK形式に変換しない）
      continue;
    }
    
    // 通常のチャンクにメッセージIDを追加
    const uiChunk = await toUIMessageStream([chunk]).next();
    yield {
      ...uiChunk.value,
      messageId: currentMessageId,
    };
  }
};
```

##### 方法3: メタデータとして送信

**バックエンド側（`app/api/langgraph/route.ts`）**
```typescript
// stream()関数内でメッセージIDを追跡
const stream = async function* () {
  let currentMessageId: string | null = null;
  // ... 既存のコード ...
  
  if (messageId !== currentMessageId) {
    currentMessageId = messageId;
  }
  
  const chunk = new AIMessageChunk(currentContent);
  // AIMessageChunkにメタデータとしてメッセージIDを追加
  (chunk as any).response_metadata = {
    ...(chunk as any).response_metadata,
    messageId: currentMessageId,
  };
  
  yield chunk;
};

// toUIMessageStream()の結果をラップ
const uiMessageStream = toUIMessageStream(stream());

const streamWithMessageId = async function* () {
  let currentMessageId: string | null = null;
  
  for await (const chunk of uiMessageStream) {
    // 元のストリームからメッセージIDを取得する方法が必要
    // または、chunkのメタデータから取得
    yield {
      ...chunk,
      messageId: currentMessageId, // 取得方法を実装
    };
  }
};
```

##### 方法4: ストリームを2つのチャンネルに分ける（推奨）

**バックエンド側（`app/api/langgraph/route.ts`）**
```typescript
// メッセージIDを別のチャンネルで送信
const stream = async function* () {
  let currentMessageId: string | null = null;
  // ... 既存のコード ...
  
  if (messageId !== currentMessageId) {
    // メッセージID変更を別の形式で送信
    yield {
      _type: 'message-id-change',
      messageId: messageId,
      previousMessageId: currentMessageId,
    };
    currentMessageId = messageId;
  }
  
  yield new AIMessageChunk(currentContent);
};

// toUIMessageStream()の結果を処理
const uiMessageStream = toUIMessageStream(stream());

const streamWithMessageId = async function* () {
  let currentMessageId: string | null = null;
  
  for await (const chunk of uiMessageStream) {
    // メッセージID変更チャンクを検出
    if ((chunk as any)._type === 'message-id-change') {
      currentMessageId = (chunk as any).messageId;
      // このチャンクはスキップ
      continue;
    }
    
    // 通常のチャンクにメッセージIDを追加
    yield {
      ...chunk,
      messageId: currentMessageId,
    };
  }
};
```

**推奨理由**:
- 実装が明確
- メッセージID変更を確実に検出できる
- `toUIMessageStream()`の結果をラップするだけで対応可能
- フロントエンドで処理しやすい

##### 方法5: カスタムストリーム形式

**バックエンド側（`app/api/langgraph/route.ts`）**
```typescript
// メッセージIDとコンテンツを一緒に送信
const stream = async function* () {
  // ... 既存のコード ...
  
  if (messageId !== currentMessageId) {
    // メッセージID変更を通知
    yield {
      type: 'message-id-change',
      messageId: messageId,
    };
    currentMessageId = messageId;
  }
  
  // コンテンツチャンク
  yield {
    type: 'content',
    messageId: currentMessageId,
    content: currentContent,
  };
};

// カスタム形式をAI SDK形式に変換
const streamToUIMessage = async function* () {
  let currentMessageId: string | null = null;
  let accumulatedContent = '';
  
  for await (const chunk of stream()) {
    if (chunk.type === 'message-id-change') {
      // メッセージIDが変わったら、前のメッセージをリセット
      currentMessageId = chunk.messageId;
      accumulatedContent = '';
      continue;
    }
    
    if (chunk.type === 'content') {
      // 差分を計算
      const newContent = chunk.content.slice(accumulatedContent.length);
      accumulatedContent = chunk.content;
      
      yield {
        type: 'text-delta',
        textDelta: newContent,
        messageId: chunk.messageId,
      };
    }
  }
};

return createUIMessageStreamResponse({
  stream: streamToUIMessage(),
});
```

**フロントエンド側での処理**
```typescript
const { messages, setMessages } = useChat({
  onChunk: (chunk) => {
    // メッセージIDを抽出
    const messageId = chunk.messageId;
    // メッセージIDが変わったときに前のメッセージをクリア
    // ...
  },
});
```

### 案4: カスタムフックを作成

**概要**
- `useChat`をベースに、メッセージIDの変更を検出して前のメッセージをクリアするカスタムフックを作成
- `useLangGraphChat`のようなカスタムフックを実装

**メリット**
- `useChat`の機能を活用できる
- メッセージIDの変更を自動的に処理できる
- 再利用可能なコンポーネントになる

**デメリット**
- 実装が複雑になる
- メンテナンスが必要
- バックエンドからメッセージIDの情報を取得する必要がある

**実装のポイント**
- `useChat`をラップしたカスタムフックを作成
- メッセージIDの変更を検出するロジックを追加
- 前のメッセージをクリアする処理を実装

**実装例のイメージ**

案4を実装する場合、以下のアプローチが考えられます：

##### アプローチA: メッセージIDを追跡してメッセージを管理

**`hooks/useLangGraphChat.ts`（新規作成）**
```typescript
import { useChat, type UseChatOptions } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef } from 'react';

interface MessageWithId {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  messageId?: string;  // LangGraphのメッセージID
}

export function useLangGraphChat(options: UseChatOptions) {
  const { messages, append, setMessages, ...rest } = useChat(options);
  const currentMessageIdRef = useRef<string | null>(null);
  const messageIdMapRef = useRef<Map<string, string>>(new Map()); // messageId -> message.id のマッピング

  // メッセージIDが変わったときに前のメッセージをクリア
  useEffect(() => {
    // 最新のメッセージからmessageIdを取得
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;

    const messageId = (latestMessage as any).messageId;
    
    if (messageId && messageId !== currentMessageIdRef.current) {
      // メッセージIDが変わった
      const previousMessageId = currentMessageIdRef.current;
      
      if (previousMessageId) {
        // 前のメッセージIDに対応するメッセージを削除
        const previousMessageInternalId = messageIdMapRef.current.get(previousMessageId);
        if (previousMessageInternalId) {
          setMessages(prev => prev.filter(msg => msg.id !== previousMessageInternalId));
          messageIdMapRef.current.delete(previousMessageId);
        }
      }
      
      // 新しいメッセージIDを記録
      currentMessageIdRef.current = messageId;
      messageIdMapRef.current.set(messageId, latestMessage.id);
    } else if (messageId) {
      // 同じメッセージIDの更新
      messageIdMapRef.current.set(messageId, latestMessage.id);
    }
  }, [messages, setMessages]);

  return {
    messages,
    append,
    setMessages,
    ...rest,
  };
}
```

##### アプローチB: ストリームをインターセプト

**`hooks/useLangGraphChat.ts`（より確実な実装）**
```typescript
import { useChat, type UseChatOptions } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';

export function useLangGraphChat(options: UseChatOptions) {
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const previousMessageIdRef = useRef<string | null>(null);
  const messageIdToInternalIdRef = useRef<Map<string, string>>(new Map());
  
  // カスタムトランスポートでメッセージIDを抽出
  const customTransport = new DefaultChatTransport({
    api: options.api,
    // ストリームをインターセプトしてメッセージIDを抽出
    onChunk: (chunk) => {
      const messageId = chunk.messageId; // バックエンドから送信されたメッセージID
      
      if (messageId && messageId !== currentMessageId) {
        // メッセージIDが変わった
        previousMessageIdRef.current = currentMessageId;
        setCurrentMessageId(messageId);
      }
    },
  });

  const { messages, append, setMessages, ...rest } = useChat({
    ...options,
    transport: customTransport,
  });

  // メッセージIDが変わったときに前のメッセージをクリア
  useEffect(() => {
    if (previousMessageIdRef.current && currentMessageId) {
      const previousInternalId = messageIdToInternalIdRef.current.get(previousMessageIdRef.current);
      if (previousInternalId) {
        setMessages(prev => prev.filter(msg => msg.id !== previousInternalId));
        messageIdToInternalIdRef.current.delete(previousMessageIdRef.current);
      }
    }
    
    // 現在のメッセージIDと内部IDをマッピング
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && currentMessageId) {
      messageIdToInternalIdRef.current.set(currentMessageId, latestMessage.id);
    }
  }, [currentMessageId, messages, setMessages]);

  return {
    messages,
    append,
    setMessages,
    ...rest,
  };
}
```

##### アプローチC: メッセージの置き換え（最もシンプル）

**`hooks/useLangGraphChat.ts`（シンプルな実装）**
```typescript
import { useChat, type UseChatOptions } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';

export function useLangGraphChat(options: UseChatOptions) {
  const { messages, setMessages, ...rest } = useChat(options);
  const currentMessageIdRef = useRef<string | null>(null);
  const assistantMessageIndexRef = useRef<number>(-1);

  useEffect(() => {
    // 最新のアシスタントメッセージを取得
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    const latestAssistantMessage = assistantMessages[assistantMessages.length - 1];
    
    if (!latestAssistantMessage) return;

    // メッセージからmessageIdを取得（バックエンドから送信されたもの）
    const messageId = (latestAssistantMessage as any).messageId;
    
    if (messageId && messageId !== currentMessageIdRef.current) {
      // メッセージIDが変わった
      if (currentMessageIdRef.current && assistantMessageIndexRef.current >= 0) {
        // 前のアシスタントメッセージを削除
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages.splice(assistantMessageIndexRef.current, 1);
          return newMessages;
        });
      }
      
      // 新しいメッセージIDを記録
      currentMessageIdRef.current = messageId;
      assistantMessageIndexRef.current = messages.length - 1;
    } else if (messageId) {
      // 同じメッセージIDの更新（インデックスを更新）
      assistantMessageIndexRef.current = messages.length - 1;
    }
  }, [messages, setMessages]);

  return {
    messages,
    setMessages,
    ...rest,
  };
}
```

**重要なポイント**:
1. バックエンドからメッセージIDを送信する（案3の方法4を推奨）
2. フロントエンドでメッセージIDを追跡
3. `setMessages`でメッセージをクリア
4. メッセージIDと内部IDのマッピングを管理

この方法なら、`useChat`の機能を活用しつつ、メッセージIDの変更に対応できます。

## 推奨アプローチ

### 最も確実な解決策: 案2（直接ストリームを処理する）

**理由**
1. **メッセージIDの変更を直接検出できる**
   - バックエンドから送信されるメッセージIDを直接確認できる
   - メッセージIDが変わったときに、確実に前のメッセージをクリアできる

2. **前のメッセージをクリアする処理を実装できる**
   - Reactの状態管理で、メッセージIDが変わったときに`setCurrentMessage('')`でクリア
   - 新しいメッセージIDのメッセージを開始

3. **`useChat`の制約を受けない**
   - `useChat`がメッセージを自動的に統合する動作を回避できる
   - より細かい制御が可能

### 実装の流れ（案2の場合）

1. **バックエンドの修正**
   - メッセージIDの情報をストリームに含める
   - または、メッセージIDが変わったときに特別なマーカーを送信

2. **フロントエンドの実装**
   - `fetch`でストリームを直接読み取る
   - `TextDecoder`でSSE形式をパース
   - メッセージIDを追跡
   - メッセージIDが変わったときに、Reactの状態を更新して前のメッセージをクリア
   - 新しいメッセージIDのメッセージを開始

3. **状態管理**
   - `currentMessage`: 現在表示中のメッセージ
   - `currentMessageId`: 現在のメッセージID
   - メッセージIDが変わったときに、`setCurrentMessage('')`でクリア

## 次のステップ

1. **どの案を採用するか決定**
   - 案2（直接ストリームを処理する）を推奨
   - ただし、要件に応じて他の案も検討可能

2. **実装の詳細を検討**
   - バックエンドからメッセージIDの情報をどう送信するか
   - フロントエンドでメッセージIDをどう追跡するか
   - メッセージIDが変わったときの処理をどう実装するか

3. **実装とテスト**
   - 選択した案を実装
   - テストして、メッセージが累積しないことを確認

## 参考情報

- 現在の実装: `app/api/langgraph/route.ts`
- フロントエンド: `app/langgraph-chat/page.tsx`
- ログの例: メッセージIDが4回変わっている（4つのノードから4つの異なるメッセージID）

