import { eq, and, sql } from 'drizzle-orm';
import type { DbClient } from '../db/client';
import {
  wipProductions,
  wipInventory,
  inventory,
  recipes,
  type WipProduction,
  type NewWipProduction,
} from '../db/schema';

export class WipProductionService {
  constructor(private db: DbClient) {}

  /**
   * 仕掛品製造を記録
   * - 仕掛品在庫を増やす
   * - レシピに基づいて材料在庫を減らす
   */
  async recordProduction(data: {
    storeId: string;
    wipItemId: string;
    quantity: number;
    unit: string;
    productionDate?: Date;
    expiryDate?: Date;
    employeeId?: string;
    notes?: string;
  }): Promise<WipProduction> {
    const id = `WP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const productionDate = data.productionDate || new Date();

    const newProduction: NewWipProduction = {
      id,
      storeId: data.storeId,
      wipItemId: data.wipItemId,
      quantity: data.quantity,
      unit: data.unit,
      productionDate,
      expiryDate: data.expiryDate,
      employeeId: data.employeeId,
      notes: data.notes,
    };

    // 仕掛品製造記録を挿入
    await this.db.insert(wipProductions).values(newProduction);

    // 仕掛品のレシピを取得
    const wipRecipe = await this.db
      .select()
      .from(recipes)
      .where(eq(recipes.wipItemId, data.wipItemId));

    // レシピに基づいて材料在庫を減らす
    for (const recipeItem of wipRecipe) {
      if (recipeItem.productId) {
        // 材料を消費
        const consumptionQuantity = recipeItem.quantity * data.quantity;

        // 在庫を減らす
        const existingInventory = await this.db
          .select()
          .from(inventory)
          .where(
            and(eq(inventory.storeId, data.storeId), eq(inventory.productId, recipeItem.productId))
          )
          .limit(1);

        if (existingInventory.length > 0) {
          const newQuantity = existingInventory[0].quantity - consumptionQuantity;

          await this.db
            .update(inventory)
            .set({
              quantity: newQuantity,
              updatedAt: sql`(unixepoch())`,
            })
            .where(eq(inventory.id, existingInventory[0].id));
        }
      }
    }

    // 仕掛品在庫を増やす
    const existingWipInventory = await this.db
      .select()
      .from(wipInventory)
      .where(
        and(eq(wipInventory.storeId, data.storeId), eq(wipInventory.wipItemId, data.wipItemId))
      )
      .limit(1);

    if (existingWipInventory.length > 0) {
      // 既存の在庫を更新
      await this.db
        .update(wipInventory)
        .set({
          quantity: existingWipInventory[0].quantity + data.quantity,
          productionDate,
          expiryDate: data.expiryDate,
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(wipInventory.id, existingWipInventory[0].id));
    } else {
      // 新しい在庫を作成
      await this.db.insert(wipInventory).values({
        id: `WINV-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        storeId: data.storeId,
        wipItemId: data.wipItemId,
        quantity: data.quantity,
        productionDate,
        expiryDate: data.expiryDate,
      });
    }

    const result = await this.db
      .select()
      .from(wipProductions)
      .where(eq(wipProductions.id, id))
      .limit(1);

    return result[0];
  }

  /**
   * 仕掛品製造履歴を取得
   */
  async getProductionHistory(storeId?: string, wipItemId?: string): Promise<WipProduction[]> {
    let query = this.db.select().from(wipProductions);

    if (storeId && wipItemId) {
      return query
        .where(and(eq(wipProductions.storeId, storeId), eq(wipProductions.wipItemId, wipItemId)))
        .orderBy(wipProductions.productionDate);
    } else if (storeId) {
      return query
        .where(eq(wipProductions.storeId, storeId))
        .orderBy(wipProductions.productionDate);
    } else if (wipItemId) {
      return query
        .where(eq(wipProductions.wipItemId, wipItemId))
        .orderBy(wipProductions.productionDate);
    }

    return query.orderBy(wipProductions.productionDate);
  }

  /**
   * 製造時に必要な材料を確認
   */
  async checkRequiredIngredients(
    storeId: string,
    wipItemId: string,
    productionQuantity: number
  ): Promise<{
    canProduce: boolean;
    requiredIngredients: Array<{
      productId: string;
      productName: string;
      requiredQuantity: number;
      availableQuantity: number;
      shortage: number;
    }>;
  }> {
    // 仕掛品のレシピを取得
    const wipRecipe = await this.db.select().from(recipes).where(eq(recipes.wipItemId, wipItemId));

    const requiredIngredients = [];
    let canProduce = true;

    for (const recipeItem of wipRecipe) {
      if (recipeItem.productId) {
        const requiredQuantity = recipeItem.quantity * productionQuantity;

        // 現在の在庫を確認
        const currentInventory = await this.db
          .select()
          .from(inventory)
          .where(and(eq(inventory.storeId, storeId), eq(inventory.productId, recipeItem.productId)))
          .limit(1);

        const availableQuantity = currentInventory.length > 0 ? currentInventory[0].quantity : 0;
        const shortage = Math.max(0, requiredQuantity - availableQuantity);

        if (shortage > 0) {
          canProduce = false;
        }

        requiredIngredients.push({
          productId: recipeItem.productId,
          productName: '', // TODO: JOIN で製品名を取得
          requiredQuantity,
          availableQuantity,
          shortage,
        });
      }
    }

    return {
      canProduce,
      requiredIngredients,
    };
  }
}
