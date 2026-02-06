import { Context, Next } from 'hono';
import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDKの初期化
 * Cloudflare Pagesの環境変数からサービスアカウント情報を取得
 */
function initializeFirebase(env: any) {
  if (!admin.apps.length) {
    try {
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.warn('Firebase initialization failed:', error);
      return null;
    }
  }
  return admin;
}

/**
 * Firebase認証Middleware
 * リクエストヘッダーからIDトークンを取得・検証
 * 開発環境ではスキップ可能（DEV_MODE=true）
 */
export async function authMiddleware(c: Context, next: Next) {
  // 開発モード: 認証をスキップ
  if (process.env.DEV_MODE === 'true') {
    c.set('user', {
      uid: 'dev-user',
      email: 'dev@example.com',
      emailVerified: true,
    });
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const firebase = initializeFirebase(c.env);
    if (!firebase) {
      return c.json({ error: 'Firebase not configured' }, 500);
    }

    const decodedToken = await firebase.auth().verifyIdToken(token);

    // ユーザー情報をコンテキストに保存
    c.set('user', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    });

    await next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
}

/**
 * 役割ベースのアクセス制御Middleware
 */
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // TODO: データベースからユーザーの役割を取得
    // 現時点ではプレースホルダー
    const userRole = 'staff'; // 本来はDBから取得

    if (!roles.includes(userRole)) {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }

    await next();
  };
}
