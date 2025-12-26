# QuickStart: Graph API

このクイックスタートでは、LangGraphの**Graph API**を使用して計算機エージェントを構築する方法を説明します。

## Graph APIとは？

**Graph API**は、エージェントを**ノード（nodes）とエッジ（edges）で構成されるグラフ**として定義する方法です。

### 特徴

- **視覚的な明確性**: エージェントのワークフローをグラフとして表現することで、全体の構造やデータの流れが直感的に理解しやすくなります
- **複雑なワークフローの管理**: 条件分岐やループなど、複雑な処理フローを柔軟に設計・管理できます
- **明示的な状態管理**: 共有データを複数のノード間で管理し、状態の変化を追跡できます
- **拡張性**: 新しいノードやエッジを追加することで、機能の拡張や変更が容易に行えます
- **チームでの協力**: 視覚的な表現が理解を助け、チームでの共同作業に適しています

### いつ使うべきか？

- 複雑なワークフローや条件分岐、ループなどを含むエージェントを構築する場合
- エージェントの構造を明確にしたい場合
- 複数のノード間で状態を共有する必要がある場合

---

## 前提条件

この例では、OpenAIアカウントとAPIキーが必要です。ターミナルで`OPENAI_API_KEY`環境変数を設定してください。

```bash
export OPENAI_API_KEY="your-api-key-here"
```

---

## 1. ツールとモデルの定義

この例では、OpenAIの`gpt-5-nano`モデルを使用し、加算、乗算、除算のツールを定義します。

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

const model = new ChatOpenAI({
  model: "gpt-5-nano",
  temperature: 0,
});

// ツールの定義
const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "Divide two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

// LLMにツールをバインド
const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);
```

### 解説

- `tool()`関数を使用して、各ツールを定義します
- `z.object()`でツールの入力スキーマを定義します
- `model.bindTools(tools)`でモデルにツールをバインドします

## 2. 状態の定義

グラフの状態は、メッセージとLLM呼び出しの数を格納するために使用されます。

```typescript
import { StateGraph, START, END, MessagesAnnotation, Annotation } from "@langchain/langgraph";

const MessagesState = Annotation.Root({
  ...MessagesAnnotation.spec,
  llmCalls: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
});

// 関数のシグネチャ用に状態型を抽出
type MessagesStateType = typeof MessagesState.State;
```

### 解説

- **状態の永続化**: LangGraphでは、状態がエージェントの実行全体を通じて永続化されます
- **`MessagesAnnotation`**: メッセージを追加するための組み込みリデューサーを含んでいます
- **`llmCalls`フィールド**: `(x, y) => x + y`リデューサーを使用して、呼び出し回数を累積します
- **`Annotation.Root()`**: ルート状態スキーマを定義します

## 3. モデルノードの定義

モデルノードは、LLMを呼び出し、ツールを呼び出すかどうかを決定するために使用されます。

```typescript
import { SystemMessage } from "@langchain/core/messages";

async function llmCall(state: MessagesStateType) {
  return {
    messages: [await modelWithTools.invoke([
      new SystemMessage(
        "You are a helpful assistant tasked with performing arithmetic on a set of inputs."
      ),
      ...state.messages,
    ])],
    llmCalls: 1,
  };
}
```

### 解説

- このノードは、システムメッセージと既存のメッセージを組み合わせてLLMを呼び出します
- LLMは、ツールを呼び出すかどうかを決定します（`tool_calls`プロパティに含まれます）

## 4. ツールノードの定義

ツールノードは、ツールを呼び出し、結果を返すために使用されます。

```typescript
import { AIMessage, ToolMessage } from "@langchain/core/messages";

async function toolNode(state: MessagesStateType) {
  const lastMessage = state.messages.at(-1);

  if (lastMessage == null || !AIMessage.isInstance(lastMessage)) {
    return { messages: [] };
  }

  const result: ToolMessage[] = [];
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name];
    const observation = await tool.invoke(toolCall);
    result.push(observation);
  }

  return { messages: result };
}
```

### 解説

- 最後のメッセージが`AIMessage`で、`tool_calls`が含まれている場合、ツールを呼び出します
- 各ツール呼び出しに対して、対応するツールを実行し、結果を`ToolMessage`として返します

## 5. 終了ロジックの定義

条件付きエッジ関数は、LLMがツール呼び出しを行ったかどうかに基づいて、ツールノードまたは終了にルーティングするために使用されます。

```typescript
async function shouldContinue(state: MessagesStateType) {
  const lastMessage = state.messages.at(-1);
  
  // AIMessageかどうかを確認してからtool_callsにアクセス
  if (!lastMessage || !AIMessage.isInstance(lastMessage)) {
    return END;
  }
  
  // LLMがツール呼び出しを行った場合、アクションを実行
  if (lastMessage.tool_calls?.length) {
    return "toolNode";
  }
  
  // それ以外の場合は停止（ユーザーに返信）
  return END;
}
```

### 解説

- **条件付きエッジ**: この関数は、次のノードを決定します
- **`END`**: グラフの実行を終了します
- **`"toolNode"`**: ツールノードにルーティングします

## 6. エージェントの構築とコンパイル

エージェントは`StateGraph`クラスを使用して構築し、`compile`メソッドを使用してコンパイルします。

```typescript
const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")
  .compile();

// 実行
import { HumanMessage } from "@langchain/core/messages";

const result = await agent.invoke({
  messages: [new HumanMessage("Add 3 and 4.")],
});

for (const message of result.messages) {
  console.log(`[${message.type}]: ${message.text}`);
}
```

### 解説

- **`new StateGraph(MessagesState)`**: 状態スキーマを指定してグラフを作成します
- **`.addNode()`**: ノードを追加します（`"llmCall"`と`"toolNode"`）
- **`.addEdge(START, "llmCall")`**: 開始ノードから`llmCall`ノードへのエッジを追加します
- **`.addConditionalEdges()`**: 条件付きエッジを追加します（`shouldContinue`関数の結果に基づいてルーティング）
- **`.addEdge("toolNode", "llmCall")`**: ツールノードからLLMノードへのエッジを追加します（ループを形成）
- **`.compile()`**: グラフをコンパイルして実行可能なエージェントにします

### グラフの構造

```
START → llmCall → [条件分岐]
                    ├─ tool_callsあり → toolNode → llmCall (ループ)
                    └─ tool_callsなし → END
```

## まとめ

おめでとうございます！LangGraphのGraph APIを使用して、最初のエージェントを構築しました。

### Graph APIの利点

1. **明確な構造**: ノードとエッジでワークフローが視覚的に理解しやすい
2. **柔軟なルーティング**: 条件付きエッジで複雑な分岐ロジックを実装可能
3. **状態管理**: 各ノード間で状態を共有・更新できる
4. **拡張性**: 新しいノードやエッジを簡単に追加できる

### 次のステップ

- LangSmithでエージェントをトレースする方法については、[LangSmith documentation](/langsmith/trace-with-langgraph)を参照してください
- 概念的な情報については、[Graph API overview](/oss/javascript/langgraph/graph-api)を参照してください

---

**参考**: このドキュメントは、[LangGraph.js公式ドキュメント](https://docs.langchain.com/oss/javascript/langgraph/quickstart#use-the-graph-api)を翻訳・解説したものです。

