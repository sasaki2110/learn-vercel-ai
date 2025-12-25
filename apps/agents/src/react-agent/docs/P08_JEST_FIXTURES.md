# JestのFixtures（pytestのfixtures相当）

Jestには、pytestのfixturesに相当する機能がいくつかあります。このドキュメントでは、それらの使い方を説明します。

## pytestのfixturesとの比較

### pytestのfixtures

```python
# conftest.py
@pytest.fixture
def sample_data():
    return {"key": "value"}

# test_example.py
def test_something(sample_data):
    assert sample_data["key"] == "value"
```

### Jestの対応機能

Jestには、pytestのfixturesに直接相当する機能はありませんが、以下の方法で同様のことができます：

1. **`beforeEach` / `afterEach`** - 各テストの前後に実行
2. **`beforeAll` / `afterAll`** - すべてのテストの前後に実行
3. **`describe`ブロック内での変数共有**
4. **カスタムヘルパー関数**
5. **`jest.mock()`** - モックの再利用

## 1. beforeEach / afterEach（最も一般的）

各テストの前後に実行されるコードを定義します。

```typescript
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("Example with beforeEach", () => {
  let testData: { key: string };

  // 各テストの前に実行
  beforeEach(() => {
    testData = { key: "value" };
    // 初期化処理など
  });

  // 各テストの後に実行
  afterEach(() => {
    // クリーンアップ処理など
    testData = {} as { key: string };
  });

  it("should use testData", () => {
    expect(testData.key).toBe("value");
  });

  it("should have fresh testData", () => {
    // 前のテストの影響を受けない（beforeEachが再実行される）
    expect(testData.key).toBe("value");
  });
});
```

## 2. beforeAll / afterAll

すべてのテストの前後に1回だけ実行されます。

```typescript
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Example with beforeAll", () => {
  let sharedResource: any;

  // すべてのテストの前に1回だけ実行
  beforeAll(() => {
    sharedResource = initializeExpensiveResource();
  });

  // すべてのテストの後に1回だけ実行
  afterAll(() => {
    cleanupExpensiveResource(sharedResource);
  });

  it("should use shared resource", () => {
    expect(sharedResource).toBeDefined();
  });

  it("should reuse the same resource", () => {
    // 同じsharedResourceを共有
    expect(sharedResource).toBeDefined();
  });
});
```

## 3. describeブロック内での変数共有

`describe`ブロック内で変数を定義して、すべてのテストで共有できます。

```typescript
import { describe, it, expect } from "@jest/globals";

describe("Example with shared variables", () => {
  // describeブロック内で定義された変数は、すべてのテストで共有される
  const sharedConfig = {
    apiKey: "test-key",
    timeout: 5000,
  };

  it("should use shared config", () => {
    expect(sharedConfig.apiKey).toBe("test-key");
  });

  it("should also use shared config", () => {
    expect(sharedConfig.timeout).toBe(5000);
  });
});
```

## 4. カスタムヘルパー関数

共通の処理を関数として定義して、テストで使用します。

```typescript
import { describe, it, expect } from "@jest/globals";

// ヘルパー関数（fixturesの代替）
function createMockTool() {
  return {
    name: "mock_tool",
    description: "A mock tool for testing",
    invoke: jest.fn().mockResolvedValue("mocked result"),
  };
}

function createTestConfig() {
  return {
    configurable: {
      model: "openai/gpt-4o",
      systemPromptTemplate: "Test prompt",
    },
  };
}

describe("Example with helper functions", () => {
  it("should use mock tool", () => {
    const tool = createMockTool();
    expect(tool.name).toBe("mock_tool");
  });

  it("should use test config", () => {
    const config = createTestConfig();
    expect(config.configurable.model).toBe("openai/gpt-4o");
  });
});
```

## 5. jest.mock()によるモックの再利用

モックを定義して、複数のテストで再利用できます。

```typescript
import { describe, it, expect, jest } from "@jest/globals";

// モックを定義（すべてのテストで共有される）
jest.mock("@langchain/community/tools/tavily_search", () => {
  return {
    TavilySearchResults: jest.fn().mockImplementation(() => {
      return {
        name: "tavily_search_results_json",
        description: "Mocked search tool",
        invoke: jest.fn().mockResolvedValue([
          { url: "https://example.com", content: "Mocked result" },
        ]),
      };
    }),
  };
});

describe("Example with jest.mock", () => {
  it("should use mocked tool", () => {
    // モックが自動的に適用される
    const { TOOLS } = require("../../tools.js");
    expect(TOOLS[0].name).toBe("tavily_search_results_json");
  });
});
```

## 実践例：react-agentのテストでの使用

### 例1: テストデータの準備

```typescript
import { describe, it, expect, beforeEach } from "@jest/globals";
import { ensureConfiguration } from "../../configuration.js";

describe("Configuration Tests", () => {
  let defaultConfig: any;

  beforeEach(() => {
    // 各テストの前にデフォルト設定を準備
    defaultConfig = {};
  });

  it("should return default model", () => {
    const result = ensureConfiguration(defaultConfig);
    expect(result.model).toBe("openai/gpt-5-nano");
  });

  it("should return default prompt", () => {
    const result = ensureConfiguration(defaultConfig);
    expect(result.systemPromptTemplate).toContain("You are a helpful");
  });
});
```

### 例2: モックの準備

```typescript
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("Graph Tests", () => {
  let mockTool: any;

  beforeEach(() => {
    // 各テストの前にモックツールを準備
    mockTool = {
      name: "test_tool",
      invoke: jest.fn().mockResolvedValue("result"),
    };
  });

  it("should use mock tool", () => {
    expect(mockTool.name).toBe("test_tool");
  });
});
```

### 例3: 非同期リソースの準備

```typescript
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Integration Tests", () => {
  let testClient: any;

  beforeAll(async () => {
    // すべてのテストの前に1回だけ実行
    testClient = await initializeTestClient();
  });

  afterAll(async () => {
    // すべてのテストの後に1回だけ実行
    await cleanupTestClient(testClient);
  });

  it("should use test client", () => {
    expect(testClient).toBeDefined();
  });
});
```

## pytestのfixturesとの主な違い

| 機能 | pytest | Jest |
|------|--------|------|
| **基本的なfixtures** | `@pytest.fixture` | `beforeEach` / `beforeAll` |
| **スコープ** | `function`, `class`, `module`, `session` | `describe`ブロック単位 |
| **依存関係** | `@pytest.fixture`の引数で指定 | 手動で順序を制御 |
| **自動注入** | テスト関数の引数で自動注入 | 変数として手動で使用 |
| **パラメータ化** | `@pytest.fixture(params=[...])` | `describe.each` / `it.each` |

## まとめ

Jestには、pytestのfixturesに直接相当する機能はありませんが、以下の方法で同様のことができます：

1. ✅ **`beforeEach` / `afterEach`** - 各テストの前後に実行（最も一般的）
2. ✅ **`beforeAll` / `afterAll`** - すべてのテストの前後に1回だけ実行
3. ✅ **`describe`ブロック内での変数共有** - シンプルな共有データ
4. ✅ **カスタムヘルパー関数** - 再利用可能な処理
5. ✅ **`jest.mock()`** - モックの再利用

pytestのfixturesほど自動化されていませんが、十分に実用的です。

