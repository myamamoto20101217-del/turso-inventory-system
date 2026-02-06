import { Hono } from 'hono';
import { createDbClient } from '../db/client';
import { menus, categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// メニュー一覧取得
app.get('/', async (c) => {
  const db = createDbClient(c.env);

  const menuList = await db
    .select({
      id: menus.id,
      name: menus.name,
      categoryId: menus.categoryId,
      categoryName: categories.name,
      price: menus.price,
      description: menus.description,
      isActive: menus.isActive,
    })
    .from(menus)
    .leftJoin(categories, eq(menus.categoryId, categories.id))
    .orderBy(categories.displayOrder, menus.name);

  return c.json({ success: true, data: menuList });
});

export default app;
