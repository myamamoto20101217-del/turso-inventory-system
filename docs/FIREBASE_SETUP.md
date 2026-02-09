# Firebase Authentication Setup Guide

## 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `inventory-management`）
4. Google Analyticsは任意（推奨: 有効）
5. プロジェクトを作成

## 2. Authenticationの有効化

1. Firebase Console → 左メニュー「Authentication」
2. 「始める」をクリック
3. ログイン方法を設定

### 推奨ログイン方法

#### メール/パスワード
1. 「Sign-in method」タブ
2. 「メール/パスワード」を選択
3. 「有効にする」をオンにして保存

#### Google認証（推奨）
1. 「Sign-in method」タブ
2. 「Google」を選択
3. 「有効にする」をオンにして保存
4. プロジェクトのサポートメールを設定

## 3. Webアプリの登録

1. Firebase Console → プロジェクト設定（歯車アイコン）
2. 「全般」タブ → 「マイアプリ」
3. 「Web」アイコン（</>）をクリック
4. アプリのニックネームを入力（例: `Inventory Web App`）
5. Firebase Hostingは任意（Cloudflare Pagesを使用するため不要）
6. 「アプリを登録」をクリック

## 4. 設定情報の取得

登録完了後、以下の情報が表示されます：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "inventory-management.firebaseapp.com",
  projectId: "inventory-management",
  storageBucket: "inventory-management.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 5. 環境変数の設定

### フロントエンド（packages/frontend/.env.local）

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=inventory-management.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=inventory-management
VITE_FIREBASE_STORAGE_BUCKET=inventory-management.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### GitHub Secrets

GitHubリポジトリ Settings → Secrets and variables → Actions に追加：

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

### Cloudflare Pages

フロントエンドプロジェクト Settings → Environment variables に同様の変数を追加

## 6. Service Accountの作成（API用）

API側でトークン検証を行うために必要です。

1. Firebase Console → プロジェクト設定 → サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. JSONファイルがダウンロードされます

### JSONをBase64エンコード

#### Windows (PowerShell)
```powershell
$content = Get-Content -Path "path/to/serviceAccountKey.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
[Convert]::ToBase64String($bytes)
```

#### macOS / Linux
```bash
base64 -i serviceAccountKey.json
```

### 環境変数に設定

#### ローカル開発（packages/api/.dev.vars）
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"inventory-management",...}
```

#### GitHub Secrets
```
FIREBASE_SERVICE_ACCOUNT_BASE64=[base64エンコードされた文字列]
```

#### Cloudflare Pages（APIプロジェクト）
```
FIREBASE_SERVICE_ACCOUNT=[JSONファイルの内容をそのまま]
```

## 7. 認証フローの実装

既に実装済みですが、確認ポイント：

### フロントエンド
- `packages/frontend/src/config/firebase.ts`: Firebase初期化
- `packages/frontend/src/components/Login.tsx`: ログイン画面
- `packages/frontend/src/App.tsx`: 認証状態管理

### API
- `packages/api/src/middleware/auth.ts`: トークン検証（本番環境のみ）

## 8. 認証ドメインの設定

### 承認済みドメインの追加

1. Firebase Console → Authentication → Settings
2. 「Authorized domains」セクション
3. 「ドメインを追加」をクリック
4. 以下を追加：
   - `localhost`（既に追加済み）
   - `127.0.0.1`（既に追加済み）
   - `inventory-frontend.pages.dev`（Cloudflare Pages）
   - カスタムドメイン（使用する場合）

## 9. セキュリティ設定

### IDトークンの有効期限

Firebase IDトークンのデフォルト有効期限は1時間です。

### リフレッシュトークンの設定

既存の実装では自動的にリフレッシュされます。

### メール認証の有効化（オプション）

1. Authentication → Settings
2. 「User actions」セクション
3. 「Email enumeration protection」を有効化（推奨）

## 10. テストユーザーの作成

### コンソールから手動作成

1. Firebase Console → Authentication → Users
2. 「ユーザーを追加」をクリック
3. メールアドレスとパスワードを入力

### プログラムで作成（開発環境）

```bash
# APIサーバーを起動した状態で
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 11. トラブルシューティング

### 「auth/configuration-not-found」エラー
- Firebase Console でプロジェクト設定を確認
- 環境変数が正しく設定されているか確認

### 「auth/unauthorized-domain」エラー
- 承認済みドメインにホスト名を追加

### トークン検証エラー
- Service Accountの設定を確認
- トークンの有効期限を確認

### CORSエラー
- API側のCORS設定でフロントエンドのドメインを許可

## 12. セキュリティベストプラクティス

1. **環境変数の管理**
   - `.dev.vars`や`.env.local`を`.gitignore`に追加済み
   - 本番環境の認証情報は絶対にコミットしない

2. **Service Accountの保護**
   - JSONファイルは安全に保管
   - 定期的にローテーション

3. **パスワードポリシー**
   - 最小8文字以上を推奨
   - 大文字、小文字、数字、記号の組み合わせ

4. **多要素認証（MFA）**
   - 本番環境では有効化を検討

## 参考リンク

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [IDトークンの検証](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
