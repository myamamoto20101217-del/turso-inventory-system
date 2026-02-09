# 完全セットアップガイド

このガイドでは、在庫管理システムの開発環境から本番環境までの完全なセットアップ手順を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [開発環境のセットアップ](#開発環境のセットアップ)
3. [Tursoのセットアップ](#tursoのセットアップ)
4. [Firebaseのセットアップ](#firebaseのセットアップ)
5. [Cloudflare Pagesのセットアップ](#cloudflare-pagesのセットアップ)
6. [CI/CDの設定](#cicdの設定)
7. [デプロイ](#デプロイ)

---

## 前提条件

以下のツールをインストールしてください：

- **Bun**: JavaScript/TypeScriptランタイム
  ```powershell
  # Windows
  powershell -c "irm bun.sh/install.ps1|iex"
  
  # macOS/Linux
  curl -fsSL https://bun.sh/install | bash
  ```

- **Git**: バージョン管理
  ```bash
  git --version
  ```

- **Turso CLI**: データベース管理
  ```powershell
  # Windows
  irm get.turso.tech/install.ps1 | iex
  
  # macOS/Linux
  curl -sSfL https://get.tur.so/install.sh | bash
  ```

- **Wrangler CLI**: Cloudflareデプロイツール（オプション）
  ```bash
  bun add -g wrangler
  ```

---

## 開発環境のセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/myamamoto20101217-del/turso-inventory-system.git
cd turso-inventory-system
```

### 2. 依存関係のインストール

```bash
bun install
```

### 3. 環境変数ファイルの作成

#### `packages/api/.dev.vars`

```env
# Turso Database
TURSO_DATABASE_URL=libsql://inventory-dev-[your-org].turso.io
TURSO_AUTH_TOKEN=eyJhbGc...

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Development Mode
DEV_MODE=true
```

#### `packages/frontend/.env.local`

```env
# API
VITE_API_BASE_URL=http://localhost:3000

# Firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=inventory-management.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=inventory-management
VITE_FIREBASE_STORAGE_BUCKET=inventory-management.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 4. データベースのマイグレーション

```bash
# マイグレーションファイルの生成
bun run db:generate

# マイグレーション実行
bun run db:migrate

# シードデータ投入（オプション）
bun run db:seed
```

### 5. 開発サーバーの起動

```bash
# 両方のサーバーを起動
bun run dev

# または個別に起動
bun run dev:api      # APIサーバー (http://localhost:3000)
bun run dev:frontend # フロントエンド (http://localhost:5173)
```

---

## Tursoのセットアップ

詳細は [TURSO_SETUP.md](./TURSO_SETUP.md) を参照してください。

### クイックスタート

```bash
# 1. Tursoにログイン
turso auth login

# 2. 開発用データベース作成
turso db create inventory-dev --location nrt

# 3. 本番用データベース作成
turso db create inventory-prod --location nrt

# 4. データベースURLとトークン取得
turso db show inventory-dev --url
turso db tokens create inventory-dev

turso db show inventory-prod --url
turso db tokens create inventory-prod
```

---

## Firebaseのセットアップ

詳細は [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) を参照してください。

### クイックスタート

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクト作成
2. Authentication を有効化（メール/パスワード、Google認証）
3. Webアプリを登録して設定情報を取得
4. Service Accountの秘密鍵をダウンロード
5. 承認済みドメインに `localhost` と本番ドメインを追加

---

## Cloudflare Pagesのセットアップ

詳細は [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) を参照してください。

### クイックスタート

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. Workers & Pages → Create application
3. 2つのプロジェクトを作成：
   - **inventory-api**: APIバックエンド
   - **inventory-frontend**: フロントエンド
4. 各プロジェクトの環境変数を設定

---

## CI/CDの設定

### GitHub Secretsの設定

GitHubリポジトリ Settings → Secrets and variables → Actions で以下を追加：

#### Cloudflare関連
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

#### Turso関連
- `TURSO_DATABASE_URL` (本番)
- `TURSO_AUTH_TOKEN` (本番)

#### Firebase関連
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`

### ワークフローの確認

- `.github/workflows/ci.yml`: CI（lint, test, build）
- `.github/workflows/deploy.yml`: CD（本番デプロイ）

---

## デプロイ

### 自動デプロイ

`master`または`main`ブランチにプッシュすると自動的にデプロイされます：

```bash
git add .
git commit -m "feat: 新機能の追加"
git push origin main
```

### 手動デプロイ

```bash
# ビルド
bun run build

# Wrangler CLIでデプロイ
cd packages/api
wrangler pages deploy dist --project-name=inventory-api

cd ../frontend
wrangler pages deploy dist --project-name=inventory-frontend
```

---

## トラブルシューティング

### データベース接続エラー

```bash
# Tursoの状態確認
turso db show inventory-dev

# 新しいトークン生成
turso db tokens create inventory-dev
```

### ビルドエラー

```bash
# 依存関係の再インストール
rm -rf node_modules bun.lock
bun install

# キャッシュのクリア
rm -rf packages/*/dist
bun run build
```

### 認証エラー

- Firebase Consoleで承認済みドメインを確認
- 環境変数が正しく設定されているか確認
- Service Accountの設定を確認

---

## 開発ワークフロー

### ブランチ戦略

```
main/master     ← 本番環境（自動デプロイ）
  ↑
develop         ← 開発環境
  ↑
feature/*       ← 機能開発ブランチ
```

### Pull Request作成

```bash
# 機能ブランチ作成
git checkout -b feature/new-feature

# 変更をコミット
git add .
git commit -m "feat: 新機能の説明"

# プッシュ
git push origin feature/new-feature

# GitHubでPR作成
gh pr create --title "feat: 新機能" --body "詳細な説明"
```

### コードレビュー後のマージ

```bash
# PRをマージ
gh pr merge --squash --delete-branch
```

---

## 便利なコマンド

### 開発
```bash
bun run dev              # 開発サーバー起動
bun run build            # ビルド
bun run type-check       # 型チェック
bun run lint             # Lint実行
bun run lint:fix         # Lint自動修正
bun run format           # コードフォーマット
```

### データベース
```bash
bun run db:generate      # マイグレーション生成
bun run db:migrate       # マイグレーション実行
bun run db:studio        # Turso Studio起動
bun run db:seed          # シードデータ投入
```

### デプロイ
```bash
bun run deploy           # 手動デプロイ
```

---

## 参考リンク

- [Turso Documentation](https://docs.turso.tech/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Bun Documentation](https://bun.sh/docs)
- [Hono Framework](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [React Documentation](https://react.dev/)

---

## サポート

問題が発生した場合：

1. このドキュメントのトラブルシューティングセクションを確認
2. 各サービスの詳細ドキュメントを参照
3. GitHubでIssueを作成

---

**Happy Coding! 🚀**
