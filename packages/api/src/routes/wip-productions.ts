import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { WipProductionService } from '../services/WipProductionService';
import { createDbClient } from '../db/client';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 製造履歴取得
app.get('/', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new WipProductionService(db);
  const storeId = c.req.query('storeId');
  const wipItemId = c.req.query('wipItemId');

  const history = await service.getProductionHistory(storeId, wipItemId);

  return c.json(history);
});

// 必要材料チェック
app.post('/check-ingredients', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new WipProductionService(db);
  const body = await c.req.json();

  const { storeId, wipItemId, quantity } = body;

  if (!storeId || !wipItemId || !quantity) {
    return c.json({ error: 'storeId, wipItemId, and quantity are required' }, 400);
  }

  const result = await service.checkRequiredIngredients(storeId, wipItemId, Number(quantity));

  return c.json(result);
});

// 仕掛品製造記録
app.post('/', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new WipProductionService(db);
  const body = await c.req.json();

  const { storeId, wipItemId, quantity, unit, productionDate, expiryDate, employeeId, notes } =
    body;

  if (!storeId || !wipItemId || !quantity || !unit) {
    return c.json({ error: 'storeId, wipItemId, quantity, and unit are required' }, 400);
  }

  try {
    const production = await service.recordProduction({
      storeId,
      wipItemId,
      quantity: Number(quantity),
      unit,
      productionDate: productionDate ? new Date(productionDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      employeeId,
      notes,
    });

    return c.json(production, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

export default app;
