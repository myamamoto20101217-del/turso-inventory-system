import { Hono } from 'hono';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { createDbClient } from '../db/client';
import { sales, menus, stores } from '../db/schema';
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
 * 売上データ一覧取得
 * GET /api/sales?storeId=S001&startDate=2026-02-01&endDate=2026-02-28
 */
app.get('/', authMiddleware, async (c) => {
  const storeId = c.req.query('storeId');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const db = createDbClient(c.env);

  try {
    let query = db
      .select({
        id: sales.id,
        storeId: sales.storeId,
        storeName: stores.name,
        menuId: sales.menuId,
        menuName: menus.name,
        quantity: sales.quantity,
        amount: sales.amount,
        saleDate: sales.saleDate,
      })
      .from(sales)
      .leftJoin(menus, eq(sales.menuId, menus.id))
      .leftJoin(stores, eq(sales.storeId, stores.id))
      .$dynamic();

    // フィルタリング
    const conditions = [];
    if (storeId) conditions.push(eq(sales.storeId, storeId));
    if (startDate) conditions.push(gte(sales.saleDate, new Date(startDate)));
    if (endDate) conditions.push(lte(sales.saleDate, new Date(endDate)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const salesData = await query.orderBy(sales.saleDate);

    return c.json({
      success: true,
      data: salesData,
      count: salesData.length,
    });
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return c.json({ error: 'Failed to fetch sales' }, 500);
  }
});

/**
 * 売上サマリー取得
 * GET /api/sales/summary?storeId=S001&startDate=2026-02-01&endDate=2026-02-28
 */
app.get('/summary', authMiddleware, async (c) => {
  const storeId = c.req.query('storeId');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const db = createDbClient(c.env);

  try {
    const conditions = [];
    if (storeId) conditions.push(eq(sales.storeId, storeId));
    if (startDate) conditions.push(gte(sales.saleDate, new Date(startDate)));
    if (endDate) conditions.push(lte(sales.saleDate, new Date(endDate)));

    const summary = await db
      .select({
        totalSales: sql<number>`SUM(${sales.amount})`,
        totalQuantity: sql<number>`SUM(${sales.quantity})`,
        orderCount: sql<number>`COUNT(DISTINCT ${sales.id})`,
        averageOrderValue: sql<number>`AVG(${sales.amount})`,
      })
      .from(sales)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return c.json({
      success: true,
      data: summary[0],
    });
  } catch (error) {
    console.error('Failed to fetch sales summary:', error);
    return c.json({ error: 'Failed to fetch sales summary' }, 500);
  }
});

export default app;
