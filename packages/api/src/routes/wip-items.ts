import { Hono } from 'hono';
import { createDbClient } from '../db/client';
import { wipItems, categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// 仕掛品一覧取得
app.get('/', async (c) => {
  const db = createDbClient(c.env);

  const wipItemList = await db
    .select({
      id: wipItems.id,
      name: wipItems.name,
      categoryId: wipItems.categoryId,
      categoryName: categories.name,
      unit: wipItems.unit,
      createdAt: wipItems.createdAt,
    })
    .from(wipItems)
    .leftJoin(categories, eq(wipItems.categoryId, categories.id))
    .orderBy(wipItems.name);

  return c.json({ success: true, data: wipItemList });
});

export default app;
