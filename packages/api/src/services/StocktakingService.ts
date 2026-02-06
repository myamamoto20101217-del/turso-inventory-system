import { eq, and, sql } from 'drizzle-orm';
import type { DbClient } from '../db/client';
import {
  stocktakings,
  stocktakingDetails,
  inventory,
  wipInventory,
  products,
  wipItems,
  type Stocktaking,
  type NewStocktaking,
  type StocktakingDetail,
  type NewStocktakingDetail,
} from '../db/schema';

export class StocktakingService {
  constructor(private db: DbClient) {}

  /**
   * 棚卸を新規作成（DRAFT状態）
   */
  async createStocktaking(data: {
    storeId: string;
    employeeId: string;
    stocktakingDate?: Date;
  }): Promise<Stocktaking> {
    const id = `ST-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const stocktakingDate = data.stocktakingDate || new Date();

    const newStocktaking: NewStocktaking = {
      id,
      storeId: data.storeId,
      stocktakingDate,
      status: 'DRAFT',
      employeeId: data.employeeId,
    };

    await this.db.insert(stocktakings).values(newStocktaking);

    const result = await this.db
      .select()
      .from(stocktakings)
      .where(eq(stocktakings.id, id))
      .limit(1);

    return result[0];
  }

  /**
   * 棚卸明細を追加
   */
  async addStocktakingDetail(data: {
    stocktakingId: string;
    productId?: string;
    wipItemId?: string;
    systemQuantity: number;
    actualQuantity: number;
    unit: string;
    notes?: string;
  }): Promise<StocktakingDetail> {
    const id = `STD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const difference = data.actualQuantity - data.systemQuantity;

    const newDetail: NewStocktakingDetail = {
      id,
      stocktakingId: data.stocktakingId,
      productId: data.productId,
      wipItemId: data.wipItemId,
      systemQuantity: data.systemQuantity,
      actualQuantity: data.actualQuantity,
      difference,
      unit: data.unit,
      notes: data.notes,
    };

    await this.db.insert(stocktakingDetails).values(newDetail);

    const result = await this.db
      .select()
      .from(stocktakingDetails)
      .where(eq(stocktakingDetails.id, id))
      .limit(1);

    return result[0];
  }

