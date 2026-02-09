# Turso Setup Guide

## 1. Turso CLIのインストール

### Windows

**🔴 重要**: Turso CLIのWindows版は**WSL（Windows Subsystem for Linux）経由でのみ**インストール可能です。

#### ステップ1: WSLのインストール

PowerShell（管理者権限）で実行：

```powershell
wsl --install
```

再起動後、Ubuntuが自動的にセットアップされます。

#### ステップ2: WSL内でTurso CLIをインストール

PowerShellで実行：

```powershell
wsl
```

WSL内で実行：

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

シェルを再起動：

```bash
exit
wsl
```

#### ステップ3: 動作確認

```bash
turso --version
```

### macOS

```bash
# Homebrew（推奨）
brew install tursodatabase/tap/turso

# または直接インストール
curl -sSfL https://get.tur.so/install.sh | bash
```

### Linux

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

## 2. Tursoにログイン

```bash
turso auth login
```

ブラウザが開くので、GitHubアカウントで認証してください。

## 3. データベースの作成

### 開発用データベース
```bash
turso db create inventory-dev --location nrt
```

### 本番用データベース
```bash
turso db create inventory-prod --location nrt
```

## 4. データベースURLとトークンの取得

### 開発環境
```bash
# データベースURL
turso db show inventory-dev --url

# 認証トークン
turso db tokens create inventory-dev
```

### 本番環境
```bash
# データベースURL
turso db show inventory-prod --url

# 認証トークン
turso db tokens create inventory-prod
```

## 5. 環境変数の設定

取得した値を以下のファイルに設定します：

### `packages/api/.dev.vars`（開発環境）
```env
TURSO_DATABASE_URL=libsql://inventory-dev-[your-org].turso.io
TURSO_AUTH_TOKEN=eyJhbGc...（生成されたトークン）
DEV_MODE=true
```

### GitHub Secrets（本番環境）
以下のシークレットを設定：
- `TURSO_DATABASE_URL`: 本番データベースのURL
- `TURSO_AUTH_TOKEN`: 本番データベースのトークン

## 6. スキーマのマイグレーション

### マイグレーションファイルの生成
```bash
bun run db:generate
```

### 開発環境へのマイグレーション実行
```bash
bun run db:migrate
```

### 本番環境へのマイグレーション実行
```bash
# Turso CLIを使用
turso db shell inventory-prod < drizzle/migrations/0000_initial_setup.sql
```

## 7. シードデータの投入（オプション）

```bash
bun run db:seed
```

## 8. Turso Studioでデータベース確認

```bash
bun run db:studio
```

ブラウザで https://local.turso.tech が開きます。

## トラブルシューティング

### データベースに接続できない
```bash
# データベースの状態確認
turso db show inventory-dev

# データベース一覧確認
turso db list
```

### トークンが無効
```bash
# 新しいトークンを生成
turso db tokens create inventory-dev

# .dev.varsファイルを更新
```

### マイグレーションエラー
```bash
# マイグレーション履歴確認
turso db shell inventory-dev
SELECT * FROM __drizzle_migrations;
```

## 参考リンク

- [Turso Documentation](https://docs.turso.tech/)
- [Turso CLI Reference](https://docs.turso.tech/cli)
- [Drizzle ORM with Turso](https://orm.drizzle.team/docs/get-started-sqlite#turso)
