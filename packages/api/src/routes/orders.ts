import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { OrderService } from '../services/OrderService';
import { createDbClient } from '../db/client';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 発注一覧取得
app.get('/', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new OrderService(db);
  const storeId = c.req.query('storeId');
  const status = c.req.query('status');

  const orders = await service.getOrders(storeId, status);

  return c.json(orders);
});

// 発注詳細取得
app.get('/:id', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new OrderService(db);
  const id = c.req.param('id');

  const result = await service.getOrderWithDetails(id);

  if (!result) {
    return c.json({ error: 'Order not found' }, 404);
  }

  return c.json(result);
});

// 自動発注推奨リスト取得
app.get('/recommendations/:storeId', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new OrderService(db);
  const storeId = c.req.param('storeId');

  const recommendations = await service.generateAutoOrderRecommendations(storeId);

  return c.json(recommendations);
});

// 発注作成
app.post('/', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new OrderService(db);
  const body = await c.req.json();

  const { storeId, supplierId, employeeId, orderDate, expectedDeliveryDate, notes, items } = body;

  if (!storeId) {
    return c.json({ error: 'storeId is required' }, 400);
  }

  // 発注ヘッダーを作成
  const order = await service.createOrder({
    storeId,
    supplierId,
    employeeId,
    orderDate: orderDate ? new Date(orderDate) : undefined,
    expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
    notes,
  });

  // 発注明細を追加
  if (items && Array.isArray(items)) {
    for (const item of items) {
      await service.addOrderDetail({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        notes: item.notes,
      });
    }
  }

  return c.json(order, 201);
});

// 推奨発注から発注作成
app.post('/from-recommendation', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new OrderService(db);
  const body = await c.req.json();

  const { storeId, supplierId, items, employeeId } = body;

  if (!storeId || !supplierId || !items || !Array.isArray(items)) {
    return c.json({ error: 'storeId, supplierId, and items are required' }, 400);
  }

  const order = await service.createOrderFromRecommendation(storeId, supplierId, items, employeeId);

  return c.json(order, 201);
});

// 発注明細追加
app.post('/:id/details', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new OrderService(db);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { productId, quantity, unit, unitPrice, notes } = body;

  if (!productId || !quantity || !unit || !unitPrice) {
    return c.json({ error: 'productId, quantity, unit, and unitPrice are required' }, 400);
  }

  const detail = await service.addOrderDetail({
    orderId: id,
    productId,
    quantity: Number(quantity),
    unit,
    unitPrice: Number(unitPrice),
    notes,
  });

  return c.json(detail, 201);
});

// 発注ステータス更新
app.patch('/:id/status', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new OrderService(db);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { status } = body;

  if (!status || !['DRAFT', 'ORDERED', 'DELIVERED', 'CANCELLED'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  await service.updateOrderStatus(id, status);

  return c.json({ message: 'Order status updated successfully' });
});

// 納品確認
app.post('/:id/delivery', async (c) => {
  const db = createDbClient(c.env) as any;
  const service = new OrderService(db);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { receivedItems } = body;

  if (!receivedItems || !Array.isArray(receivedItems)) {
    return c.json({ error: 'receivedItems array is required' }, 400);
  }

  try {
    await service.confirmDelivery(id, receivedItems);
    return c.json({ message: 'Delivery confirmed and inventory updated successfully' });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

export default app;
