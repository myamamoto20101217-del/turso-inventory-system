import { Hono } from 'hono';
import { createDbClient } from '../db/client';
import { purchases, stores, products } from '../db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// 仕入れデータ一覧取得
app.get('/', async (c) => {
  const { startDate, endDate, storeId } = c.req.query();
  const db = createDbClient(c.env);

  const conditions = [];
  if (startDate) conditions.push(gte(purchases.purchaseDate, new Date(startDate)));
  if (endDate) conditions.push(lte(purchases.purchaseDate, new Date(endDate)));
  if (storeId) conditions.push(eq(purchases.storeId, storeId));

  const purchaseList = await db
    .select({
      id: purchases.id,
      storeId: purchases.storeId,
      storeName: stores.name,
      productId: purchases.productId,
      productName: products.name,
      quantity: purchases.quantity,
      unitPrice: purchases.unitPrice,
      totalAmount: purchases.totalAmount,
      purchaseDate: purchases.purchaseDate,
      supplierId: purchases.supplierId,
    })
    .from(purchases)
    .leftJoin(stores, eq(purchases.storeId, stores.id))
    .leftJoin(products, eq(purchases.productId, products.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(purchases.purchaseDate));

  return c.json({ success: true, data: purchaseList });
});

// 仕入れサマリー
app.get('/summary', async (c) => {
  const { startDate, endDate } = c.req.query();
  const db = createDbClient(c.env);

  const conditions = [];
  if (startDate) conditions.push(gte(purchases.purchaseDate, new Date(startDate)));
  if (endDate) conditions.push(lte(purchases.purchaseDate, new Date(endDate)));

  const result = await db
    .select({
      totalAmount: purchases.totalAmount,
    })
    .from(purchases)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const totalAmount = result.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
  const purchaseCount = result.length;

  return c.json({
    success: true,
    data: {
      totalAmount,
      purchaseCount,
      averagePurchase: purchaseCount > 0 ? totalAmount / purchaseCount : 0,
    },
  });
});

export default app;
