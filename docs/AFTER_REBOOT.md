# 🔄 PC再起動後のセットアップ手順

## ✅ 完了した作業
- ✅ WSL (Windows Subsystem for Linux) のインストール
- ✅ Ubuntu ディストリビューションのインストール
- ✅ 環境変数テンプレートの準備

---

## 📋 再起動後のチェックリスト

### 1. WSLの起動確認

PowerShellで実行：

```powershell
wsl --status
```

正常に表示されればOK。

### 2. Ubuntuの初期設定

初回起動時にユーザー名とパスワードを設定します：

```powershell
wsl
```

プロンプトに従って：
- **ユーザー名**: 任意（例: `admin`, `dev`）
- **パスワード**: 任意（忘れずにメモ！sudo時に必要）

### 3. Turso CLIのインストール

WSL内で実行：

```bash
# Turso CLI インストール
curl -sSfL https://get.tur.so/install.sh | bash

# シェル再起動
exit
wsl

# バージョン確認
turso --version
```

### 4. Tursoにログイン

```bash
turso auth login
```

ブラウザが開くので、GitHubアカウントで認証。

### 5. データベースの作成

```bash
# 開発用データベース
turso db create inventory-dev --location nrt

# 本番用データベース
turso db create inventory-prod --location nrt

# URL取得
turso db show inventory-dev --url
turso db show inventory-prod --url

# トークン生成
turso db tokens create inventory-dev
turso db tokens create inventory-prod
```

### 6. 環境変数ファイルの作成

PowerShellで実行：

```powershell
# WSLから抜ける
exit

# プロジェクトディレクトリに移動
cd C:\マリンスポーツオフィス\Turso

# API用環境変数ファイル作成
Copy-Item .env.example packages\api\.dev.vars

# Frontend用環境変数ファイル作成
Copy-Item .env.example packages\frontend\.env.local
```

### 7. 環境変数の編集

VS Codeで以下を編集：

#### `packages/api/.dev.vars`
```env
TURSO_DATABASE_URL=libsql://inventory-dev-<取得したURL>
TURSO_AUTH_TOKEN=<取得したトークン>
FIREBASE_SERVICE_ACCOUNT=<FirebaseでダウンロードしたJSON>
```

#### `packages/frontend/.env.local`
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=<FirebaseのAPI Key>
VITE_FIREBASE_AUTH_DOMAIN=<プロジェクトID>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<プロジェクトID>
VITE_FIREBASE_STORAGE_BUCKET=<プロジェクトID>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<Sender ID>
VITE_FIREBASE_APP_ID=<App ID>
```

### 8. データベースのマイグレーション

```powershell
# WSL内のTurso URLを環境変数にセット
# (まずは .dev.vars を編集してから)

bun run db:migrate
```

### 9. 開発サーバーの起動

```powershell
bun run dev
```

---

## 🔍 トラブルシューティング

### WSLが起動しない
```powershell
# WSLを再インストール
wsl --unregister Ubuntu
wsl --install -d Ubuntu
```

### Turso CLIがインストールできない
```bash
# パッケージマネージャーを更新
sudo apt update
sudo apt upgrade -y

# 再度インストール
curl -sSfL https://get.tur.so/install.sh | bash
```

### 環境変数が読み込まれない
- ファイル名を確認: `.dev.vars`, `.env.local`
- 文字エンコーディング: UTF-8
- 改行コード: LF (Unix形式)

---

## 📚 参考ドキュメント

- [TURSO_SETUP.md](./TURSO_SETUP.md) - Turso詳細セットアップ
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase詳細セットアップ
- [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) - Cloudflare詳細セットアップ
- [COMPLETE_SETUP.md](./COMPLETE_SETUP.md) - 完全セットアップガイド

---

**再起動後、この手順に従ってセットアップを完了してください！🚀**
