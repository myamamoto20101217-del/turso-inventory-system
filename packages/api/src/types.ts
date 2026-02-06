// Cloudflare Pages環境変数の型定義
export type Bindings = {
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  FIREBASE_SERVICE_ACCOUNT?: string;
  DEV_MODE?: string;
};

// 認証ユーザー情報の型
export type Variables = {
  user: {
    uid: string;
    email: string | undefined;
    emailVerified: boolean;
  };
};
