import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { StocktakingService } from '../services/StocktakingService';
import { createDbClient } from '../db/client';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 棚卸一覧取得
app.get('/', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new StocktakingService(db);
  const storeId = c.req.query('storeId');

  const stocktakings = await service.getStocktakings(storeId);

  return c.json(stocktakings);
});

// 棚卸詳細取得
app.get('/:id', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new StocktakingService(db);
  const id = c.req.param('id');

  const result = await service.getStocktakingWithDetails(id);

  if (!result) {
    return c.json({ error: 'Stocktaking not found' }, 404);
  }

  return c.json(result);
});

// 棚卸差異分析取得
app.get('/:id/analysis', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new StocktakingService(db);
  const id = c.req.param('id');

  const analysis = await service.getStocktakingAnalysis(id);

  return c.json(analysis);
});

// 棚卸作成
app.post('/', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new StocktakingService(db);
  const body = await c.req.json();

  const { storeId, employeeId, stocktakingDate, autoGenerate } = body;

  if (!storeId || !employeeId) {
    return c.json({ error: 'storeId and employeeId are required' }, 400);
  }

  const stocktaking = await service.createStocktaking({
    storeId,
    employeeId,
    stocktakingDate: stocktakingDate ? new Date(stocktakingDate) : undefined,
  });

  // 自動生成フラグがある場合は在庫から明細を生成
  if (autoGenerate) {
    await service.generateStocktakingDetails(stocktaking.id, storeId);
  }

  return c.json(stocktaking, 201);
});

// 棚卸明細追加
app.post('/:id/details', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new StocktakingService(db);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { productId, wipItemId, systemQuantity, actualQuantity, unit, notes } = body;

  if (!systemQuantity || !actualQuantity || !unit) {
    return c.json({ error: 'systemQuantity, actualQuantity, and unit are required' }, 400);
  }

  if (!productId && !wipItemId) {
    return c.json({ error: 'Either productId or wipItemId is required' }, 400);
  }

  const detail = await service.addStocktakingDetail({
    stocktakingId: id,
    productId,
    wipItemId,
    systemQuantity: Number(systemQuantity),
    actualQuantity: Number(actualQuantity),
    unit,
    notes,
  });

  return c.json(detail, 201);
});

// 棚卸確定
app.post('/:id/confirm', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new StocktakingService(db);
  const id = c.req.param('id');

  try {
    await service.confirmStocktaking(id);
    return c.json({ message: 'Stocktaking confirmed successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

export default app;
