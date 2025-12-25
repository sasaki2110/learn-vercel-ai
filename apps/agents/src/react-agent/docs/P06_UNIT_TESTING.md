# ユニットテストの書き方

このドキュメントでは、react-agentのユニットテストをどのように書くかを説明します。

## 現在の状況

### `graph.test.ts`の現状

現在の`tests/unit/graph.test.ts`は以下のようになっています：

```typescript
import { it } from "@jest/globals";

it("Test", async () => {});
```

これは**空のテスト**で、実際には何もテストしていません。これはテンプレートとして残されている状態です。

### なぜ空なのか？

LangGraphのユニットテストを書くのは、以下の理由で複雑です：

1. **LLMの呼び出しが必要**: グラフを実行するには、実際にLLMを呼び出す必要がある
2. **APIキーが必要**: 実際のLLMを呼び出すにはAPIキーが必要
3. **トークン消費**: 実際のLLMを呼び出すとトークンが消費される
4. **非同期処理**: グラフの実行は非同期で、状態管理が複雑

そのため、ユニットテストでは**モック**を使用して、実際のLLMを呼び出さずにテストする必要があります。

## ユニットテストの書き方

### 1. 基本的なグラフのテスト

まず、グラフが正しく定義されているかをテストします：

```typescript
import { describe, it, expect } from "@jest/globals";
import { graph } from "../../graph.js";

describe("React Agent Graph", () => {
  it("should be defined", () => {
    expect(graph).toBeDefined();
  });

  it("should be a compiled graph", () => {
    expect(graph).toHaveProperty("invoke");
    expect(typeof graph.invoke).toBe("function");
  });
});
```

### 2. グラフの構造をテスト

グラフのノードやエッジが正しく定義されているかをテストします：

```typescript
import { describe, it, expect } from "@jest/globals";
import { graph } from "../../graph.js";

describe("Graph Structure", () => {
  it("should have callModel and tools nodes", () => {
    // グラフの構造を確認
    // 注意: LangGraph.jsでは、グラフの構造を直接取得する方法が限定的
    // 実際のテストでは、グラフが正しく動作するかを確認する方が実用的
    expect(graph).toBeDefined();
  });
});
```

### 3. モックを使用したテスト

実際のLLMを呼び出さずに、モックを使用してテストします：

```typescript
import { describe, it, expect, jest } from "@jest/globals";
import { FakeListChatModel } from "@langchain/core/chat_models/fake";
import { HumanMessage } from "@langchain/core/messages";

// 注意: この方法は、グラフの内部実装に依存するため、
// 統合テストの方が適している場合があります

describe("Graph with Mock LLM", () => {
  it("should process messages with mock LLM", async () => {
    // モックLLMを作成
    const mockLLM = new FakeListChatModel({
      responses: ["Mocked response"],
    });

    // 注意: グラフの内部でLLMをモックするのは難しい
    // 通常は、統合テストで実際のLLMを使用するか、
    // 個別の関数（callModel, routeModelOutputなど）をテストする
  });
});
```

### 4. 個別の関数をテスト

グラフ全体ではなく、個別の関数をテストする方が実用的です：

#### `routeModelOutput`のテスト

```typescript
import { describe, it, expect } from "@jest/globals";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { routeModelOutput } from "../../graph.js";

// 注意: routeModelOutputはエクスポートされていないため、
// このテストは現在実行できません
// 関数をエクスポートするか、統合テストで確認する必要があります

describe("Route Model Output", () => {
  it("should route to tools when tool_calls exist", () => {
    const state = {
      messages: [
        new HumanMessage("What is the weather?"),
        new AIMessage({
          content: "I'll check the weather",
          tool_calls: [
            {
              name: "search_tavily",
              args: { query: "weather" },
              id: "call_123",
            },
          ],
        }),
      ],
    };

    // routeModelOutputがエクスポートされていないため、このテストは実行できない
    // const result = routeModelOutput(state);
    // expect(result).toBe("tools");
  });

  it("should route to end when no tool_calls", () => {
    const state = {
      messages: [
        new HumanMessage("Hello"),
        new AIMessage("Hello! How can I help you?"),
      ],
    };

    // const result = routeModelOutput(state);
    // expect(result).toBe("__end__");
  });
});
```

