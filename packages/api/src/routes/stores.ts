import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Bindings, Variables } from '../types';
import { createDbClient } from '../db/client';
import { stores } from '../db/schema';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 店舗一覧取得
app.get('/', async (c) => {
  const db = createDbClient(c.env);

  const storeList = await db
    .select({
      id: stores.id,
      name: stores.name,
      type: stores.type,
      address: stores.address,
      phone: stores.phone,
      isActive: stores.isActive,
    })
    .from(stores)
    .where(eq(stores.isActive, true))
    .orderBy(stores.id);

  return c.json(storeList);
});

export default app;
