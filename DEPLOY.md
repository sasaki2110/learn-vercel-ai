# デプロイガイド

## AWS/GCPへのLangGraphエージェントデプロイ

### GCP Cloud Run（推奨）

#### 1. 前提条件
- GCPプロジェクトの作成
- Cloud Build APIの有効化
- Cloud Run APIの有効化

#### 2. デプロイ手順

```bash
# プロジェクトルートから
cd /root/learn-vercel-ai

# GCPにログイン
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Cloud Buildでビルド＆デプロイ
gcloud builds submit --config apps/agents/cloudbuild.yaml

# または、手動でDockerビルド＆デプロイ
docker build -f apps/agents/Dockerfile -t gcr.io/YOUR_PROJECT_ID/langgraph-agents .
docker push gcr.io/YOUR_PROJECT_ID/langgraph-agents

gcloud run deploy langgraph-agents \
  --image gcr.io/YOUR_PROJECT_ID/langgraph-agents \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 2024 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "OPENAI_API_KEY=your-key"
```

#### 3. 環境変数の設定

Cloud RunのコンソールまたはCLIで環境変数を設定：
- `OPENAI_API_KEY`
- その他必要な環境変数（`.env`ファイルの内容）

#### 4. デプロイURLの取得

デプロイ後、以下のコマンドでURLを取得：
```bash
gcloud run services describe langgraph-agents --region asia-northeast1 --format 'value(status.url)'
```

---

### AWS App Runner

#### 1. 前提条件
- AWSアカウント
- ECR（Elastic Container Registry）リポジトリの作成

#### 2. デプロイ手順

```bash
# Dockerイメージをビルド
docker build -f apps/agents/Dockerfile -t langgraph-agents .

# ECRにログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

# ECRリポジトリを作成（初回のみ）
aws ecr create-repository --repository-name langgraph-agents --region ap-northeast-1

# イメージをタグ付け＆プッシュ
docker tag langgraph-agents:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/langgraph-agents:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/langgraph-agents:latest
```

#### 3. App Runnerでサービス作成

AWSコンソールまたはCLIで：
- ソース: ECR
- イメージ: `YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/langgraph-agents:latest`
- ポート: 2024
- 環境変数を設定

---

### その他のオプション

#### AWS ECS Fargate
- より柔軟な設定が必要な場合
- タスク定義とサービスを作成

#### GCP Compute Engine / AWS EC2
- 完全な制御が必要な場合
- VMインスタンスを作成し、Dockerで実行

---

## Webアプリのデプロイ（Vercel）

```bash
# Vercel CLIでデプロイ
cd apps/web
vercel deploy

# または、GitHub連携で自動デプロイ
# Vercelダッシュボードでプロジェクトをインポート
# Root Directory: apps/web
```

---

## デプロイ後の設定

### Webアプリの環境変数

Vercelの環境変数で設定：
- `NEXT_PUBLIC_API_URL`: Cloud Run/App RunnerのURL
- `NEXT_PUBLIC_ASSISTANT_ID`: `agent`（デフォルト）

### セキュリティ

- APIキーは環境変数で管理
- Cloud Run/App Runnerで認証を有効化（必要に応じて）
- CORS設定を確認

