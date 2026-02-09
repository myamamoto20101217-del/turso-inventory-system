# Cloudflare Pages Setup Guide

## 1. Cloudflare Pagesの概要

Cloudflare Pagesは、フロントエンドとサーバーレスアプリケーションをデプロイできるプラットフォームです。

### 主な特徴
- 無料プランで月間500ビルド
- 自動CI/CD
- プレビューデプロイメント
- カスタムドメイン対応
- DDoS保護

## 2. プロジェクトの作成

### APIプロジェクト（inventory-api）

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にアクセス
2. 「Workers & Pages」→「Create application」
3. 「Pages」→「Connect to Git」
4. GitHubリポジトリを選択
5. ビルド設定：
   ```
   Framework preset: None
   Build command: bun install && bun --filter api build
   Build output directory: packages/api/dist
   Root directory: /
   ```

### フロントエンドプロジェクト（inventory-frontend）

1. 同様に新しいプロジェクトを作成
2. ビルド設定：
   ```
   Framework preset: Vite
   Build command: bun install && bun --filter frontend build
   Build output directory: packages/frontend/dist
   Root directory: /
   ```

## 3. 環境変数の設定

### APIプロジェクト
Settings → Environment variables

**Production環境:**
- `TURSO_DATABASE_URL`: Turso本番データベースURL
- `TURSO_AUTH_TOKEN`: Turso本番認証トークン
- `FIREBASE_SERVICE_ACCOUNT`: Firebase Service Accountの JSON（base64エンコード）

### フロントエンドプロジェクト
Settings → Environment variables

**Production環境:**
- `VITE_API_BASE_URL`: `https://inventory-api.pages.dev`
- `VITE_FIREBASE_API_KEY`: Firebase API Key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase Storage Bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID`: Firebase App ID

## 4. カスタムドメインの設定（オプション）

1. プロジェクト → Settings → Custom domains
2. 「Add custom domain」をクリック
3. ドメインを入力（例: `api.yourdomain.com`）
4. DNSレコードを設定

### DNS設定例
```
Type: CNAME
Name: api
Content: inventory-api.pages.dev
Proxy status: Proxied
```

## 5. GitHub Secrets の設定

GitHubリポジトリのSettings → Secrets and variables → Actions

### 必要なシークレット

1. **CLOUDFLARE_API_TOKEN**
   - Cloudflare Dashboard → My Profile → API Tokens
   - 「Create Token」→「Edit Cloudflare Workers」テンプレート
   - Account Resources: Include → 自分のアカウント
   - Zone Resources: All zones

2. **CLOUDFLARE_ACCOUNT_ID**
   - Cloudflare Dashboard → Workers & Pages
   - 右サイドバーに表示されているAccount ID

3. **TURSO_DATABASE_URL** (本番)
   ```bash
   turso db show inventory-prod --url
   ```

4. **TURSO_AUTH_TOKEN** (本番)
   ```bash
   turso db tokens create inventory-prod
   ```

5. **Firebase関連** (次セクション参照)

## 6. デプロイ

### 自動デプロイ
- `master`/`main`ブランチにpushすると自動デプロイ
- Pull Requestを作成するとプレビューデプロイ

### 手動デプロイ（Wrangler CLI使用）

#### Wranglerのインストール
```bash
bun add -g wrangler
```

#### ログイン
```bash
wrangler login
```

#### デプロイ
```bash
# API
cd packages/api
bun run build
wrangler pages deploy dist --project-name=inventory-api

# Frontend
cd packages/frontend
bun run build
wrangler pages deploy dist --project-name=inventory-frontend
```

## 7. デプロイ状況の確認

- Cloudflare Dashboard → Workers & Pages
- プロジェクトを選択 → Deployments
- ログやステータスを確認

## 8. ロールバック

1. Cloudflare Dashboard → プロジェクト → Deployments
2. 以前のデプロイメントを選択
3. 「Rollback to this deployment」をクリック

## トラブルシューティング

### ビルドエラー
```bash
# ローカルで再現
bun install
bun run build

# ログ確認
Cloudflare Dashboard → プロジェクト → Deployments → 失敗したデプロイ
```

### 環境変数が反映されない
- 環境変数を変更した後は再デプロイが必要
- Production/Preview環境を正しく設定しているか確認

### CORSエラー
- API側でCORS設定を確認
- フロントエンドのAPI URLが正しいか確認

## 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Pages Deployment](https://developers.cloudflare.com/pages/get-started/)
