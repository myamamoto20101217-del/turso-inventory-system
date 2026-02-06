import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * ユーザーテーブル
 * Firebase AuthのUIDと紐付け
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Firebase UID
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  role: text('role', { enum: ['admin', 'staff', 'viewer'] })
    .notNull()
    .default('staff'),
  storeId: text('store_id'), // 所属店舗
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 店舗マスター
 */
export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(), // S001, S002, K001, W001
  name: text('name').notNull(),
  type: text('type', { enum: ['STORE', 'KITCHEN', 'WAREHOUSE'] })
    .notNull()
    .default('STORE'),
  address: text('address'),
  phone: text('phone'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * カテゴリマスター
 */
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['MENU', 'INGREDIENT', 'WIP'] }).notNull(),
  parentId: text('parent_id'), // 階層構造対応
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * メニューマスター
 */
export const menus = sqliteTable('menus', {
  id: text('id').primaryKey(), // M001, M002
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  price: real('price').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 材料マスター (products)
 * 元GASの ingredient_master に相当
 */
export const products = sqliteTable('products', {
  id: text('id').primaryKey(), // I001, I002
  name: text('name').notNull(),
  janCode: text('jan_code'), // JANコード
  categoryId: text('category_id').references(() => categories.id),
  unit: text('unit').notNull(), // g, ml, 個
  lotSize: real('lot_size'), // ロットサイズ
  lotUnit: text('lot_unit'), // kg, L, 箱
  unitPrice: real('unit_price'), // 単価
  supplierId: text('supplier_id'), // 仕入先ID
  minStock: real('min_stock'), // 最小在庫数
  orderUnit: real('order_unit'), // 発注単位
  storageLocation: text('storage_location'), // 保管場所
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 仕掛品マスター
 * セントラルキッチンで製造する半製品
 */
export const wipItems = sqliteTable('wip_items', {
  id: text('id').primaryKey(), // W001, W002
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  unit: text('unit').notNull(),
  shelfLife: integer('shelf_life'), // 賞味期限(日数)
  productionLocation: text('production_location'), // 製造場所
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * レシピマスター
 * メニュー or 仕掛品を作るための材料・仕掛品の組み合わせ
 */
export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  menuId: text('menu_id').references(() => menus.id), // メニューレシピの場合
  wipItemId: text('wip_item_id').references(() => wipItems.id), // 仕掛品レシピの場合
  productId: text('product_id').references(() => products.id), // 使用する材料
  usedWipItemId: text('used_wip_item_id').references(() => wipItems.id), // 使用する仕掛品
  quantity: real('quantity').notNull(), // 使用量
  unit: text('unit').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 在庫テーブル (材料在庫)
 */
export const inventory = sqliteTable('inventory', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: real('quantity').notNull().default(0),
  lastUpdatedBy: text('last_updated_by').references(() => users.id),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 仕掛品在庫テーブル
 */
export const wipInventory = sqliteTable('wip_inventory', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id),
  wipItemId: text('wip_item_id')
    .notNull()
    .references(() => wipItems.id),
  quantity: real('quantity').notNull().default(0),
  productionDate: integer('production_date', { mode: 'timestamp' }),
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
  lastUpdatedBy: text('last_updated_by').references(() => users.id),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 売上データ
 */
export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id),
  menuId: text('menu_id')
    .notNull()
    .references(() => menus.id),
  quantity: integer('quantity').notNull(),
  amount: real('amount').notNull(), // 売上金額
  saleDate: integer('sale_date', { mode: 'timestamp' }).notNull(),
  posTransactionId: text('pos_transaction_id'), // POSシステムの取引ID
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 仕入データ
 */
export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalAmount: real('total_amount').notNull(),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }).notNull(),
  supplierId: text('supplier_id'),
  invoiceNumber: text('invoice_number'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 廃棄データ
 */
export const waste = sqliteTable('waste', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id),
  productId: text('product_id').references(() => products.id),
  wipItemId: text('wip_item_id').references(() => wipItems.id),
  quantity: real('quantity').notNull(),
  reason: text('reason'), // 廃棄理由
  wasteDate: integer('waste_date', { mode: 'timestamp' }).notNull(),
  recordedBy: text('recorded_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 棚卸ヘッダー
 */
export const stocktakings = sqliteTable('stocktakings', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id),
  stocktakingDate: integer('stocktaking_date', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['DRAFT', 'CONFIRMED'] })
    .notNull()
    .default('DRAFT'),
  employeeId: text('employee_id').references(() => users.id),
  confirmedAt: integer('confirmed_at', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 棚卸明細
 */
export const stocktakingDetails = sqliteTable('stocktaking_details', {
  id: text('id').primaryKey(),
  stocktakingId: text('stocktaking_id')
    .notNull()
    .references(() => stocktakings.id),
  productId: text('product_id').references(() => products.id),
  wipItemId: text('wip_item_id').references(() => wipItems.id),
  systemQuantity: real('system_quantity').notNull(), // 理論在庫
  actualQuantity: real('actual_quantity').notNull(), // 実在庫
  difference: real('difference').notNull(), // 差異
  unit: text('unit').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 発注ヘッダー
 */
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // 表示用発注番号
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id),
  supplierId: text('supplier_id'),
  orderDate: integer('order_date', { mode: 'timestamp' }).notNull(),
  expectedDeliveryDate: integer('expected_delivery_date', { mode: 'timestamp' }),
  actualDeliveryDate: integer('actual_delivery_date', { mode: 'timestamp' }),
  status: text('status', {
    enum: ['DRAFT', 'ORDERED', 'DELIVERED', 'CANCELLED'],
  })
    .notNull()
    .default('DRAFT'),
  isAutoOrder: integer('is_auto_order', { mode: 'boolean' }).notNull().default(false),
  employeeId: text('employee_id').references(() => users.id),
  totalAmount: real('total_amount').notNull().default(0),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 発注明細
 */
export const orderDetails = sqliteTable('order_details', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  unitPrice: real('unit_price').notNull(),
  amount: real('amount').notNull(), // quantity × unitPrice
  receivedQuantity: real('received_quantity').default(0), // 実際の納品数量
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * 仕掛品製造データ
 */
export const wipProductions = sqliteTable('wip_productions', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id),
  wipItemId: text('wip_item_id')
    .notNull()
    .references(() => wipItems.id),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  productionDate: integer('production_date', { mode: 'timestamp' }).notNull(),
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
  employeeId: text('employee_id').references(() => users.id),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 型エクスポート
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Store = typeof stores.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type Stocktaking = typeof stocktakings.$inferSelect;
export type NewStocktaking = typeof stocktakings.$inferInsert;
export type StocktakingDetail = typeof stocktakingDetails.$inferSelect;
export type NewStocktakingDetail = typeof stocktakingDetails.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderDetail = typeof orderDetails.$inferSelect;
export type NewOrderDetail = typeof orderDetails.$inferInsert;
export type WipProduction = typeof wipProductions.$inferSelect;
export type NewWipProduction = typeof wipProductions.$inferInsert;
