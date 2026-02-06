import { Hono } from 'hono';
import { ulid } from 'ulid';
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

// レシピ作成
app.post('/', async (c) => {
  const db = createDbClient(c.env);
  const { menuId, ingredients } = await c.req.json<{
    menuId: string;
    ingredients: Array<{
      productId: string;
      quantity: number;
      unit: string;
    }>;
  }>();

  // 各材料をレシピに追加
  for (const ingredient of ingredients) {
    await db.insert(recipes).values({
      id: ulid(),
      menuId,
      productId: ingredient.productId,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    });
  }

  return c.json({ success: true, message: 'レシピを作成しました' });
});

// 仕掛品レシピ作成
app.post('/wip', async (c) => {
  const db = createDbClient(c.env);
  const { wipItemId, ingredients } = await c.req.json<{
    wipItemId: string;
    ingredients: Array<{
      productId?: string;
      usedWipItemId?: string;
      quantity: number;
      unit: string;
    }>;
  }>();

  // 各材料を仕掛品レシピに追加
  for (const ingredient of ingredients) {
    await db.insert(recipes).values({
      id: ulid(),
      wipItemId,
      productId: ingredient.productId || null,
      usedWipItemId: ingredient.usedWipItemId || null,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    });
  }

  return c.json({ success: true, message: '仕掛品レシピを作成しました' });
});

// レシピ削除
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDbClient(c.env);

  await db.delete(recipes).where(eq(recipes.id, id));

  return c.json({ success: true, message: 'レシピを削除しました' });
});

export default app;
