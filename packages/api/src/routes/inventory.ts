import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { createDbClient } from '../db/client';
import { inventory, products, stores, categories } from '../db/schema';
import { authMiddleware } from '../middleware/auth';

type Variables = {
  user: {
    uid: string;
    email: string | undefined;
    emailVerified: boolean;
  };
};

const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>();

/**
 * 在庫一覧取得（材料ごとに集計）
 * GET /api/inventory?storeId=S001
 */
app.get('/', authMiddleware, async (c) => {
  const filterStoreId = c.req.query('storeId');
  const db = createDbClient(c.env);

  try {
    // すべての在庫データを取得
    const inventoryList = await db
      .select({
        id: inventory.id,
        storeId: inventory.storeId,
        storeName: stores.name,
        productId: inventory.productId,
        productName: products.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        quantity: inventory.quantity,
        unit: products.unit,
        minStock: products.minStock,
        isLowStock: sql<boolean>`${inventory.quantity} < ${products.minStock}`,
        updatedAt: inventory.updatedAt,
      })
      .from(inventory)
      .leftJoin(products, eq(inventory.productId, products.id))
      .leftJoin(stores, eq(inventory.storeId, stores.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(products.name);

    // 材料ごとにグループ化
    const groupedByProduct = inventoryList.reduce(
      (acc, item) => {
        if (!item.productId || !item.productName) return acc;

        if (!acc[item.productId]) {
          acc[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            categoryName: item.categoryName,
            unit: item.unit,
            minStock: item.minStock,
            totalQuantity: 0,
            isLowStock: false,
            stores: [],
          };
        }

        acc[item.productId].stores.push({
          id: item.id,
          storeId: item.storeId,
          storeName: item.storeName,
          quantity: item.quantity,
          isLowStock: item.isLowStock,
          updatedAt: item.updatedAt,
        });

        acc[item.productId].totalQuantity += item.quantity;
        if (item.isLowStock) {
          acc[item.productId].isLowStock = true;
        }

        return acc;
      },
      {} as Record<string, any>
    );

    // オブジェクトを配列に変換
    let result = Object.values(groupedByProduct);

    // 店舗フィルターを適用
    if (filterStoreId) {
      result = result
        .map((product: any) => ({
          ...product,
          stores: product.stores.filter((store: any) => store.storeId === filterStoreId),
          totalQuantity: product.stores
            .filter((store: any) => store.storeId === filterStoreId)
            .reduce((sum: number, store: any) => sum + store.quantity, 0),
        }))
        .filter((product: any) => product.stores.length > 0);
    }

    return c.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return c.json({ error: 'Failed to fetch inventory' }, 500);
  }
});

/**
 * 在庫詳細取得
 * GET /api/inventory/:id
 */
app.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const db = createDbClient(c.env);

  try {
    const result = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1);

    if (result.length === 0) {
      return c.json({ error: 'Inventory not found' }, 404);
    }

    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return c.json({ error: 'Failed to fetch inventory' }, 500);
  }
});

/**
 * 在庫更新
 * PUT /api/inventory/:id
 */
app.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { quantity } = await c.req.json();
  const user = c.get('user');
  const db = createDbClient(c.env);

  try {
    const result = await db
      .update(inventory)
      .set({
        quantity,
        lastUpdatedBy: user.uid,
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, id))
      .returning();

    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Failed to update inventory:', error);
    return c.json({ error: 'Failed to update inventory' }, 500);
  }
});

/**
 * 在庫アラート一覧
 * GET /api/inventory/alerts
 */
app.get('/alerts/list', authMiddleware, async (c) => {
  const db = createDbClient(c.env);

  try {
    // 最小在庫を下回っている商品を取得
    const alerts = await db
      .select({
        productId: products.id,
        productName: products.name,
        storeId: inventory.storeId,
        storeName: stores.name,
        currentStock: inventory.quantity,
        minStock: products.minStock,
        shortage: sql<number>`${products.minStock} - ${inventory.quantity}`,
        unit: products.unit,
      })
      .from(inventory)
      .leftJoin(products, eq(inventory.productId, products.id))
      .leftJoin(stores, eq(inventory.storeId, stores.id))
      .where(sql`${inventory.quantity} < ${products.minStock}`)
      .orderBy(sql`${products.minStock} - ${inventory.quantity} DESC`);

    return c.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return c.json({ error: 'Failed to fetch alerts' }, 500);
  }
});

export default app;
