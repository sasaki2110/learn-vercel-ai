# テストの実行方法

このドキュメントでは、react-agentのテストを実行する方法を説明します。

## テストの種類

プロジェクトには2種類のテストがあります：

### 1. ユニットテスト（`tests/unit/`）

- **目的**: 個別の関数やモジュールの動作をテスト
- **特徴**: 
  - モックを使用してLLMを呼び出さない
  - 高速に実行可能
  - APIキー不要

### 2. 統合テスト（`tests/integration/`）

- **目的**: 実際のLLMを使用してグラフ全体の動作をテスト
- **特徴**:
  - 実際のLLM APIを呼び出す
  - APIキーが必要（`.env`ファイルに設定）
  - トークン消費あり
  - 実行に時間がかかる

## セットアップ

### 1. 依存関係のインストール

```bash
cd apps/agents
npm install
```

必要なパッケージ：
- `jest`: テストフレームワーク
- `ts-jest`: TypeScript用のJestトランスフォーマー
- `@jest/globals`: Jestのグローバル関数

### 2. 環境変数の設定（統合テストの場合）

統合テストを実行する場合は、`.env`ファイルにAPIキーを設定してください：

```bash
# .env
OPENAI_API_KEY="your-api-key-here"
# または
ANTHROPIC_API_KEY="your-api-key-here"
```

## テストの実行

### すべてのテストを実行

```bash
cd apps/agents
npm test
```

または、直接Jestコマンドを使用：

```bash
cd apps/agents
NODE_OPTIONS=--experimental-vm-modules jest
```

### ユニットテストのみ実行

```bash
cd apps/agents
npm run test:unit
```

または：

```bash
NODE_OPTIONS=--experimental-vm-modules jest --testPathPattern=tests/unit
```

### 統合テストのみ実行

```bash
cd apps/agents
npm run test:integration
```

または：

```bash
NODE_OPTIONS=--experimental-vm-modules jest --testPathPattern=tests/integration
```

**注意**: 統合テストは実際のLLM APIを呼び出すため、APIキーが必要で、トークン消費があります。

### 特定のエージェントのみテスト

特定のエージェントのテストのみを実行する場合：

#### react-agent

```bash
cd apps/agents
# react-agentのすべてのテスト
npm run test:react-agent

# react-agentのユニットテストのみ
npm run test:react-agent:unit

# react-agentの統合テストのみ
npm run test:react-agent:integration
```

#### memory-agent

```bash
cd apps/agents
# memory-agentのすべてのテスト
npm run test:memory-agent

# memory-agentのユニットテストのみ
npm run test:memory-agent:unit

# memory-agentの統合テストのみ
npm run test:memory-agent:integration
```

#### その他のエージェント

他のエージェント（retrieval-agent、research-agentなど）をテストする場合は、Jestコマンドを直接使用：

```bash
cd apps/agents
# retrieval-agentのすべてのテスト
NODE_OPTIONS=--experimental-vm-modules jest --testPathPattern=retrieval-agent

# research-agentのすべてのテスト
NODE_OPTIONS=--experimental-vm-modules jest --testPathPattern=research-agent
```

### ウォッチモードで実行

ファイル変更を監視して自動的にテストを再実行：

```bash
cd apps/agents
npm run test:watch
```

### カバレッジレポートを生成

```bash
cd apps/agents
npm run test:coverage
```

カバレッジレポートは`coverage/`ディレクトリに生成されます。

## テストファイルの場所

```
apps/agents/src/
├── react-agent/
│   └── tests/
│       ├── unit/
│       │   └── graph.test.ts          # ユニットテスト
│       └── integration/
│           └── graph.int.test.ts      # 統合テスト
└── memory-agent/
    └── tests/
        ├── unit/
        │   ├── configuration.test.ts
        │   └── graph.test.ts
        └── integration/
            └── graph.int.test.ts
```

## テストの例

### ユニットテストの例

```typescript
// tests/unit/graph.test.ts
import { it } from "@jest/globals";

it("Test", async () => {
  // モックを使用したテスト
});
```

### 統合テストの例

```typescript
// tests/integration/graph.int.test.ts
import { it, expect } from "@jest/globals";
import { BaseMessage } from "@langchain/core/messages";
import { graph } from "../../graph.js";

it("Simple runthrough", async () => {
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

## LLMのモック（トークン節約）

ユニットテストでLLMをモックするには、`@langchain/core`の`FakeListChatModel`を使用できます：

```typescript
import { FakeListChatModel } from "@langchain/core/chat_models/fake";

// モックLLMを作成
const mockLLM = new FakeListChatModel({
  responses: ["Mocked response"],
});
```

詳細は、プロジェクト内の他のテストファイルを参照してください。

## トラブルシューティング

### エラー: "Cannot find module"

- TypeScriptのビルドが必要な場合があります：
  ```bash
  npm run build:internal
  ```

### エラー: "Experimental VM modules"

- Node.jsのバージョンを確認してください（Node.js 20以上が必要）
- `NODE_OPTIONS=--experimental-vm-modules`が正しく設定されているか確認

### 統合テストが失敗する

- `.env`ファイルにAPIキーが設定されているか確認
- ネットワーク接続を確認
- APIキーの有効性を確認
- 統合テストは実際のLLM APIを呼び出すため、APIキーとトークン消費が必要です
- ユニットテストのみを実行する場合は `npm run test:unit` を使用してください

## 参考

- [Jest公式ドキュメント](https://jestjs.io/)
- [ts-jest公式ドキュメント](https://kulshekhar.github.io/ts-jest/)
- [LangChainテストガイド](https://js.langchain.com/docs/contributing/testing)

