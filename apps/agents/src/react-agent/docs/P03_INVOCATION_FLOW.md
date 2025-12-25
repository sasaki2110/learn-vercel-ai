# React Agent の呼び出しフロー

## 質問への回答

### Q: graph.tsでworkflowをコンパイルしてグラフを作成したところで終わっている。実際にグラフを呼び出す（invoke）するのは？

**はい、その理解で正しいです！**

## 詳細説明

### 1. graph.tsでのグラフ定義

`graph.ts`では、グラフの**定義**と**コンパイル**までを行います：

```typescript
// graph.ts
const workflow = new StateGraph(MessagesAnnotation, ConfigurationSchema)
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode(TOOLS))
  .addEdge("__start__", "callModel")
  .addConditionalEdges("callModel", routeModelOutput)
  .addEdge("tools", "callModel");

// コンパイルしてグラフオブジェクトを作成
export const graph = workflow.compile({
  interruptBefore: [],
  interruptAfter: [],
});
```

**ここで終了** - グラフは定義されているが、まだ実行されていない。

---

### 2. テストでの呼び出し

#### 統合テスト（graph.int.test.ts）

```typescript
// tests/integration/graph.int.test.ts
import { graph } from "../../graph.js";

it("Simple runthrough", async () => {
  // 直接 graph.invoke() を呼び出し
  const res = await graph.invoke({
    messages: [
      {
        role: "user",
        content: "What is the current weather in SF?",
      },
    ],
  });
  
  expect(
    res.messages.find((message: BaseMessage) => message._getType() === "tool"),
  ).toBeDefined();
});
```

**フロー**:
1. テストファイルから`graph`をインポート
2. `graph.invoke()`を直接呼び出し
3. 初期状態（メッセージ）を渡す
4. グラフが実行され、結果を返す

---

### 3. チャットWebアプリでの呼び出し

#### LangGraph CLIサーバーの起動

```bash
# apps/agents/package.json
"dev": "npx @langchain/langgraph-cli dev --port 2024 --config ../../langgraph.json"
```

**langgraph.json**でグラフが定義されている：
```json
{
  "graphs": {
    "agent": "./apps/agents/src/react-agent/graph.ts:graph",
    "memory_agent": "./apps/agents/src/memory-agent/graph.ts:graph",
    ...
  }
}
```

**LangGraph CLIの動作**:
1. `langgraph.json`を読み込む
2. 各グラフ（`agent`, `memory_agent`など）をロード
3. HTTPサーバーを起動（ポート2024）
4. REST APIエンドポイントを公開
5. リクエストを待ち受ける

#### Webアプリからのリクエスト

```typescript
// apps/web/src/providers/Stream.tsx
import { useStream } from "@langchain/langgraph-sdk/react";

const streamValue = useTypedStream({
  apiUrl,           // "http://localhost:2024"
  apiKey: apiKey ?? undefined,
  assistantId,      // "agent" (graph ID)
  threadId: threadId ?? null,
  // ...
});
```

**LangGraph SDKの動作**:
1. Webアプリが`useStream`フックを使用
2. LangGraph SDKがHTTPリクエストを送信
3. LangGraph CLIサーバーがリクエストを受信
4. **サーバー内部で`graph.invoke()`を呼び出し**
5. 結果をストリーミングで返す

---

## 呼び出しフローの比較

### テストの場合

```
graph.int.test.ts
  ↓
graph.invoke({ messages: [...] })
  ↓
graph.ts の workflow が実行される
  ↓
結果を返す
```

### チャットWebアプリの場合

```
Webアプリ (Next.js)
  ↓
useStream フック
  ↓
LangGraph SDK
  ↓
HTTP リクエスト
  ↓
LangGraph CLI サーバー (ポート2024)
  ↓
langgraph.json からグラフをロード
  ↓
graph.invoke() を内部的に呼び出し ← ここ！
  ↓
graph.ts の workflow が実行される
  ↓
結果をストリーミングで返す
  ↓
Webアプリが結果を受信・表示
```

---

## LangGraph CLIサーバーの内部動作

`langgraph dev`コマンドは、内部的に以下のような処理を行います：

1. **グラフのロード**
   ```typescript
   // 疑似コード
   const langgraphConfig = loadConfig("langgraph.json");
   const graphs = {};
   
   for (const [graphId, graphPath] of Object.entries(langgraphConfig.graphs)) {
     const graphModule = await import(graphPath);
     graphs[graphId] = graphModule.graph;  // graph.tsからエクスポートされたgraph
   }
   ```

2. **HTTPサーバーの起動**
   ```typescript
   // 疑似コード
   app.post("/assistants/:assistantId/runs", async (req, res) => {
     const { assistantId } = req.params;
     const { messages, thread_id } = req.body;
     
     const graph = graphs[assistantId];  // "agent"などのグラフIDで取得
     
     // ここで graph.invoke() を呼び出し
     const result = await graph.invoke(
       { messages },
       { configurable: { thread_id } }
     );
     
     res.json(result);
   });
   ```

3. **ストリーミング対応**
   - グラフの実行中、中間状態をストリーミング
   - Webアプリがリアルタイムで更新を受信

---

## 重要なポイント

### 1. graph.tsの役割

- **グラフの定義**: ノード、エッジ、ルーティングロジック
- **グラフのコンパイル**: 実行可能なグラフオブジェクトを作成
- **エクスポート**: 他のファイルから使用可能にする

### 2. 呼び出し方法の違い

| 方法 | 呼び出し元 | 用途 |
|------|----------|------|
| **テスト** | テストファイルから直接 | 単体テスト、統合テスト |
| **Webアプリ** | LangGraph CLIサーバー経由 | 本番環境、開発環境 |

### 3. LangGraph CLIの利点

- **複数グラフの管理**: `langgraph.json`で複数のグラフを定義可能
- **REST API**: 標準的なHTTP APIでアクセス可能
- **ストリーミング**: リアルタイムで結果を返す
- **スレッド管理**: 会話履歴の管理
- **認証**: APIキーによる認証対応

---

## 実際のコード例

### テストでの呼び出し

```typescript
// tests/integration/graph.int.test.ts
import { graph } from "../../graph.js";

const res = await graph.invoke({
  messages: [{ role: "user", content: "Hello" }],
});
```

### Webアプリでの呼び出し（間接的）

```typescript
// apps/web/src/providers/Stream.tsx
const streamValue = useTypedStream({
  apiUrl: "http://localhost:2024",  // LangGraph CLIサーバー
  assistantId: "agent",              // langgraph.jsonのgraph ID
  // ...
});

// 内部的に以下のようなHTTPリクエストが送信される：
// POST http://localhost:2024/assistants/agent/runs
// Body: { messages: [...], thread_id: "..." }
```

---

## まとめ

✅ **graph.ts**: グラフを定義・コンパイル（実行はしない）

✅ **テスト**: `graph.invoke()`を直接呼び出し

✅ **Webアプリ**: 
   - LangGraph CLIサーバーが起動
   - WebアプリがHTTPリクエストを送信
   - **サーバー内部で`graph.invoke()`を呼び出し**
   - 結果をストリーミングで返す

あなたの理解は完全に正しいです！

