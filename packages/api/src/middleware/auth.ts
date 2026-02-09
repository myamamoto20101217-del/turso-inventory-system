import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Context, Next } from 'hono';

// Firebase Auth公開鍵のURL
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

// Firebase Project ID
const FIREBASE_PROJECT_ID = 'inventory-management-85426';

// JWKSの取得（キャッシュされる）
const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

/**
 * Firebase Auth IDトークン検証ミドルウェア
 *
 * Authorization: Bearer <token> ヘッダーからトークンを取得し、
 * Firebaseの公開鍵で署名を検証します。
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  const token = authHeader.substring(7); // "Bearer " を除去

  try {
    // トークンを検証
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    // ユーザー情報をコンテキストに設定
    c.set('user', {
      uid: payload.sub as string,
      email: payload.email as string | undefined,
      emailVerified: payload.email_verified as boolean,
    });

    await next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
}

/**
 * オプショナル認証ミドルウェア
 *
 * トークンがある場合は検証し、ない場合はスキップします。
 * 公開エンドポイントで使用可能です。
 */
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // トークンがない場合はスキップ
    await next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    c.set('user', {
      uid: payload.sub as string,
      email: payload.email as string | undefined,
      emailVerified: payload.email_verified as boolean,
    });
  } catch (error) {
    // トークンが無効でもエラーにしない
    console.warn('Optional auth: Invalid token provided');
  }

  await next();
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
