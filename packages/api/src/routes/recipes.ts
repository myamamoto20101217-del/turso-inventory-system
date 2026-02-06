import { Hono } from 'hono';
import { createDbClient } from '../db/client';
import { recipes, menus, products, wipItems } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// レシピ一覧取得
app.get('/', async (c) => {
  const db = createDbClient(c.env);

  const recipeList = await db
    .select({
      id: recipes.id,
      menuId: recipes.menuId,
      menuName: menus.name,
      productId: recipes.productId,
      productName: products.name,
      wipItemId: recipes.usedWipItemId,
      wipItemName: wipItems.name,
      quantity: recipes.quantity,
      unit: recipes.unit,
    })
    .from(recipes)
    .leftJoin(menus, eq(recipes.menuId, menus.id))
    .leftJoin(products, eq(recipes.productId, products.id))
    .leftJoin(wipItems, eq(recipes.usedWipItemId, wipItems.id))
    .orderBy(menus.name);

  return c.json({ success: true, data: recipeList });
});

// メニュー別レシピ取得
app.get('/menu/:menuId', async (c) => {
  const menuId = c.req.param('menuId');
  const db = createDbClient(c.env);

  const recipeList = await db
    .select({
      id: recipes.id,
      productId: recipes.productId,
      productName: products.name,
      wipItemId: recipes.usedWipItemId,
      wipItemName: wipItems.name,
      quantity: recipes.quantity,
      unit: recipes.unit,
    })
    .from(recipes)
    .leftJoin(products, eq(recipes.productId, products.id))
    .leftJoin(wipItems, eq(recipes.usedWipItemId, wipItems.id))
    .where(eq(recipes.menuId, menuId));

  return c.json({ success: true, data: recipeList });
});

export default app;
