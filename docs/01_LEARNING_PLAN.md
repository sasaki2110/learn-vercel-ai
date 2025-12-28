# Vercel AI SDK 学習プラン

この学習プランは、Vercel AI SDKを包括的に学習するための段階的なガイドです。以下の3つの主要リソースを網羅しています：

- [AI SDK Getting Started](https://ai-sdk.dev/getting-started)
- [AI Elements](https://ai-sdk.dev/elements)
- [Streamdown](https://streamdown.ai/)

---

## 📚 学習の全体像

### フェーズ1: 基礎編（Getting Started）
### フェーズ2: UIコンポーネント編（AI Elements）
### フェーズ3: ストリーミング最適化編（Streamdown）
### フェーズ4: 実践編（統合プロジェクト）

---

## フェーズ1: 基礎編 - AI SDK Getting Started

### 目標
- AI SDKの基本的な概念を理解する
- プロジェクトにAI SDKをインストールする
- 基本的なAI機能を実装できるようになる

### 学習内容

#### 1.1 環境準備
- [ ] Node.js 18以上がインストールされていることを確認
- [ ] Next.jsプロジェクトのセットアップ（既存プロジェクトを使用する場合は確認）
- [ ] AI SDKのインストール: `npm i ai`

#### 1.2 基礎概念の学習
- [ ] **Foundations（基礎）**の理解
  - Overview（概要）
  - Providers and Models（プロバイダーとモデル）
  - Prompts（プロンプト）
  - Tools（ツール）
  - Streaming（ストリーミング）

#### 1.3 フレームワーク別の実装
自分の使用するフレームワークに合わせて選択：

- [ ] **Next.js App Router**
  - Route Handlerの作成
  - Server Componentsでの使用
  - Client Componentsでの使用

- [ ] **Next.js Pages Router**
  - API Routesの作成
  - クライアント側での実装

- [ ] **その他のフレームワーク**（必要に応じて）
  - Svelte
  - Vue.js (Nuxt)
  - Node.js
  - Expo
  - TanStack Start

#### 1.4 実践タスク
- [ ] シンプルなチャットボットの作成
- [ ] テキスト生成機能の実装
- [ ] ストリーミングレスポンスの実装

### 参考リソース
- [Getting Started Guide](https://ai-sdk.dev/getting-started)
- [Foundations Documentation](https://ai-sdk.dev/docs/foundations)
- [Examples](https://ai-sdk.dev/examples)

---

## フェーズ2: UIコンポーネント編 - AI Elements

### 目標
- AI Elementsコンポーネントライブラリを理解する
- 事前構築されたUIコンポーネントを使用してAIアプリケーションを構築する
- shadcn/uiとの統合を理解する

### 学習内容

#### 2.1 前提条件の確認
- [ ] Node.js 18以上がインストールされている
- [ ] Next.jsプロジェクトがセットアップされている
- [ ] AI SDKがインストールされている
- [ ] shadcn/uiがインストールされている（または自動インストールされることを確認）
- [ ] AI Gateway APIキーの取得（推奨）
  - `AI_GATEWAY_API_KEY`を`env.local`に追加
  - [AI Gateway API Key取得](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys&title=Get%20your%20AI%20Gateway%20key)

#### 2.2 AI Elementsのインストール
- [ ] AI Elements CLIを使用したインストール
  ```bash
  npx ai-elements@latest
  ```
- [ ] または、shadcn/ui CLIを使用したインストール
  ```bash
  npx shadcn@latest add [component-name]
  ```

#### 2.3 コンポーネントの理解
- [ ] **基本的なコンポーネント**
  - Conversation（会話）
  - Message（メッセージ）
  - Input（入力）
  - Button（ボタン）

#### 2.4 実践タスク
- [ ] ChatGPT風のチャットインターフェースの作成
- [ ] Claude風のチャットインターフェースの作成
- [ ] Grok風のチャットインターフェースの作成
- [ ] カスタムプロンプトボタンの実装（例：Analyze data, Surprise me, Summarize text, Code, Get advice）

#### 2.5 高度な機能
- [ ] メッセージの永続化（Message Persistence）
- [ ] ストリームの再開（Resume Streams）
- [ ] ツールの使用（Tool Usage）
- [ ] 生成的なユーザーインターフェース（Generative User Interfaces）

### 参考リソース
- [AI Elements Documentation](https://ai-sdk.dev/elements)
- [Usage Guide](https://ai-sdk.dev/elements/usage)
- [Examples](https://ai-sdk.dev/elements/examples)

---

## フェーズ3: ストリーミング最適化編 - Streamdown

### 目標
- Streamdownライブラリを理解する
- react-markdownからStreamdownへの移行を理解する
- AIストリーミングに最適化されたMarkdownレンダリングを実装する

### 学習内容

#### 3.1 Streamdownの理解
- [ ] Streamdownとは何か
  - react-markdownの代替
  - AIストリーミングに最適化
  - 未終了のMarkdownブロックのサポート

#### 3.2 インストール
- [ ] Streamdownのインストール
  ```bash
  npm i streamdown
  ```
- [ ] または、AI Elements CLI経由でインストール
  ```bash
  npx ai-elements@latest add message
  ```

#### 3.3 主要機能の学習
- [ ] **組み込みのタイポグラフィスタイル**
  - 見出し、リスト、コードブロックなどのTailwindクラス

- [ ] **GitHub Flavored Markdown (GFM)**
  - タスクリスト
  - テーブル
  - その他のGFM機能

- [ ] **CJK言語サポート**
  - 中国語、日本語、韓国語のサポート
  - 表意文字の句読点での強調マーカーの正しい動作

- [ ] **美しいインタラクティブなコードブロック**
  - Shikiを使用したシンタックスハイライト
  - コピーとダウンロードボタン

- [ ] **数式表現**
  - LaTeX数式のサポート
  - remark-mathとKaTeXの統合

- [ ] **インタラクティブなMermaid図**
  - カスタマイズ可能なテーマ
  - フルスクリーン表示
  - ライト/ダークモードの自動適応

- [ ] **未終了Markdownブロックのスタイリング**
  - ストリーミング中の見出し、インラインコード、太字、斜体、リンクなどの解析

- [ ] **組み込みのセキュリティ強化**
  - 信頼できないMarkdownからの画像とリンクの保護
  - プロンプトインジェクション対策

#### 3.4 実践タスク
- [ ] react-markdownからStreamdownへの移行
- [ ] ストリーミングMarkdownコンテンツの表示
- [ ] コードブロックのカスタマイズ
- [ ] Mermaid図の実装
- [ ] 数式表現の実装

### 参考リソース
- [Streamdown Documentation](https://streamdown.ai/docs)
- [GitHub Repository](https://github.com/vercel/streamdown)

---

## フェーズ4: 実践編 - 統合プロジェクト

### 目標
- これまでに学習した内容を統合する
- 実用的なAIアプリケーションを構築する
- ベストプラクティスを適用する

### プロジェクト案

#### プロジェクト1: 高度なチャットボット
- [ ] AI SDK Coreを使用したバックエンド実装
- [ ] AI Elementsを使用したフロントエンド実装
- [ ] Streamdownを使用したメッセージレンダリング
- [ ] ツール呼び出しの実装
- [ ] メッセージの永続化
- [ ] エラーハンドリング

#### プロジェクト2: AI支援ドキュメント生成ツール
- [ ] テキスト生成機能
- [ ] 構造化データの生成
- [ ] Markdown形式での出力
- [ ] Streamdownを使用したリアルタイムプレビュー

#### プロジェクト3: マルチモーダルAIアプリケーション
- [ ] テキスト生成
- [ ] 画像生成
- [ ] 音声転写
- [ ] 統合UIの構築

### ベストプラクティス
- [ ] エラーハンドリングの実装
- [ ] ローディング状態の管理
- [ ] レート制限の考慮
- [ ] セキュリティ対策の実装
- [ ] パフォーマンス最適化
- [ ] テストの作成

---

## 📖 追加学習リソース

### 公式ドキュメント
- [AI SDK Core Documentation](https://ai-sdk.dev/docs/ai-sdk-core)
- [AI SDK UI Documentation](https://ai-sdk.dev/docs/ai-sdk-ui)
- [Agents Documentation](https://ai-sdk.dev/docs/agents)

### 実践的な例
- [Cookbook](https://ai-sdk.dev/cookbook)
- [Examples](https://ai-sdk.dev/examples)
- [Showcase](https://ai-sdk.dev/showcase)

### コミュニティ
- [GitHub Discussions](https://github.com/vercel/ai/discussions)
- [GitHub Repository](https://github.com/vercel/ai)

---

## 🎯 学習の進め方

1. **順序立てて学習**: フェーズ1から順番に進めることを推奨します
2. **実践重視**: 各フェーズで実際にコードを書いて動作確認をしましょう
3. **段階的な複雑化**: シンプルな例から始めて、徐々に複雑な機能を追加していきましょう
4. **ドキュメントを参照**: 公式ドキュメントを常に参照しながら進めましょう
5. **コミュニティを活用**: 困ったときはGitHub Discussionsやコミュニティを活用しましょう

---

## ✅ チェックリスト

### 基礎スキル
- [ ] AI SDKの基本的な概念を理解している
- [ ] プロバイダーとモデルの選択ができる
- [ ] プロンプトエンジニアリングの基礎を理解している
- [ ] ストリーミングの仕組みを理解している

### 実装スキル
- [ ] AI SDKをプロジェクトに統合できる
- [ ] 基本的なチャットボットを実装できる
- [ ] AI Elementsコンポーネントを使用できる
- [ ] Streamdownを使用してMarkdownをレンダリングできる

### 高度なスキル
- [ ] ツール呼び出しを実装できる
- [ ] エージェントを構築できる
- [ ] エラーハンドリングを適切に実装できる
- [ ] パフォーマンスを最適化できる

---

## 📝 学習ログ

各フェーズの学習日とメモを記録しましょう：

### フェーズ1: 基礎編
- 開始日: ___________
- 完了日: ___________
- メモ: 

### フェーズ2: UIコンポーネント編
- 開始日: ___________
- 完了日: ___________
- メモ: 

### フェーズ3: ストリーミング最適化編
- 開始日: ___________
- 完了日: ___________
- メモ: 

### フェーズ4: 実践編
- 開始日: ___________
- 完了日: ___________
- メモ: 

---

**Happy Learning! 🚀**

