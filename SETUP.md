# 🚀 クイックスタートガイド (Windows)

## 前提条件
- ✅ Bun 1.3.8 インストール済み
- ✅ Git インストール済み

## セットアップ手順

### 1. 依存関係のインストール

```powershell
cd C:\マリンスポーツオフィス\Turso

# 全パッケージの依存関係をインストール
bun install
```

### 2. データベースのセットアップ

**ローカル開発モード（推奨）**
```powershell
cd packages/api

# マイグレーションファイル生成
bun run db:generate

# データベース作成 & マイグレーション実行
bun run db:migrate

# 初期データ投入
bun run db:seed

# Drizzle Studio起動（ブラウザでDBを確認）
bun run db:studio
```

### 3. Firebase設定（認証を使う場合）

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト作成
3. Authentication有効化（Email/Password + Google）
4. Webアプリ追加 → 設定値を取得
5. サービスアカウント → 秘密鍵を生成・ダウンロード

**packages/api/.dev.vars** を編集:
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

**packages/frontend/.env.local** を編集:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### 4. 開発サーバー起動

```powershell
# ルートディレクトリで
cd C:\マリンスポーツオフィス\Turso

# API + Frontend 同時起動
bun run dev
```

- API: http://localhost:8787
- Frontend: http://localhost:5173

### 5. 動作確認

1. ブラウザで http://localhost:5173 を開く
2. ログイン画面が表示される
3. API: http://localhost:8787/health で `{"status":"ok"}` を確認

## 📝 よく使うコマンド

```powershell
# 開発サーバー起動
bun run dev                    # API + Frontend 同時
bun run dev:api                # APIのみ
bun run dev:frontend           # Frontendのみ

# データベース
bun run db:generate            # スキーマからマイグレーション生成
bun run db:migrate             # マイグレーション実行
bun run db:seed                # 初期データ投入
bun run db:studio              # Drizzle Studio起動

# ビルド
bun run build                  # 全体ビルド
bun run type-check             # 型チェック

# デプロイ（本番環境）
bun run deploy                 # Cloudflare Pagesへデプロイ
```

## 🔧 トラブルシューティング

### `bun install` でエラーが出る
```powershell
# キャッシュクリア
bun pm cache rm

# 再インストール
bun install
```

### データベースエラー
```powershell
cd packages/api

# local.dbを削除して再作成
Remove-Item -Path local.db -ErrorAction SilentlyContinue
bun run db:migrate
bun run db:seed
```

### ポートが使用中
```powershell
# ポート8787を使用しているプロセスを確認
netstat -ano | findstr :8787

# プロセスを終了 (PIDは上記コマンドで確認)
Stop-Process -Id <PID> -Force
```

## 🌐 本番環境（Turso使用）

本番環境でTursoを使う場合は、WSL経由でTurso CLIをインストール:

```bash
# WSL (Ubuntu) で実行
curl -sSfL https://get.tur.so/install.sh | bash
turso db create inventory-management
turso db show inventory-management --url
turso db tokens create inventory-management
```

取得した値を `.dev.vars` に設定:
```env
TURSO_DATABASE_URL=libsql://...turso.io
TURSO_AUTH_TOKEN=eyJ...
```

## 📚 参考リンク

- [Bun](https://bun.sh/)
- [Hono](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Turso](https://turso.tech/)
- [Firebase](https://firebase.google.com/)
