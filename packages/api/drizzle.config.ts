import { defineConfig } from 'drizzle-kit';

// ローカル開発 or 本番環境の判定
const isLocal = !process.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL.includes('file:');

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  ...(isLocal
    ? {
        // ローカル開発: SQLiteファイルを使用
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL || 'file:./local.db',
        },
      }
    : {
        // 本番環境: Tursoを使用
        driver: 'turso',
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN!,
        },
      }),
  verbose: true,
  strict: true,
});
