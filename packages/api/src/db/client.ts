import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

/**
 * データベースクライアントの作成
 * ローカル開発: file:./local.db
 * 本番環境: Turso (libsql://...)
 */
export function createDbClient(env?: { TURSO_DATABASE_URL?: string; TURSO_AUTH_TOKEN?: string }) {
  const url = env?.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || 'file:./local.db';

  const client = createClient({
    url,
    authToken: env?.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
  });

  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