### 5. 設定のテスト

`configuration.ts`の関数をテストする：

```typescript
import { describe, it, expect } from "@jest/globals";
import { ensureConfiguration } from "../../configuration.js";

describe("Configuration", () => {
  it("should return default configuration when empty", () => {
    const config = {};
    const result = ensureConfiguration(config as any);
    
    expect(result).toBeDefined();
    expect(result.model).toBeDefined();
    expect(result.systemPromptTemplate).toBeDefined();
  });

  it("should use provided configuration", () => {
    const config = {
      configurable: {
        model: "openai/gpt-4o",
        systemPromptTemplate: "Custom prompt",
      },
    };
    const result = ensureConfiguration(config as any);
    
    expect(result.model).toBe("openai/gpt-4o");
    expect(result.systemPromptTemplate).toBe("Custom prompt");
  });
});
```

## 推奨されるテスト戦略

### 1. ユニットテスト（軽量）

- **設定関数のテスト**: `ensureConfiguration`など
- **ルーティングロジックのテスト**: `routeModelOutput`など（エクスポートが必要）
- **グラフの基本構造のテスト**: グラフが定義されているか

### 2. 統合テスト（実際のLLM使用）

- **グラフ全体の動作テスト**: 実際のLLMを使用して、エンドツーエンドでテスト
- **ツール呼び出しのテスト**: 実際のツールが正しく動作するか

### 3. モックの使用

- **FakeListChatModel**: LangChainのモックLLM
- **個別関数のモック**: `jest.mock()`を使用

## 実装例：完全なユニットテスト

以下は、実用的なユニットテストの例です：

```typescript
import { describe, it, expect } from "@jest/globals";
import { graph } from "../../graph.js";
import { ensureConfiguration } from "../../configuration.js";

describe("React Agent Graph", () => {
  describe("Graph Definition", () => {
    it("should be defined", () => {
      expect(graph).toBeDefined();
    });

    it("should have invoke method", () => {
      expect(graph).toHaveProperty("invoke");
      expect(typeof graph.invoke).toBe("function");
    });
  });

  describe("Configuration", () => {
    it("should return default configuration", () => {
      const config = {};
      const result = ensureConfiguration(config as any);
      
      expect(result).toBeDefined();
      expect(result.model).toBe("openai/gpt-5-nano");
      expect(result.systemPromptTemplate).toContain("You are a helpful assistant");
    });

    it("should use custom model when provided", () => {
      const config = {
        configurable: {
          model: "openai/gpt-4o",
        },
      };
      const result = ensureConfiguration(config as any);
      
      expect(result.model).toBe("openai/gpt-4o");
    });
  });
});
```

## まとめ

### 現在の`graph.test.ts`が空な理由

1. **テンプレート状態**: 実際のテストがまだ書かれていない
2. **テストの複雑さ**: LangGraphのユニットテストは、モックが必要で複雑
3. **統合テスト優先**: 実際のLLMを使用した統合テストの方が実用的な場合が多い

### 推奨されるアプローチ

1. **設定関数のテスト**: まず、`configuration.ts`の関数をテスト
2. **グラフの基本テスト**: グラフが定義されているかを確認
3. **統合テスト**: 実際の動作を確認するには統合テストを使用
4. **関数のエクスポート**: 個別の関数をテストする場合は、エクスポートが必要

### 次のステップ

1. `graph.test.ts`に基本的なテストを追加
2. `configuration.ts`のテストを充実させる
3. 必要に応じて、個別の関数をエクスポートしてテスト

