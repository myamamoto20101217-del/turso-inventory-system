import { eq, and, sql } from 'drizzle-orm';
import type { DbClient } from '../db/client';
import {
  orders,
  orderDetails,
  inventory,
  products,
  type Order,
  type NewOrder,
  type OrderDetail,
  type NewOrderDetail,
} from '../db/schema';

export class OrderService {
  constructor(private db: DbClient) {}

  /**
   * 発注を新規作成（DRAFT状態）
   */
  async createOrder(data: {
    storeId: string;
    supplierId?: string;
    employeeId?: string;
    orderDate?: Date;
    expectedDeliveryDate?: Date;
    notes?: string;
  }): Promise<Order> {
    const id = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const orderDate = data.orderDate || new Date();

    const newOrder: NewOrder = {
      id,
      orderNumber,
      storeId: data.storeId,
      supplierId: data.supplierId,
      orderDate,
      expectedDeliveryDate: data.expectedDeliveryDate,
      status: 'DRAFT',
      isAutoOrder: false,
      employeeId: data.employeeId,
      totalAmount: 0,
      notes: data.notes,
    };

    await this.db.insert(orders).values(newOrder);

    const result = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);

    return result[0];
  }

  /**
   * 発注明細を追加
   */
  async addOrderDetail(data: {
    orderId: string;
    productId: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    notes?: string;
  }): Promise<OrderDetail> {
    const id = `OD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const amount = data.quantity * data.unitPrice;

    const newDetail: NewOrderDetail = {
      id,
      orderId: data.orderId,
      productId: data.productId,
      quantity: data.quantity,
      unit: data.unit,
      unitPrice: data.unitPrice,
      amount,
      receivedQuantity: 0,
      notes: data.notes,
    };

    await this.db.insert(orderDetails).values(newDetail);

    // 発注ヘッダーの合計金額を更新
    await this.updateOrderTotalAmount(data.orderId);

    const result = await this.db
      .select()
      .from(orderDetails)
      .where(eq(orderDetails.id, id))
      .limit(1);

    return result[0];
  }

  /**
   * 発注の合計金額を再計算
   */
  private async updateOrderTotalAmount(orderId: string): Promise<void> {
    const details = await this.db
      .select()
      .from(orderDetails)
      .where(eq(orderDetails.orderId, orderId));

    const totalAmount = details.reduce((sum, detail) => sum + detail.amount, 0);

    await this.db
      .update(orders)
      .set({
        totalAmount,
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(orders.id, orderId));
  }

  /**
   * 発注ステータスを更新
   */
  async updateOrderStatus(
    orderId: string,
    status: 'DRAFT' | 'ORDERED' | 'DELIVERED' | 'CANCELLED'
  ): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: Math.floor(Date.now() / 1000),
    };

    if (status === 'DELIVERED') {
      updateData.actualDeliveryDate = Math.floor(Date.now() / 1000);
    }

    await this.db.update(orders).set(updateData).where(eq(orders.id, orderId));
  }

  /**
   * 発注一覧を取得
   */
  async getOrders(storeId?: string, status?: string): Promise<Order[]> {
    let query = this.db.select().from(orders);

    if (storeId && status) {
      return query
        .where(and(eq(orders.storeId, storeId), eq(orders.status, status as any)))
        .orderBy(orders.orderDate);
    } else if (storeId) {
      return query.where(eq(orders.storeId, storeId)).orderBy(orders.orderDate);
    } else if (status) {
      return query.where(eq(orders.status, status as any)).orderBy(orders.orderDate);
    }

    return query.orderBy(orders.orderDate);
  }

  /**
   * 発注詳細と明細を取得
   */
  async getOrderWithDetails(orderId: string) {
    const order = await this.db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order.length) {
      return null;
    }

    const details = await this.db
      .select({
        id: orderDetails.id,
        productId: orderDetails.productId,
        productName: products.name,
        quantity: orderDetails.quantity,
        unit: orderDetails.unit,
        unitPrice: orderDetails.unitPrice,
        amount: orderDetails.amount,
        receivedQuantity: orderDetails.receivedQuantity,
        notes: orderDetails.notes,
      })
      .from(orderDetails)
      .innerJoin(products, eq(orderDetails.productId, products.id))
      .where(eq(orderDetails.orderId, orderId));

    return {
      order: order[0],
      details,
    };
  }

  /**
   * 自動発注推奨リストを生成
   */
  async generateAutoOrderRecommendations(storeId: string) {
    // 在庫が最小在庫を下回っている材料を取得
    const lowStockProducts = await this.db
      .select({
        productId: products.id,
        productName: products.name,
        currentQuantity: inventory.quantity,
        minStock: products.minStock,
        orderUnit: products.orderUnit,
        unitPrice: products.unitPrice,
        unit: products.unit,
        supplierId: products.supplierId,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(
        and(eq(inventory.storeId, storeId), sql`${inventory.quantity} <= ${products.minStock}`)
      );

    // 仕入先ごとにグループ化
    const ordersBySupplier = new Map<string, any[]>();

    for (const product of lowStockProducts) {
      const supplierId = product.supplierId || 'UNKNOWN';

      if (!ordersBySupplier.has(supplierId)) {
        ordersBySupplier.set(supplierId, []);
      }

      ordersBySupplier.get(supplierId)!.push({
        productId: product.productId,
        productName: product.productName,
        currentQuantity: product.currentQuantity,
        minStock: product.minStock,
        orderQuantity: product.orderUnit || product.minStock! * 2, // 最小在庫の2倍を発注
        unit: product.unit,
        unitPrice: product.unitPrice,
        estimatedAmount: (product.orderUnit || product.minStock! * 2) * (product.unitPrice || 0),
      });
    }

    // 仕入先ごとの推奨発注リストを返す
    const recommendations = Array.from(ordersBySupplier.entries()).map(([supplierId, items]) => ({
      supplierId,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.estimatedAmount, 0),
      itemCount: items.length,
    }));

    return recommendations;
  }

  /**
   * 自動発注推奨から実際の発注を作成
   */
  async createOrderFromRecommendation(
    storeId: string,
    supplierId: string,
    items: Array<{
      productId: string;
      quantity: number;
      unit: string;
      unitPrice: number;
    }>,
    employeeId?: string
  ): Promise<Order> {
    // 発注ヘッダーを作成
    const order = await this.createOrder({
      storeId,
      supplierId,
      employeeId,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後
    });

    // 発注明細を追加
    for (const item of items) {
      await this.addOrderDetail({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
      });
    }

    return order;
  }

  /**
   * 納品確認と在庫更新
   */
  async confirmDelivery(
    orderId: string,
    receivedItems: Array<{ detailId: string; quantity: number }>
  ): Promise<void> {
    const orderData = await this.getOrderWithDetails(orderId);

    if (!orderData) {
      throw new Error('Order not found');
    }

    // 各明細の受領数量を更新
    for (const item of receivedItems) {
      await this.db
        .update(orderDetails)
        .set({
          receivedQuantity: item.quantity,
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(orderDetails.id, item.detailId));

      // 在庫を更新
      const detail = orderData.details.find((d) => d.id === item.detailId);
      if (detail) {
        await this.db
          .update(inventory)
          .set({
            quantity: sql`${inventory.quantity} + ${item.quantity}`,
            updatedAt: sql`(unixepoch())`,
          })
          .where(
            and(
              eq(inventory.storeId, orderData.order.storeId),
              eq(inventory.productId, detail.productId)
            )
          );
      }
    }

    // 発注ステータスを納品済みに更新
    await this.updateOrderStatus(orderId, 'DELIVERED');
  }
}