  /**
   * 棚卸を確定して在庫を調整
   */
  async confirmStocktaking(stocktakingId: string): Promise<void> {
    // 棚卸ヘッダーを取得
    const stocktaking = await this.db
      .select()
      .from(stocktakings)
      .where(eq(stocktakings.id, stocktakingId))
      .limit(1);

    if (!stocktaking.length) {
      throw new Error('Stocktaking not found');
    }

    if (stocktaking[0].status === 'CONFIRMED') {
      throw new Error('Stocktaking already confirmed');
    }

    // 明細を取得
    const details = await this.db
      .select()
      .from(stocktakingDetails)
      .where(eq(stocktakingDetails.stocktakingId, stocktakingId));

    // 在庫を調整
    for (const detail of details) {
      if (detail.productId) {
        // 材料在庫を調整
        await this.db
          .update(inventory)
          .set({
            quantity: detail.actualQuantity,
            updatedAt: sql`(unixepoch())`,
          })
          .where(
            and(
              eq(inventory.storeId, stocktaking[0].storeId),
              eq(inventory.productId, detail.productId)
            )
          );
      } else if (detail.wipItemId) {
        // 仕掛品在庫を調整
        await this.db
          .update(wipInventory)
          .set({
            quantity: detail.actualQuantity,
            updatedAt: sql`(unixepoch())`,
          })
          .where(
            and(
              eq(wipInventory.storeId, stocktaking[0].storeId),
              eq(wipInventory.wipItemId, detail.wipItemId)
            )
          );
      }
    }

    // 棚卸ステータスを確定
    await this.db
      .update(stocktakings)
      .set({
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(stocktakings.id, stocktakingId));
  }

  /**
   * 棚卸一覧を取得
   */
  async getStocktakings(storeId?: string): Promise<Stocktaking[]> {
    if (storeId) {
      return this.db
        .select()
        .from(stocktakings)
        .where(eq(stocktakings.storeId, storeId))
        .orderBy(stocktakings.stocktakingDate);
    }

    return this.db.select().from(stocktakings).orderBy(stocktakings.stocktakingDate);
  }

  /**
   * 棚卸詳細と明細を取得
   */
  async getStocktakingWithDetails(stocktakingId: string) {
    const stocktaking = await this.db
      .select()
      .from(stocktakings)
      .where(eq(stocktakings.id, stocktakingId))
      .limit(1);

    if (!stocktaking.length) {
      return null;
    }

    const details = await this.db
      .select({
        id: stocktakingDetails.id,
        productId: stocktakingDetails.productId,
        productName: products.name,
        wipItemId: stocktakingDetails.wipItemId,
        wipItemName: wipItems.name,
        systemQuantity: stocktakingDetails.systemQuantity,
        actualQuantity: stocktakingDetails.actualQuantity,
        difference: stocktakingDetails.difference,
        unit: stocktakingDetails.unit,
        notes: stocktakingDetails.notes,
      })
      .from(stocktakingDetails)
      .leftJoin(products, eq(stocktakingDetails.productId, products.id))
      .leftJoin(wipItems, eq(stocktakingDetails.wipItemId, wipItems.id))
      .where(eq(stocktakingDetails.stocktakingId, stocktakingId));

    return {
      stocktaking: stocktaking[0],
      details,
    };
  }

  /**
   * 差異分析を取得
   */
  async getStocktakingAnalysis(stocktakingId: string) {
    const details = await this.db
      .select()
      .from(stocktakingDetails)
      .where(eq(stocktakingDetails.stocktakingId, stocktakingId));

    const totalItems = details.length;
    const matchedItems = details.filter((d) => d.difference === 0).length;
    const differenceItems = totalItems - matchedItems;

    // 差異が大きい順にソート
    const topDifferences = details
      .filter((d) => d.difference !== 0)
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
      .slice(0, 10);

    return {
      totalItems,
      matchedItems,
      differenceItems,
      differenceRate: totalItems > 0 ? (differenceItems / totalItems) * 100 : 0,
      topDifferences: topDifferences.map((d) => ({
        productId: d.productId,
        wipItemId: d.wipItemId,
        systemQuantity: d.systemQuantity,
        actualQuantity: d.actualQuantity,
        difference: d.difference,
        differenceRate:
          d.systemQuantity > 0 ? ((d.difference / d.systemQuantity) * 100).toFixed(2) : 'N/A',
      })),
    };
  }

  /**
   * 現在の在庫をベースに棚卸明細を自動生成
   */
  async generateStocktakingDetails(stocktakingId: string, storeId: string): Promise<void> {
    // 材料在庫を取得
    const productInventories = await this.db
      .select({
        productId: inventory.productId,
        quantity: inventory.quantity,
        unit: products.unit,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(eq(inventory.storeId, storeId));

    // 仕掛品在庫を取得
    const wipInventories = await this.db
      .select({
        wipItemId: wipInventory.wipItemId,
        quantity: wipInventory.quantity,
        unit: wipItems.unit,
      })
      .from(wipInventory)
      .innerJoin(wipItems, eq(wipInventory.wipItemId, wipItems.id))
      .where(eq(wipInventory.storeId, storeId));

    // 材料の棚卸明細を作成
    for (const inv of productInventories) {
      await this.addStocktakingDetail({
        stocktakingId,
        productId: inv.productId,
        systemQuantity: inv.quantity || 0,
        actualQuantity: inv.quantity || 0, // 初期値は理論在庫と同じ
        unit: inv.unit,
      });
    }

    // 仕掛品の棚卸明細を作成
    for (const inv of wipInventories) {
      await this.addStocktakingDetail({
        stocktakingId,
        wipItemId: inv.wipItemId,
        systemQuantity: inv.quantity || 0,
        actualQuantity: inv.quantity || 0, // 初期値は理論在庫と同じ
        unit: inv.unit,
      });
    }
  }
}
