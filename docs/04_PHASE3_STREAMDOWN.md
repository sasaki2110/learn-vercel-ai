# フェーズ3: ストリーミング最適化編 - Streamdown

このドキュメントは、Streamdownを使用してAIストリーミングに最適化されたMarkdownレンダリングを実装するための詳細ガイドです。react-markdownの代替として、ストリーミング中の未完成Markdownを美しく表示できます。

---

## 📋 目次

1. [Streamdownの理解](#1-streamdownの理解)
2. [インストールとセットアップ](#2-インストールとセットアップ)
3. [基本的な使用方法](#3-基本的な使用方法)
4. [react-markdownからの移行](#4-react-markdownからの移行)
5. [主要機能の学習](#5-主要機能の学習)
6. [AIストリーミングとの統合](#6-aiストリーミングとの統合)
7. [実践タスク](#7-実践タスク)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. Streamdownの理解

### 1.1 Streamdownとは

Streamdownは、AIストリーミングに最適化されたMarkdownレンダリングライブラリです。`react-markdown`の代替として設計されており、以下の特徴があります：

- **未終了Markdownブロックのサポート**: ストリーミング中の未完成なMarkdown構文を適切に表示
- **組み込みのタイポグラフィスタイル**: Tailwind CSSを使用した美しいデフォルトスタイル
- **GitHub Flavored Markdown (GFM)**: タスクリスト、テーブルなどのGFM機能をサポート
- **CJK言語サポート**: 中国語、日本語、韓国語の適切な処理
- **インタラクティブなコードブロック**: Shikiを使用したシンタックスハイライト
- **数式表現**: LaTeX数式のサポート
- **Mermaid図**: インタラクティブな図の表示
- **セキュリティ強化**: プロンプトインジェクション対策

### 1.2 ストリーミングMarkdownの問題点

従来のMarkdownレンダラー（`react-markdown`など）は、完全なMarkdown構文を前提としています。しかし、AIストリーミングでは以下のような問題が発生します：

#### 問題1: 未終了の構文
```
**This is bol  ← 閉じタグがない
```

#### 問題2: 部分的なコードブロック
```
```javascript
const x = 1;  ← 閉じバッククォートがない
```

#### 問題3: 未終了のリンク
```
[Click here  ← 閉じ括弧がない
```

#### 問題4: プログレッシブレンダリング
テキストがトークンごとに追加されるため、従来のレンダラーでは正しく表示されない

### 1.3 Streamdownの解決策

Streamdownは、これらの問題を以下の方法で解決します：

- **未終了ブロックの解析**: 自動的に未完成なMarkdown構文を検出し、適切にスタイリング
- **プログレッシブフォーマット**: 部分的なコンテンツにもスタイルを適用
- **シームレスな遷移**: 未完成から完成状態へのスムーズな更新
- **ゼロ設定**: デフォルトで動作

---

## 2. インストールとセットアップ

### 2.1 前提条件の確認

Streamdownを使用するには、以下の要件を満たしている必要があります：

- **Node.js**: 18以上
- **React**: 19.1.1以上（React 18+でも互換性あり）
- **Tailwind CSS**: スタイリングに必要

確認：
```bash
node --version  # 18以上であることを確認
cat package.json | grep -E "(react|tailwindcss)"
```

### 2.2 インストール方法

#### 方法1: 直接インストール

```bash
npm i streamdown
```

#### 方法2: AI Elements経由でインストール

AI Elementsの`message`コンポーネントには、Streamdownが含まれています：

```bash
npx ai-elements@latest add message
```

### 2.3 Tailwind CSSの設定

StreamdownはTailwind CSSを使用するため、設定が必要です。

#### Tailwind v4の場合

`app/globals.css`に以下を追加：

```css
@source "../node_modules/streamdown/dist/*.js";
```

**注意**: `node_modules`のパスは、CSSファイルからの相対パスに合わせて調整してください。

#### Tailwind v3の場合

`tailwind.config.js`（または`tailwind.config.ts`）の`content`配列に追加：

```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/streamdown/dist/*.js', // Streamdownを追加
  ],
  // ... その他の設定
};
```

### 2.4 インストールの確認

パッケージが正しくインストールされたか確認：

```bash
cat package.json | grep streamdown
```

---

## 3. 基本的な使用方法

### 3.1 基本的な使用例

Streamdownは`react-markdown`と同じように使用できます：

```typescript
'use client';

import { Streamdown } from 'streamdown';

export default function MarkdownPage() {
  const markdown = `# Hello World

This is **streaming** markdown!

- Item 1
- Item 2
- Item 3`;

  return <Streamdown>{markdown}</Streamdown>;
}
```

### 3.2 AIストリーミングとの統合

AI SDKの`useChat`フックと組み合わせて使用：

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { Streamdown } from 'streamdown';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
    });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === 'user' ? 'text-right' : 'text-left'
            }
          >
            <div className="inline-block max-w-2xl">
              <Streamdown isAnimating={isLoading && message.role === 'assistant'}>
                {message.content}
              </Streamdown>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me anything..."
          className="w-full px-4 py-2 border rounded-lg"
          disabled={isLoading}
        />
      </form>
    </div>
  );
}
```

### 3.3 AI Elementsとの統合

AI Elementsの`MessageResponse`コンポーネント内で使用：

```typescript
'use client';

import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Streamdown } from 'streamdown';
import { useChat } from '@ai-sdk/react';

export default function ChatWithStreamdown() {
  const { messages } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Message key={message.id} from={message.role}>
          <MessageContent>
            <MessageResponse>
              <Streamdown>{message.content}</Streamdown>
            </MessageResponse>
          </MessageContent>
        </Message>
      ))}
    </div>
  );
}
```

---

## 4. react-markdownからの移行

### 4.1 移行の手順

既存の`react-markdown`を使用しているコードをStreamdownに移行する手順：

#### ステップ1: パッケージの置き換え

```bash
# react-markdownをアンインストール（オプション）
npm uninstall react-markdown

# Streamdownをインストール
npm i streamdown
```

#### ステップ2: インポートの変更

**変更前:**
```typescript
import ReactMarkdown from 'react-markdown';
```

**変更後:**
```typescript
import { Streamdown } from 'streamdown';
```

#### ステップ3: コンポーネントの置き換え

**変更前:**
```typescript
<ReactMarkdown>{markdown}</ReactMarkdown>
```

**変更後:**
```typescript
<Streamdown>{markdown}</Streamdown>
```

### 4.2 プロップスの違い

Streamdownは`react-markdown`と互換性がありますが、いくつかの違いがあります：

#### 共通のプロップス
- `children`: Markdownテキスト
- `className`: カスタムCSSクラス

#### Streamdown固有のプロップス
- `isAnimating`: ストリーミング中かどうかを示す（アニメーション用）
- `static`: 静的モード（ストリーミングなし）

### 4.3 移行例

**移行前のコード:**
```typescript
import ReactMarkdown from 'react-markdown';

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown className="prose">
      {content}
    </ReactMarkdown>
  );
}
```

**移行後のコード:**
```typescript
import { Streamdown } from 'streamdown';

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <Streamdown className="prose">
      {content}
    </Streamdown>
  );
}
```

---

## 5. 主要機能の学習

### 5.1 組み込みのタイポグラフィスタイル

Streamdownには、美しいタイポグラフィスタイルが組み込まれています：

- **見出し**: `h1`から`h6`まで適切にスタイリング
- **リスト**: 順序付き・順序なしリスト
- **コードブロック**: シンタックスハイライト付き
- **引用**: ブロッククォート
- **テーブル**: グリッド形式のテーブル

カスタマイズは、Tailwind CSSクラスで行います：

```typescript
<Streamdown className="prose prose-lg dark:prose-invert">
  {markdown}
</Streamdown>
```

### 5.2 GitHub Flavored Markdown (GFM)

GFM機能がデフォルトで有効になっています：

#### タスクリスト

```markdown
- [x] 完了したタスク
- [ ] 未完了のタスク
```

#### テーブル

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| データ1 | データ2 | データ3 |
```

#### 取り消し線

```markdown
~~取り消されたテキスト~~
```

### 5.3 CJK言語サポート

中国語、日本語、韓国語の表意文字が正しく処理されます：

```typescript
const markdown = `**これは太字です**（日本語）

**这是粗体**（中国語）

**이것은 굵은 글씨입니다**（韓国語）`;

<Streamdown>{markdown}</Streamdown>
```

表意文字の句読点でも強調マーカーが正しく動作します。

### 5.4 インタラクティブなコードブロック

StreamdownはShikiを使用してコードブロックをハイライトします。

#### 基本的なコードブロック

```markdown
\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`
```

#### コードブロックの機能

- **シンタックスハイライト**: 100以上の言語をサポート
- **コピーボタン**: コードをクリップボードにコピー
- **ダウンロードボタン**: コードをファイルとしてダウンロード
- **言語表示**: コードブロックのヘッダーに言語名を表示

#### カスタマイズ

コードブロックのテーマをカスタマイズ：

```typescript
import { Streamdown } from 'streamdown';

<Streamdown
  codeBlockTheme="github-dark"
  codeBlockThemes={{
    light: 'github-light',
    dark: 'github-dark',
  }}
>
  {markdown}
</Streamdown>
```

### 5.5 数式表現（Mathematics）

LaTeX数式をサポートするには、追加の設定が必要です。

#### インライン数式

```markdown
インライン数式: $E = mc^2$
```

#### ブロック数式

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

#### 設定

数式サポートを有効化：

```typescript
import { Streamdown } from 'streamdown';

<Streamdown enableMath>
  {markdown}
</Streamdown>
```

**注意**: `remark-math`と`katex`が自動的に処理されます。

### 5.6 インタラクティブなMermaid図

Mermaid図を表示できます：

```markdown
\`\`\`mermaid
graph TD
    A[開始] --> B{条件}
    B -->|Yes| C[処理1]
    B -->|No| D[処理2]
    C --> E[終了]
    D --> E
\`\`\`
```

#### Mermaid図の機能

- **カスタマイズ可能なテーマ**: ライト/ダークモードに対応
- **フルスクリーン表示**: 図を拡大表示
- **自動テーマ適応**: システムのテーマに自動的に適応

#### 設定

Mermaidサポートを有効化：

```typescript
<Streamdown enableMermaid>
  {markdown}
</Streamdown>
```

### 5.7 未終了Markdownブロックのスタイリング

Streamdownの最大の特徴は、未完成なMarkdown構文を適切に表示することです。

#### 例: 未終了の太字

```typescript
const incompleteMarkdown = "**This is bol"; // 閉じタグがない

<Streamdown>{incompleteMarkdown}</Streamdown>
```

Streamdownは、未完成な太字を検出し、適切にスタイリングします。

#### 例: 未終了のコードブロック

```typescript
const incompleteCode = "```javascript\nconst x = 1;"; // 閉じバッククォートがない

<Streamdown>{incompleteCode}</Streamdown>
```

コードブロックとして認識され、シンタックスハイライトが適用されます。

#### 例: 未終了のリンク

```typescript
const incompleteLink = "[Click here"; // 閉じ括弧がない

<Streamdown>{incompleteLink}</Streamdown>
```

リンクとして認識され、適切にスタイリングされます。

### 5.8 組み込みのセキュリティ強化

Streamdownには、セキュリティ対策が組み込まれています。

#### 画像の制限

信頼できないMarkdownからの画像を制限：

```typescript
<Streamdown
  allowedImageDomains={['example.com', 'cdn.example.com']}
>
  {markdown}
</Streamdown>
```

#### リンクの制限

外部リンクを制限：

```typescript
<Streamdown
  allowedLinkDomains={['example.com']}
>
  {markdown}
</Streamdown>
```

#### プロンプトインジェクション対策

Streamdownは、潜在的なプロンプトインジェクション攻撃を防ぐための対策を実装しています。

---

## 6. AIストリーミングとの統合

### 6.1 useChatとの統合

AI SDKの`useChat`フックと組み合わせる：

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { Streamdown } from 'streamdown';

export default function StreamingChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
    });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block max-w-3xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {message.role === 'assistant' ? (
                <Streamdown isAnimating={isLoading}>
                  {message.content}
                </Streamdown>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="w-full px-4 py-2 border rounded-lg"
          disabled={isLoading}
        />
      </form>
    </div>
  );
}
```

### 6.2 AI Elementsとの統合

AI Elementsの`MessageResponse`コンポーネント内で使用：

```typescript
'use client';

import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { Streamdown } from 'streamdown';
import { useChat } from '@ai-sdk/react';

export default function ChatWithAIElements() {
  const { messages, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Message key={message.id} from={message.role}>
          <MessageContent>
            <MessageResponse>
              {message.role === 'assistant' ? (
                <Streamdown isAnimating={isLoading}>
                  {message.content}
                </Streamdown>
              ) : (
                message.content
              )}
            </MessageResponse>
          </MessageContent>
        </Message>
      ))}
    </div>
  );
}
```

### 6.3 ストリーミング中のアニメーション

`isAnimating`プロップを使用して、ストリーミング中のアニメーションを制御：

```typescript
<Streamdown
  isAnimating={isLoading && message.role === 'assistant'}
>
  {message.content}
</Streamdown>
```

### 6.4 パフォーマンスの最適化

大量のメッセージがある場合、メモ化を使用：

```typescript
import { memo } from 'react';
import { Streamdown } from 'streamdown';

const MemoizedStreamdown = memo(Streamdown);

function MessageContent({ content, isAnimating }: { content: string; isAnimating: boolean }) {
  return (
    <MemoizedStreamdown isAnimating={isAnimating}>
      {content}
    </MemoizedStreamdown>
  );
}
```

---

## 7. 実践タスク

### タスク1: react-markdownからStreamdownへの移行

**目標**: 既存のreact-markdownコードをStreamdownに移行する

**手順**:
1. Streamdownをインストール
2. インポートを変更
3. コンポーネントを置き換え
4. 動作確認

**チェックリスト**:
- [ ] Streamdownがインストールされている
- [ ] インポートが正しく変更されている
- [ ] コンポーネントが正しく動作している
- [ ] スタイルが正しく適用されている

### タスク2: ストリーミングMarkdownコンテンツの表示

**目標**: AIストリーミングとStreamdownを統合する

**手順**:
1. `useChat`フックを設定
2. Streamdownコンポーネントを統合
3. `isAnimating`プロップを設定
4. 動作確認

**チェックリスト**:
- [ ] ストリーミングが正しく動作している
- [ ] 未完成なMarkdownが適切に表示される
- [ ] アニメーションが動作している

### タスク3: コードブロックのカスタマイズ

**目標**: コードブロックのテーマとスタイルをカスタマイズする

**手順**:
1. コードブロックのテーマを設定
2. カスタムスタイルを追加
3. 動作確認

**チェックリスト**:
- [ ] テーマが正しく適用されている
- [ ] コピーボタンが動作している
- [ ] ダークモードに対応している

### タスク4: Mermaid図の実装

**目標**: Mermaid図を表示する機能を実装する

**手順**:
1. Mermaidサポートを有効化
2. Mermaid図を含むMarkdownを作成
3. 動作確認

**チェックリスト**:
- [ ] Mermaid図が表示される
- [ ] フルスクリーン表示が動作する
- [ ] テーマが正しく適用されている

### タスク5: 数式表現の実装

**目標**: LaTeX数式を表示する機能を実装する

**手順**:
1. 数式サポートを有効化
2. 数式を含むMarkdownを作成
3. 動作確認

**チェックリスト**:
- [ ] インライン数式が表示される
- [ ] ブロック数式が表示される
- [ ] 数式が正しくレンダリングされる

---

## 8. トラブルシューティング

### 8.1 よくあるエラーと解決方法

#### エラー: "Module not found: Can't resolve 'streamdown'"
**原因**: Streamdownがインストールされていない

**解決方法**:
```bash
npm i streamdown
```

#### エラー: "Tailwind CSS classes not working"
**原因**: Tailwind CSSの設定が正しくない

**解決方法**:
1. `tailwind.config.js`にStreamdownのパスを追加（Tailwind v3の場合）
2. `globals.css`に`@source`ディレクティブを追加（Tailwind v4の場合）
3. サーバーを再起動

#### エラー: "Code blocks not highlighting"
**原因**: Shikiの設定が正しくない

**解決方法**:
1. Streamdownのバージョンを確認
2. 必要に応じてテーマを明示的に設定

#### エラー: "Mermaid diagrams not rendering"
**原因**: Mermaidサポートが有効になっていない

**解決方法**:
```typescript
<Streamdown enableMermaid>
  {markdown}
</Streamdown>
```

### 8.2 パフォーマンスの問題

#### 大量のメッセージで遅い

**解決方法**:
1. メモ化を使用
2. 仮想化を検討
3. 不要な再レンダリングを防ぐ

```typescript
import { memo } from 'react';

const MemoizedStreamdown = memo(Streamdown);
```

#### ストリーミング中のパフォーマンス

**解決方法**:
1. `isAnimating`プロップを適切に設定
2. デバウンスを使用（必要に応じて）

### 8.3 スタイリングの問題

#### スタイルが適用されない

**解決方法**:
1. Tailwind CSSの設定を確認
2. `className`プロップでカスタムスタイルを追加
3. `prose`クラスを使用

```typescript
<Streamdown className="prose prose-lg dark:prose-invert">
  {markdown}
</Streamdown>
```

#### ダークモードで表示がおかしい

**解決方法**:
1. `dark:prose-invert`クラスを追加
2. カスタムテーマを設定

### 8.4 デバッグのヒント

#### ログの追加

```typescript
console.log('Markdown content:', markdown);
console.log('Is animating:', isAnimating);
```

#### ブラウザの開発者ツールを使用

- DOM構造を確認
- CSSクラスが正しく適用されているか確認
- コンソールエラーを確認

#### 最小限の例でテスト

```typescript
const simpleMarkdown = "# Hello\n\nThis is a test.";

<Streamdown>{simpleMarkdown}</Streamdown>
```

---

## 9. 次のステップ

フェーズ3を完了したら、以下のステップに進みましょう：

1. **フェーズ4: 実践編（統合プロジェクト）**
   - これまでに学習した内容を統合
   - 実用的なAIアプリケーションを構築

2. **高度な機能の学習**
   - カスタムレンダラーの作成
   - プラグインの開発
   - パフォーマンスの最適化

3. **ベストプラクティスの適用**
   - セキュリティ対策の強化
   - アクセシビリティの向上
   - テストの作成

---

## 📚 参考リソース

### 公式ドキュメント
- [Streamdown Documentation](https://streamdown.ai/docs)
- [Getting Started](https://streamdown.ai/docs/getting-started)
- [Usage Guide](https://streamdown.ai/docs/usage)
- [Configuration](https://streamdown.ai/docs/configuration)

### 機能別ドキュメント
- [CJK Language Support](https://streamdown.ai/docs/cjk-support)
- [Code Blocks](https://streamdown.ai/docs/code-blocks)
- [GitHub Flavored Markdown](https://streamdown.ai/docs/gfm)
- [Mermaid Diagrams](https://streamdown.ai/docs/mermaid)
- [Mathematics](https://streamdown.ai/docs/mathematics)
- [Security](https://streamdown.ai/docs/security)

### コミュニティ
- [GitHub Repository](https://github.com/vercel/streamdown)
- [AI Elements Documentation](https://ai-sdk.dev/elements)

---

## ✅ フェーズ3完了チェックリスト

### 環境準備
- [ ] Streamdownがインストールされている
- [ ] Tailwind CSSが正しく設定されている
- [ ] 基本的な使用例が動作している

### Streamdownの理解
- [ ] Streamdownの目的を理解している
- [ ] ストリーミングMarkdownの問題点を理解している
- [ ] Streamdownの解決策を理解している

### 実装スキル
- [ ] 基本的なMarkdownレンダリングができる
- [ ] AIストリーミングと統合できる
- [ ] react-markdownから移行できる
- [ ] 主要機能を使用できる

### 実践タスク
- [ ] react-markdownからStreamdownに移行した
- [ ] ストリーミングMarkdownコンテンツを表示した
- [ ] コードブロックをカスタマイズした
- [ ] Mermaid図を実装した
- [ ] 数式表現を実装した

---

**次のステップ**: [フェーズ4: 実践編（統合プロジェクト）](../01_LEARNING_PLAN.md#フェーズ4-実践編---統合プロジェクト)に進みましょう！

---

**学習ログ**:
- 開始日: ___________
- 完了日: ___________
- メモ: 

