# React Agent ファイル構成

このドキュメントでは、`react-agent`フォルダのファイル構成と各ファイルの役割を説明します。

## ディレクトリ構造

```
react-agent/
├── configuration.ts      # エージェントの設定管理
├── graph.ts              # メインのグラフ定義（ReActループ）
├── prompts.ts            # システムプロンプトテンプレート
├── tools.ts              # エージェントが使用するツール定義
├── utils.ts              # ユーティリティ関数（モデル読み込みなど）
├── README.md             # エージェントの概要とセットアップ手順
├── docs/                 # 学習用ドキュメント
│   ├── P01_ FILE_STRUCTURE.md      # ファイル構成の説明
│   ├── P02_STATE_EXPLANATION.md    # 状態（State）の説明
│   └── P03_INVOCATION_FLOW.md       # 呼び出しフローの説明
├── static/               # 静的ファイル（画像など）
│   └── studio_ui.png     # LangGraph StudioのUIスクリーンショット
└── tests/                # テストファイル
    ├── unit/             # ユニットテスト
    │   └── graph.test.ts
    └── integration/      # 統合テスト
        └── graph.int.test.ts
```

## 各ファイルの詳細

### 1. `graph.ts` - メインのグラフ定義

**役割**: ReActエージェントのコアロジックを定義するファイル

**主要な構成要素**:

- **`callModel`関数**: LLMを呼び出して推論を行う
  - システムプロンプトと会話履歴をLLMに送信
  - ツールをバインドしたモデルを使用
  - レスポンスをメッセージとして返す

- **`routeModelOutput`関数**: LLMの出力に基づいてルーティングを決定
  - ツール呼び出しがある場合 → `"tools"`ノードへ
  - ツール呼び出しがない場合 → `"__end__"`（終了）

- **`workflow`**: StateGraphを使用してグラフを構築
  - `callModel`ノード: LLM推論
  - `tools`ノード: ツール実行（ToolNodeを使用）
  - エッジ: ノード間の接続を定義
    - `__start__` → `callModel`: エントリーポイント
    - `callModel` → `tools` or `__end__`: 条件分岐エッジ
    - `tools` → `callModel`: ツール実行後の再推論

- **`graph`**: コンパイルされたグラフ（エクスポート）

**ReActループの流れ**:
```
ユーザー入力
  ↓
callModel (LLM推論)
  ↓
routeModelOutput (ルーティング判定)
  ├─ ツール呼び出しあり → tools (ツール実行) → callModel (再推論)
  └─ ツール呼び出しなし → __end__ (終了)
```

---

### 2. `configuration.ts` - 設定管理

**役割**: エージェントの設定スキーマとデフォルト値を定義

**主要な構成要素**:

- **`ConfigurationSchema`**: 設定可能なパラメータの型定義
  - `systemPromptTemplate`: システムプロンプトテンプレート
  - `model`: 使用するLLMモデル名

- **`ensureConfiguration`関数**: 設定のデフォルト値を確保
  - 設定が提供されていない場合、デフォルト値を使用
  - デフォルトモデル: `"openai/gpt-5-nano"`
  - デフォルトプロンプト: `SYSTEM_PROMPT_TEMPLATE`

**使用例**:
```typescript
const config = ensureConfiguration(runnableConfig);
// config.model と config.systemPromptTemplate が利用可能
```

---

### 3. `tools.ts` - ツール定義

**役割**: エージェントが使用できるツールを定義

**現在のツール**:

- **`TavilySearchResults`**: Web検索ツール
  - Tavily APIを使用した検索機能
  - `maxResults: 3`で最大3件の結果を返す

- **`TOOLS`配列**: すべてのツールをエクスポート
  - 新しいツールを追加する場合は、この配列に追加

**カスタムツールの追加方法**:
1. `@langchain/core/tools`の`Tool`インターフェースを実装
2. `TOOLS`配列に追加
3. エージェントが自動的にツールを認識して使用可能に

**参考**: https://js.langchain.com/docs/how_to/custom_tools/#tool-function

---

### 4. `utils.ts` - ユーティリティ関数

**役割**: 共通で使用されるユーティリティ関数を定義

**主要な関数**:

- **`loadChatModel`関数**: チャットモデルを読み込む
  - パラメータ: `fullySpecifiedName` (例: `"openai/gpt-5-nano"`)
  - 形式: `"provider/model"` または `"provider/account/provider/model"`
  - プロバイダー名がない場合は、モデル名のみで初期化
  - `langchain/chat_models/universal`の`initChatModel`を使用

**使用例**:
```typescript
const model = await loadChatModel("openai/gpt-5-nano");
// OpenAIのgpt-5-nanoモデルが読み込まれる
```

---

### 5. `prompts.ts` - プロンプトテンプレート

**役割**: システムプロンプトのテンプレートを定義

**主要な構成要素**:

- **`SYSTEM_PROMPT_TEMPLATE`**: デフォルトのシステムプロンプト
  - プレースホルダー: `{system_time}` - 現在時刻に置き換えられる
  - シンプルな「helpful AI assistant」プロンプト

**カスタマイズ方法**:
- このファイルでプロンプトを編集
- または`configuration.ts`で動的に変更可能

---

### 6. `tests/` - テストファイル

**役割**: エージェントの動作を検証するテスト

**構成**:

- **`tests/unit/graph.test.ts`**: ユニットテスト
  - グラフの基本的な動作をテスト

- **`tests/integration/graph.int.test.ts`**: 統合テスト
  - 実際のLLMを使用した統合テスト
  - 注意: APIキーが必要で、トークン消費あり

**テスト実行**:
```bash
npm test
# または
npm run test:unit
npm run test:integration
```

---

### 7. `static/` - 静的ファイル

**役割**: ドキュメント用の画像やその他の静的ファイル

- `studio_ui.png`: LangGraph StudioのUIスクリーンショット

---

## ファイル間の依存関係

```
graph.ts
  ├─ configuration.ts (設定の取得)
  ├─ tools.ts (ツールの使用)
  ├─ utils.ts (モデルの読み込み)
  └─ prompts.ts (プロンプトテンプレート)
      └─ configuration.ts (デフォルトプロンプトとして使用)
```

## データフロー

1. **初期化**: `graph.ts`が`configuration.ts`から設定を取得
2. **モデル読み込み**: `utils.ts`の`loadChatModel`でモデルを読み込み
3. **ツールバインド**: `tools.ts`の`TOOLS`をモデルにバインド
4. **推論**: `callModel`関数でLLMを呼び出し
5. **ルーティング**: `routeModelOutput`で次のノードを決定
6. **ツール実行**: 必要に応じて`tools`ノードでツールを実行
7. **再推論**: ツール実行後、再度`callModel`で推論

## カスタマイズのポイント

### モデルの変更
- `configuration.ts`のデフォルトモデルを変更
- または実行時に`configurable.model`で指定

### プロンプトの変更
- `prompts.ts`でテンプレートを編集
- または実行時に`configurable.systemPromptTemplate`で指定

### ツールの追加
- `tools.ts`の`TOOLS`配列に新しいツールを追加
- カスタムツールを作成する場合は`@langchain/core/tools`を参照

### グラフロジックの変更
- `graph.ts`でノードやエッジを追加・変更
- 新しいノードを追加する場合は`.addNode()`を使用
- ルーティングロジックを変更する場合は`routeModelOutput`を編集

## 参考リンク

- [LangGraph.js公式ドキュメント](https://langchain-ai.github.io/langgraphjs/)
- [LangChain Tools](https://js.langchain.com/docs/how_to/custom_tools/)
- [MessagesAnnotation](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#messagesannotation)

