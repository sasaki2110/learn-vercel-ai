# LangGraph Studio での起動方法

Python版の`langgraph dev`に相当する、TypeScript版でのLangGraph Studioの起動方法を説明します。

## 概要

LangGraph Studioは、グラフを可視化・デバッグするためのGUIアプリケーションです。TypeScript版でも、LangGraph CLIサーバーを起動し、Studioから接続することで使用できます。

## 起動手順

### 1. LangGraph Studioについて

LangGraph Studioは、グラフを可視化・デバッグするためのツールです。以下の方法で利用できます：

**注意**: LangGraph Studioのダウンロード方法は変更されている可能性があります。最新の情報は以下を確認してください：
- [LangGraph公式リポジトリ](https://github.com/langchain-ai/langgraph)
- [LangGraph公式ドキュメント](https://langchain-ai.github.io/langgraphjs/)

**代替方法**: LangGraph CLIの`dev`コマンドは、Web UIを提供する場合があります。ブラウザで`http://localhost:2024`にアクセスして確認してください。

### 2. LangGraph CLIサーバーの起動

プロジェクトルートまたは`apps/agents`ディレクトリで、開発サーバーを起動します：

```bash
# プロジェクトルートから
cd /root/learn-vercel-ai
npm run dev

# または、agentsディレクトリから直接
cd apps/agents
npm run dev
```

**実行されるコマンド**:
```bash
npx @langchain/langgraph-cli dev --port 2024 --config ../../langgraph.json
```

**サーバーが起動すると**:
- **APIサーバー**がポート2024で起動（REST APIエンドポイント）
- `langgraph.json`で定義されたグラフがロードされる
- **注意**: このサーバーはAPIのみを提供し、Web UIは含まれていません
- Web UIは、このプロジェクトのWebアプリ（`http://localhost:3000`）で提供されます

### 3. グラフへのアクセス方法

**重要**: `http://localhost:2024`は**APIサーバーのみ**で、Web UIは提供していません。このプロジェクトには、**Webアプリ（Next.js）がLangGraph Studioの代替として含まれています**。

#### 推奨方法: Webアプリ（Next.js）を使用

このプロジェクトには、LangGraph Studioの代替としてWebアプリが含まれています：

1. **開発サーバーを起動**
   ```bash
   # プロジェクトルートから
   npm run dev
   ```
   
   これで以下が起動します：
   - **Webアプリ**: `http://localhost:3000`（Next.js）
   - **エージェントサーバー**: `http://localhost:2024`（LangGraph CLI API）

2. **ブラウザでアクセス**
   - `http://localhost:3000`にアクセス
   - チャット画面が表示されます

3. **接続設定**
   - **Deployment URL**: `http://localhost:2024`（自動入力されている場合あり）
   - **Assistant/Graph ID**: `agent`（react-agent）または他のグラフID
   - **LangSmith API Key**: デプロイ済みサーバーに接続する場合のみ必要

4. **グラフの使用**
   - メッセージを送信してエージェントをテスト
   - 会話履歴を確認
   - ツール呼び出しの結果を確認

#### 方法B: LangSmith Studio（Web版）を使用

LangSmith StudioのWeb版を使用して、グラフを可視化・デバッグできます：

1. **開発サーバーを起動**
   ```bash
   npm run dev  # プロジェクトルートから
   ```

2. **LangSmith Studioにアクセス**
   - ブラウザで以下のURLにアクセス：
     ```
     https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
     ```
   - **注意**: `http://localhost:2024`ではなく、`http://127.0.0.1:2024`を使用してください

3. **グラフの選択**
   - LangSmith Studioが開くと、デフォルトで最初のグラフ（`memory_agent`など）が表示される場合があります
   - **react-agentを開くには**、URLに`assistantId`パラメータを追加：
     ```
     https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024&assistantId=agent
     ```
   - または、StudioのUI内でグラフを切り替えることができます

4. **利用可能なグラフID**
   - `agent` - react-agent
   - `memory_agent` - memory-agent
   - `retrieval_agent` - retrieval-agent
   - `research_agent` - research-agent
   - `research_index_graph` - research-index-graph

5. **グラフの可視化とデバッグ**
   - グラフの構造が可視化されます
   - ノードをクリックして詳細を確認
   - メッセージを送信してエージェントをテスト
   - 状態の変化をリアルタイムで確認

#### 補足: APIサーバーについて

`http://localhost:2024`はREST APIサーバーで、直接ブラウザでアクセスしてもWeb UIは表示されません。以下のようなAPIエンドポイントを提供しています：

- `/assistants/{assistantId}/runs` - グラフの実行
- `/assistants/{assistantId}/threads` - スレッド管理
- など

これらのエンドポイントは、Webアプリ（`http://localhost:3000`）やLangSmith Studioから内部的に使用されます。

## Python版との比較

### Python版
```bash
# Python版の場合
langgraph dev
# → LangGraph Studioが自動的に起動・接続
```

### TypeScript版
```bash
# ステップ1: CLIサーバーを起動
npm run dev  # または npx @langchain/langgraph-cli dev

# ステップ2: LangGraph Studioアプリを起動して接続
# Studioアプリで http://localhost:2024 に接続
```

## 利用可能なグラフ

`langgraph.json`で定義されているグラフ：

- **`agent`** → react-agent（ReActエージェント）
- **`memory_agent`** → memory-agent（メモリ機能付き）
- **`research_agent`** → research-agent（リサーチエージェント）
- **`research_index_graph`** → research-agentのインデックスグラフ
- **`retrieval_agent`** → retrieval-agent（検索エージェント）

## LangGraph Studioの機能

### 1. グラフの可視化
- ノードとエッジの構造を視覚的に確認
- 各ノードの詳細情報を表示

### 2. インタラクティブなデバッグ
- メッセージを送信してエージェントをテスト
- 各ノードの実行結果を確認
- 状態の変化を追跡

### 3. 状態の編集と再実行
- 過去の状態を編集して再実行
- 特定のノードから実行を再開

### 4. スレッド管理
- 会話履歴（スレッド）の管理
- 新しいスレッドの作成
- スレッド間の切り替え

### 5. LangSmith統合
- トレーシングとログの確認
- パフォーマンスの分析

## トラブルシューティング

### サーバーが起動しない場合

1. **ポート2024が使用中**
   ```bash
   # 別のポートを指定
   npx @langchain/langgraph-cli dev --port 3000 --config ../../langgraph.json
   ```

2. **環境変数が設定されていない**
   - `.env`ファイルが正しく設定されているか確認
   - 必要なAPIキーが設定されているか確認

3. **依存関係がインストールされていない**
   ```bash
   npm install
   ```

### Studioが接続できない場合

1. **サーバーが起動しているか確認**
   - ターミナルでサーバーのログを確認
   - `http://localhost:2024`にアクセスして確認

2. **URLが正しいか確認**
   - `http://localhost:2024`（末尾にスラッシュなし）

3. **ファイアウォールの設定**
   - ローカルホストへの接続が許可されているか確認

## 開発ワークフロー

### 推奨ワークフロー

1. **コードを編集**
   - `graph.ts`、`tools.ts`などを編集

2. **ホットリロード**
   - LangGraph CLIサーバーは自動的に変更を検知
   - コードの変更が自動的に反映される

3. **Studioでテスト**
   - Studioからメッセージを送信
   - 動作を確認

4. **デバッグ**
   - 状態を確認
   - ノードの実行結果を確認
   - 必要に応じて状態を編集して再実行

## まとめ

TypeScript版でも、Python版の`langgraph dev`と同様の開発体験が得られます：

### 推奨方法

#### 方法1: プロジェクトのWebアプリを使用（推奨）

1. ✅ `npm run dev`で開発サーバーを起動（ルートから実行）
   - Webアプリ（`http://localhost:3000`）とエージェントAPIサーバー（`http://localhost:2024`）の両方が起動

2. ✅ ブラウザで`http://localhost:3000`にアクセス
   - チャット画面が表示されます
   - これがLangGraph Studioの代替として機能します

3. ✅ 接続設定
   - Deployment URL: `http://localhost:2024`
   - Assistant/Graph ID: `agent`（または他のグラフID）

4. ✅ グラフを使用してデバッグ
   - メッセージを送信してエージェントをテスト
   - 会話履歴を確認
   - ツール呼び出しの結果を確認

#### 方法2: LangSmith Studio（Web版）を使用

1. ✅ `npm run dev`で開発サーバーを起動

2. ✅ LangSmith Studioにアクセス
   ```
   https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024&assistantId=agent
   ```
   - `assistantId=agent`でreact-agentを直接開きます
   - 他のグラフを開く場合は、`assistantId`を変更：
     - `assistantId=memory_agent` - memory-agent
     - `assistantId=retrieval_agent` - retrieval-agent
     - `assistantId=research_agent` - research-agent

3. ✅ グラフの可視化とデバッグ
   - グラフの構造が可視化されます
   - ノードをクリックして詳細を確認
   - メッセージを送信してエージェントをテスト

### 重要なポイント

- **`http://localhost:2024`**: APIサーバーのみ（Web UIなし）
- **`http://localhost:3000`**: Webアプリ（LangGraph Studioの代替）
- このプロジェクトには、Webアプリが含まれており、追加のStudioアプリは不要です
- Webアプリから`http://localhost:2024`のAPIサーバーに接続して使用します

