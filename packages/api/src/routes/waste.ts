import { Hono } from 'hono';
import { createDbClient } from '../db/client';
import { waste, stores, products } from '../db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// 廃棄データ一覧取得
app.get('/', async (c) => {
  const { startDate, endDate, storeId } = c.req.query();
  const db = createDbClient(c.env);

  const conditions = [];
  if (startDate) conditions.push(gte(waste.wasteDate, new Date(startDate)));
  if (endDate) conditions.push(lte(waste.wasteDate, new Date(endDate)));
  if (storeId) conditions.push(eq(waste.storeId, storeId));

  const wasteList = await db
    .select({
      id: waste.id,
      storeId: waste.storeId,
      storeName: stores.name,
      productId: waste.productId,
      productName: products.name,
      quantity: waste.quantity,
      reason: waste.reason,
      wasteDate: waste.wasteDate,
      recordedBy: waste.recordedBy,
    })
    .from(waste)
    .leftJoin(stores, eq(waste.storeId, stores.id))
    .leftJoin(products, eq(waste.productId, products.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(waste.wasteDate));

  return c.json({ success: true, data: wasteList });
});

// 廃棄サマリー
app.get('/summary', async (c) => {
  const { startDate, endDate } = c.req.query();
  const db = createDbClient(c.env);

  const conditions = [];
  if (startDate) conditions.push(gte(waste.wasteDate, new Date(startDate)));
  if (endDate) conditions.push(lte(waste.wasteDate, new Date(endDate)));

  const result = await db
    .select({
      quantity: waste.quantity,
      reason: waste.reason,
    })
    .from(waste)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const totalQuantity = result.reduce((sum, row) => sum + (row.quantity || 0), 0);
  const wasteCount = result.length;

  // 理由別集計
  const reasonCounts: Record<string, number> = {};
  result.forEach((row) => {
    const reason = row.reason || '未分類';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  return c.json({
    success: true,
    data: {
      totalQuantity,
      wasteCount,
      reasonCounts,
    },
  });
});

export default app;
