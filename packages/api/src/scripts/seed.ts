import { createDbClient } from '../db/client';
import {
  users,
  stores,
  categories,
  products,
  menus,
  wipItems,
  recipes,
  inventory,
  sales,
  purchases,
  waste,
} from '../db/schema';

/**
 * 実践的な居酒屋風飲食店のサンプルデータ投入
 * 参考_在庫管理_GASのデータ構造を踏襲
 * bun run db:seed で実行
 */
async function seed() {
  console.log('🌱 居酒屋風在庫管理システム - サンプルデータ投入中...');

  const env = {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  };

  const db = createDbClient(env);

  try {
    // 1. ユーザー（従業員）- 店舗別スタッフ配置
    await db.insert(users).values([
      // 本部・管理者
      { id: 'EMP001', email: 'admin@izakaya.com', displayName: '山田太郎（店長）', role: 'admin' },

      // 店舗A スタッフ（5名）
      {
        id: 'EMP101',
        email: 'staff-a1@izakaya.com',
        displayName: '佐藤花子（店舗A 副店長）',
        role: 'staff',
        storeId: 'S001',
      },
      {
        id: 'EMP102',
        email: 'staff-a2@izakaya.com',
        displayName: '鈴木一郎（店舗A ホール）',
        role: 'staff',
        storeId: 'S001',
      },
      {
        id: 'EMP103',
        email: 'staff-a3@izakaya.com',
        displayName: '田中美咲（店舗A ホール）',
        role: 'staff',
        storeId: 'S001',
      },
      {
        id: 'EMP104',
        email: 'staff-a4@izakaya.com',
        displayName: '高橋健太（店舗A キッチン）',
        role: 'staff',
        storeId: 'S001',
      },
      {
        id: 'EMP105',
        email: 'staff-a5@izakaya.com',
        displayName: '伊藤美優（店舗A キッチン）',
        role: 'staff',
        storeId: 'S001',
      },

      // 店舗B スタッフ（6名）
      {
        id: 'EMP201',
        email: 'staff-b1@izakaya.com',
        displayName: '渡辺大輔（店舗B 副店長）',
        role: 'staff',
        storeId: 'S002',
      },
      {
        id: 'EMP202',
        email: 'staff-b2@izakaya.com',
        displayName: '小林さくら（店舗B ホール）',
        role: 'staff',
        storeId: 'S002',
      },
      {
        id: 'EMP203',
        email: 'staff-b3@izakaya.com',
        displayName: '加藤翔太（店舗B ホール）',
        role: 'staff',
        storeId: 'S002',
      },
      {
        id: 'EMP204',
        email: 'staff-b4@izakaya.com',
        displayName: '山本和也（店舗B キッチン）',
        role: 'staff',
        storeId: 'S002',
      },
      {
        id: 'EMP205',
        email: 'staff-b5@izakaya.com',
        displayName: '中村彩香（店舗B キッチン）',
        role: 'staff',
        storeId: 'S002',
      },
      {
        id: 'EMP206',
        email: 'staff-b6@izakaya.com',
        displayName: '松本拓也（店舗B キッチン）',
        role: 'staff',
        storeId: 'S002',
      },

      // 店舗C スタッフ（5名）
      {
        id: 'EMP301',
        email: 'staff-c1@izakaya.com',
        displayName: '吉田隆（店舗C 副店長）',
        role: 'staff',
        storeId: 'S003',
      },
      {
        id: 'EMP302',
        email: 'staff-c2@izakaya.com',
        displayName: '斎藤優子（店舗C ホール）',
        role: 'staff',
        storeId: 'S003',
      },
      {
        id: 'EMP303',
        email: 'staff-c3@izakaya.com',
        displayName: '清水達也（店舗C ホール）',
        role: 'staff',
        storeId: 'S003',
      },
      {
        id: 'EMP304',
        email: 'staff-c4@izakaya.com',
        displayName: '森本千夏（店舗C キッチン）',
        role: 'staff',
        storeId: 'S003',
      },
      {
        id: 'EMP305',
        email: 'staff-c5@izakaya.com',
        displayName: '池田大樹（店舗C キッチン）',
        role: 'staff',
        storeId: 'S003',
      },

      // セントラルキッチン スタッフ（3名）
      {
        id: 'EMP401',
        email: 'kitchen-chef@izakaya.com',
        displayName: '木村シェフ（CK 責任者）',
        role: 'staff',
        storeId: 'K001',
      },
      {
        id: 'EMP402',
        email: 'kitchen-staff1@izakaya.com',
        displayName: '林調理師（CK）',
        role: 'staff',
        storeId: 'K001',
      },
      {
        id: 'EMP403',
        email: 'kitchen-staff2@izakaya.com',
        displayName: '原調理補助（CK）',
        role: 'staff',
        storeId: 'K001',
      },
    ]);
    console.log('✅ 従業員データ作成（全20名）');

    // 2. 店舗（3店舗 + セントラルキッチン + 倉庫）
    await db.insert(stores).values([
      {
        id: 'S001',
        name: '店舗A（渋谷店）',
        type: 'STORE',
        address: '東京都渋谷区道玄坂1-2-3',
        phone: '03-1234-5001',
      },
      {
        id: 'S002',
        name: '店舗B（新宿店）',
        type: 'STORE',
        address: '東京都新宿区歌舞伎町1-1-1',
        phone: '03-1234-5002',
      },
      {
        id: 'S003',
        name: '店舗C（池袋店）',
        type: 'STORE',
        address: '東京都豊島区西池袋1-1-1',
        phone: '03-1234-5003',
      },
      {
        id: 'K001',
        name: 'セントラルキッチン',
        type: 'KITCHEN',
        address: '東京都品川区大井1-1-1',
        phone: '03-1234-6001',
      },
      {
        id: 'W001',
        name: '倉庫（川口）',
        type: 'WAREHOUSE',
        address: '埼玉県川口市本町1-1-1',
        phone: '048-1234-7001',
      },
    ]);
    console.log('✅ 店舗データ作成（3店舗 + CK + 倉庫）');

    // 3. カテゴリ
    await db.insert(categories).values([
      // メニューカテゴリ
      { id: 'CAT_MENU_001', name: 'ドリンク', type: 'MENU', displayOrder: 1 },
      { id: 'CAT_MENU_002', name: '刺身・海鮮', type: 'MENU', displayOrder: 2 },
      { id: 'CAT_MENU_003', name: '焼き物', type: 'MENU', displayOrder: 3 },
      { id: 'CAT_MENU_004', name: '揚げ物', type: 'MENU', displayOrder: 4 },
      { id: 'CAT_MENU_005', name: 'サラダ', type: 'MENU', displayOrder: 5 },
      { id: 'CAT_MENU_006', name: 'ご飯もの', type: 'MENU', displayOrder: 6 },
      // 材料カテゴリ
      { id: 'CAT_ING_001', name: '魚介類', type: 'INGREDIENT', displayOrder: 1 },
      { id: 'CAT_ING_002', name: '肉類', type: 'INGREDIENT', displayOrder: 2 },
      { id: 'CAT_ING_003', name: '野菜', type: 'INGREDIENT', displayOrder: 3 },
      { id: 'CAT_ING_004', name: '調味料', type: 'INGREDIENT', displayOrder: 4 },
      { id: 'CAT_ING_005', name: '米・穀物', type: 'INGREDIENT', displayOrder: 5 },
      { id: 'CAT_ING_006', name: '飲料', type: 'INGREDIENT', displayOrder: 6 },
      // 仕掛品カテゴリ
      { id: 'CAT_WIP_001', name: '魚加工品', type: 'WIP', displayOrder: 1 },
      { id: 'CAT_WIP_002', name: '野菜カット', type: 'WIP', displayOrder: 2 },
      { id: 'CAT_WIP_003', name: '自家製ソース', type: 'WIP', displayOrder: 3 },
    ]);
    console.log('✅ カテゴリデータ作成');

    // 4. メニュー
    await db.insert(menus).values([
      { id: 'M001', name: 'マグロ刺身盛り合わせ', categoryId: 'CAT_MENU_002', price: 1280 },
      { id: 'M002', name: '本日の鮮魚カルパッチョ', categoryId: 'CAT_MENU_002', price: 880 },
      { id: 'M003', name: '特製唐揚げ', categoryId: 'CAT_MENU_004', price: 680 },
      { id: 'M004', name: 'シーザーサラダ', categoryId: 'CAT_MENU_005', price: 580 },
      { id: 'M005', name: '海鮮丼', categoryId: 'CAT_MENU_006', price: 980 },
      { id: 'M006', name: '焼き鳥盛り合わせ（5本）', categoryId: 'CAT_MENU_003', price: 780 },
      { id: 'M007', name: '枝豆', categoryId: 'CAT_MENU_005', price: 380 },
      { id: 'M008', name: '生ビール（中ジョッキ）', categoryId: 'CAT_MENU_001', price: 580 },
      { id: 'M009', name: 'ハイボール', categoryId: 'CAT_MENU_001', price: 480 },
      { id: 'M010', name: '日本酒（熱燗）', categoryId: 'CAT_MENU_001', price: 580 },
    ]);
    console.log('✅ メニューデータ作成');

    // 5. 材料(商品)
    await db.insert(products).values([
      // 魚介類
      {
        id: 'I001',
        name: 'マグロ（柵）',
        categoryId: 'CAT_ING_001',
        unit: 'g',
        unitPrice: 12,
        minStock: 500,
        orderUnit: 2000,
        janCode: '4901234567890',
      },
      {
        id: 'I002',
        name: '鯛（丸）',
        categoryId: 'CAT_ING_001',
        unit: 'g',
        unitPrice: 8,
        minStock: 300,
        orderUnit: 1000,
      },
      {
        id: 'I003',
        name: 'サーモン（柵）',
        categoryId: 'CAT_ING_001',
        unit: 'g',
        unitPrice: 10,
        minStock: 500,
        orderUnit: 2000,
      },
      {
        id: 'I004',
        name: 'ホタテ',
        categoryId: 'CAT_ING_001',
        unit: '個',
        unitPrice: 180,
        minStock: 20,
        orderUnit: 50,
      },
      // 肉類
      {
        id: 'I010',
        name: '鶏もも肉',
        categoryId: 'CAT_ING_002',
        unit: 'g',
        unitPrice: 2.5,
        minStock: 2000,
        orderUnit: 5000,
      },
      {
        id: 'I011',
        name: '豚バラ肉',
        categoryId: 'CAT_ING_002',
        unit: 'g',
        unitPrice: 3,
        minStock: 1000,
        orderUnit: 3000,
      },
      // 野菜
      {
        id: 'I020',
        name: 'レタス',
        categoryId: 'CAT_ING_003',
        unit: 'g',
        unitPrice: 1.2,
        minStock: 1000,
        orderUnit: 3000,
      },
      {
        id: 'I021',
        name: 'トマト',
        categoryId: 'CAT_ING_003',
        unit: 'g',
        unitPrice: 1.5,
        minStock: 800,
        orderUnit: 2000,
      },
      {
        id: 'I022',
        name: 'きゅうり',
        categoryId: 'CAT_ING_003',
        unit: 'g',
        unitPrice: 1,
        minStock: 500,
        orderUnit: 1500,
      },
      {
        id: 'I023',
        name: 'キャベツ',
        categoryId: 'CAT_ING_003',
        unit: 'g',
        unitPrice: 0.8,
        minStock: 2000,
        orderUnit: 5000,
      },
      {
        id: 'I024',
        name: '枝豆（冷凍）',
        categoryId: 'CAT_ING_003',
        unit: 'g',
        unitPrice: 1.5,
        minStock: 1000,
        orderUnit: 3000,
      },
      // 調味料
      {
        id: 'I030',
        name: '醤油',
        categoryId: 'CAT_ING_004',
        unit: 'ml',
        unitPrice: 0.8,
        minStock: 5000,
        orderUnit: 10000,
      },
      {
        id: 'I031',
        name: 'みりん',
        categoryId: 'CAT_ING_004',
        unit: 'ml',
        unitPrice: 1,
        minStock: 3000,
        orderUnit: 5000,
      },
      {
        id: 'I032',
        name: '酒',
        categoryId: 'CAT_ING_004',
        unit: 'ml',
        unitPrice: 0.9,
        minStock: 3000,
        orderUnit: 5000,
      },
      {
        id: 'I033',
        name: 'ごま油',
        categoryId: 'CAT_ING_004',
        unit: 'ml',
        unitPrice: 2,
        minStock: 1000,
        orderUnit: 3000,
      },
      {
        id: 'I034',
        name: '塩',
        categoryId: 'CAT_ING_004',
        unit: 'g',
        unitPrice: 0.1,
        minStock: 5000,
        orderUnit: 10000,
      },
      {
        id: 'I035',
        name: 'こしょう',
        categoryId: 'CAT_ING_004',
        unit: 'g',
        unitPrice: 3,
        minStock: 500,
        orderUnit: 1000,
      },
      // 米・穀物
      {
        id: 'I040',
        name: '白米',
        categoryId: 'CAT_ING_005',
        unit: 'g',
        unitPrice: 0.5,
        minStock: 10000,
        orderUnit: 30000,
      },
      // 飲料
      {
        id: 'I050',
        name: 'ビール樽（生）',
        categoryId: 'CAT_ING_006',
        unit: 'L',
        unitPrice: 800,
        minStock: 50,
        orderUnit: 100,
      },
      {
        id: 'I051',
        name: 'ウイスキー',
        categoryId: 'CAT_ING_006',
        unit: 'ml',
        unitPrice: 3,
        minStock: 2000,
        orderUnit: 5000,
      },
      {
        id: 'I052',
        name: '日本酒',
        categoryId: 'CAT_ING_006',
        unit: 'ml',
        unitPrice: 4,
        minStock: 3000,
        orderUnit: 5000,
      },
    ]);
    console.log('✅ 材料データ作成');

    // 6. 仕掛品（セントラルキッチンで事前調理）
    await db.insert(wipItems).values([
      {
        id: 'W001',
        name: 'サラダミックス',
        categoryId: 'CAT_WIP_002',
        unit: 'g',
        shelfLife: 2,
        productionLocation: 'K001',
      },
      {
        id: 'W002',
        name: '唐揚げ下味付け肉',
        categoryId: 'CAT_WIP_001',
        unit: 'g',
        shelfLife: 2,
        productionLocation: 'K001',
      },
      {
        id: 'W003',
        name: 'カレールー（特製）',
        categoryId: 'CAT_WIP_003',
        unit: 'g',
        shelfLife: 5,
        productionLocation: 'K001',
      },
      {
        id: 'W004',
        name: '特製和風ドレッシング',
        categoryId: 'CAT_WIP_003',
        unit: 'ml',
        shelfLife: 7,
        productionLocation: 'K001',
      },
      {
        id: 'W005',
        name: '照り焼きソース',
        categoryId: 'CAT_WIP_003',
        unit: 'ml',
        shelfLife: 14,
        productionLocation: 'K001',
      },
    ]);
    console.log('✅ WIP Items created');

    // 7. レシピ
    await db.insert(recipes).values([
      // マグロ刺身盛り合わせ (M001)
      { id: 'R001', menuId: 'M001', productId: 'I001', quantity: 120, unit: 'g' }, // マグロ
      // 海鮮丼 (M005)
      { id: 'R002', menuId: 'M005', productId: 'I040', quantity: 200, unit: 'g' }, // 白米
      { id: 'R003', menuId: 'M005', productId: 'I001', quantity: 80, unit: 'g' }, // マグロ
      { id: 'R004', menuId: 'M005', productId: 'I003', quantity: 40, unit: 'g' }, // サーモン
      // シーザーサラダ (M004)
      { id: 'R010', menuId: 'M004', usedWipItemId: 'W001', quantity: 100, unit: 'g' }, // サラダミックス
      { id: 'R011', menuId: 'M004', usedWipItemId: 'W004', quantity: 20, unit: 'ml' }, // 特製ドレッシング
      // 特製唐揚げ (M003)
      { id: 'R020', menuId: 'M003', usedWipItemId: 'W002', quantity: 150, unit: 'g' }, // 唐揚げ下味付け肉
      // 枝豆 (M007)
      { id: 'R030', menuId: 'M007', productId: 'I024', quantity: 150, unit: 'g' },

      // 仕掛品のレシピ
      // W001: サラダミックス
      { id: 'R110', wipItemId: 'W001', productId: 'I020', quantity: 500, unit: 'g' }, // レタス
      { id: 'R111', wipItemId: 'W001', productId: 'I021', quantity: 300, unit: 'g' }, // トマト
      { id: 'R112', wipItemId: 'W001', productId: 'I022', quantity: 200, unit: 'g' }, // きゅうり
      // W002: 唐揚げ下味付け肉
      { id: 'R120', wipItemId: 'W002', productId: 'I010', quantity: 1000, unit: 'g' }, // 鶏もも肉
      { id: 'R121', wipItemId: 'W002', productId: 'I030', quantity: 50, unit: 'ml' }, // 醤油
      { id: 'R122', wipItemId: 'W002', productId: 'I032', quantity: 30, unit: 'ml' }, // 酒
      { id: 'R123', wipItemId: 'W002', productId: 'I034', quantity: 10, unit: 'g' }, // 塩
      // W003: カレールー（特製）
      { id: 'R130', wipItemId: 'W003', productId: 'I031', quantity: 50, unit: 'ml' }, // みりん
      { id: 'R131', wipItemId: 'W003', productId: 'I030', quantity: 30, unit: 'ml' }, // 醤油
      { id: 'R132', wipItemId: 'W003', productId: 'I033', quantity: 20, unit: 'ml' }, // ごま油
      // W004: 特製和風ドレッシング
      { id: 'R140', wipItemId: 'W004', productId: 'I030', quantity: 100, unit: 'ml' }, // 醤油
      { id: 'R141', wipItemId: 'W004', productId: 'I032', quantity: 30, unit: 'ml' }, // 酒
      { id: 'R142', wipItemId: 'W004', productId: 'I033', quantity: 50, unit: 'ml' }, // ごま油
      // W005: 照り焼きソース
      { id: 'R150', wipItemId: 'W005', productId: 'I030', quantity: 150, unit: 'ml' }, // 醤油
      { id: 'R151', wipItemId: 'W005', productId: 'I031', quantity: 100, unit: 'ml' }, // みりん
      { id: 'R152', wipItemId: 'W005', productId: 'I032', quantity: 50, unit: 'ml' }, // 酒
    ]);
    console.log('✅ レシピデータ作成');

    // 8. 在庫（3店舗 + セントラルキッチン + 倉庫）
    await db.insert(inventory).values([
      // 店舗A（渋谷店）
      { id: 'INV_A01', storeId: 'S001', productId: 'I001', quantity: 450 }, // マグロ - 低在庫
      { id: 'INV_A02', storeId: 'S001', productId: 'I002', quantity: 800 }, // 鯛
      { id: 'INV_A03', storeId: 'S001', productId: 'I003', quantity: 1200 }, // サーモン
      { id: 'INV_A04', storeId: 'S001', productId: 'I010', quantity: 3500 }, // 鶏もも肉
      { id: 'INV_A05', storeId: 'S001', productId: 'I020', quantity: 1800 }, // レタス
      { id: 'INV_A06', storeId: 'S001', productId: 'I021', quantity: 950 }, // トマト
      { id: 'INV_A07', storeId: 'S001', productId: 'I022', quantity: 700 }, // きゅうり
      { id: 'INV_A08', storeId: 'S001', productId: 'I023', quantity: 3200 }, // キャベツ
      { id: 'INV_A09', storeId: 'S001', productId: 'I024', quantity: 2100 }, // 枝豆
      { id: 'INV_A10', storeId: 'S001', productId: 'I030', quantity: 8500 }, // 醤油
      { id: 'INV_A11', storeId: 'S001', productId: 'I040', quantity: 15000 }, // 白米
      { id: 'INV_A12', storeId: 'S001', productId: 'I050', quantity: 45 }, // ビール樽 - 低在庫
      { id: 'INV_A13', storeId: 'S001', productId: 'I051', quantity: 3500 }, // ウイスキー
      { id: 'INV_A14', storeId: 'S001', productId: 'I052', quantity: 4200 }, // 日本酒

      // 店舗B（新宿店）
      { id: 'INV_B01', storeId: 'S002', productId: 'I001', quantity: 800 }, // マグロ
      { id: 'INV_B02', storeId: 'S002', productId: 'I002', quantity: 650 }, // 鯛
      { id: 'INV_B03', storeId: 'S002', productId: 'I003', quantity: 1100 }, // サーモン
      { id: 'INV_B04', storeId: 'S002', productId: 'I010', quantity: 2800 }, // 鶏もも肉
      { id: 'INV_B05', storeId: 'S002', productId: 'I020', quantity: 850 }, // レタス
      { id: 'INV_B06', storeId: 'S002', productId: 'I021', quantity: 1100 }, // トマト
      { id: 'INV_B07', storeId: 'S002', productId: 'I040', quantity: 18000 }, // 白米
      { id: 'INV_B08', storeId: 'S002', productId: 'I050', quantity: 65 }, // ビール樽
      { id: 'INV_B09', storeId: 'S002', productId: 'I051', quantity: 2800 }, // ウイスキー

      // 店舗C（池袋店）
      { id: 'INV_C01', storeId: 'S003', productId: 'I001', quantity: 700 }, // マグロ
      { id: 'INV_C02', storeId: 'S003', productId: 'I003', quantity: 900 }, // サーモン
      { id: 'INV_C03', storeId: 'S003', productId: 'I010', quantity: 1800 }, // 鶏もも肉 - 低在庫
      { id: 'INV_C04', storeId: 'S003', productId: 'I020', quantity: 950 }, // レタス
      { id: 'INV_C05', storeId: 'S003', productId: 'I021', quantity: 720 }, // トマト
      { id: 'INV_C06', storeId: 'S003', productId: 'I040', quantity: 12000 }, // 白米
      { id: 'INV_C07', storeId: 'S003', productId: 'I050', quantity: 55 }, // ビール樽
      { id: 'INV_C08', storeId: 'S003', productId: 'I052', quantity: 3200 }, // 日本酒

      // セントラルキッチン（仕掛品在庫）
      { id: 'INV_K01', storeId: 'K001', productId: 'I001', quantity: 8000 }, // マグロ（原料）
      { id: 'INV_K02', storeId: 'K001', productId: 'I010', quantity: 15000 }, // 鶏もも肉
      { id: 'INV_K03', storeId: 'K001', productId: 'I020', quantity: 5000 }, // レタス
      { id: 'INV_K04', storeId: 'K001', productId: 'I030', quantity: 12000 }, // 醤油

      // 倉庫（大量保管）
      { id: 'INV_W01', storeId: 'W001', productId: 'I001', quantity: 20000 }, // マグロ
      { id: 'INV_W02', storeId: 'W001', productId: 'I010', quantity: 25000 }, // 鶏もも肉
      { id: 'INV_W03', storeId: 'W001', productId: 'I040', quantity: 100000 }, // 白米
      { id: 'INV_W04', storeId: 'W001', productId: 'I050', quantity: 500 }, // ビール樽
      { id: 'INV_W05', storeId: 'W001', productId: 'I030', quantity: 30000 }, // 醤油
    ]);
    console.log('✅ 在庫データ作成');

    // 9. 売上データ（本日分 - 3店舗）
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(sales).values([
      // 本日の売上（店舗A - 渋谷店）
      {
        id: 'SALE_A01',
        storeId: 'S001',
        menuId: 'M001',
        quantity: 15,
        amount: 19200,
        saleDate: today,
      },
      {
        id: 'SALE_A02',
        storeId: 'S001',
        menuId: 'M003',
        quantity: 22,
        amount: 14960,
        saleDate: today,
      },
      {
        id: 'SALE_A03',
        storeId: 'S001',
        menuId: 'M004',
        quantity: 12,
        amount: 6960,
        saleDate: today,
      },
      {
        id: 'SALE_A04',
        storeId: 'S001',
        menuId: 'M005',
        quantity: 18,
        amount: 17640,
        saleDate: today,
      },
      {
        id: 'SALE_A05',
        storeId: 'S001',
        menuId: 'M007',
        quantity: 25,
        amount: 9500,
        saleDate: today,
      },
      {
        id: 'SALE_A06',
        storeId: 'S001',
        menuId: 'M008',
        quantity: 45,
        amount: 26100,
        saleDate: today,
      },
      {
        id: 'SALE_A07',
        storeId: 'S001',
        menuId: 'M009',
        quantity: 38,
        amount: 18240,
        saleDate: today,
      },
      {
        id: 'SALE_A08',
        storeId: 'S001',
        menuId: 'M010',
        quantity: 12,
        amount: 6960,
        saleDate: today,
      },

      // 本日の売上（店舗B - 新宿店）
      {
        id: 'SALE_B01',
        storeId: 'S002',
        menuId: 'M001',
        quantity: 20,
        amount: 25600,
        saleDate: today,
      },
      {
        id: 'SALE_B02',
        storeId: 'S002',
        menuId: 'M003',
        quantity: 28,
        amount: 19040,
        saleDate: today,
      },
      {
        id: 'SALE_B03',
        storeId: 'S002',
        menuId: 'M005',
        quantity: 16,
        amount: 15680,
        saleDate: today,
      },
      {
        id: 'SALE_B04',
        storeId: 'S002',
        menuId: 'M008',
        quantity: 55,
        amount: 31900,
        saleDate: today,
      },
      {
        id: 'SALE_B05',
        storeId: 'S002',
        menuId: 'M009',
        quantity: 42,
        amount: 20160,
        saleDate: today,
      },
      {
        id: 'SALE_B06',
        storeId: 'S002',
        menuId: 'M010',
        quantity: 18,
        amount: 10440,
        saleDate: today,
      },

      // 本日の売上（店舗C - 池袋店）
      {
        id: 'SALE_C01',
        storeId: 'S003',
        menuId: 'M001',
        quantity: 10,
        amount: 12800,
        saleDate: today,
      },
      {
        id: 'SALE_C02',
        storeId: 'S003',
        menuId: 'M003',
        quantity: 18,
        amount: 12240,
        saleDate: today,
      },
      {
        id: 'SALE_C03',
        storeId: 'S003',
        menuId: 'M004',
        quantity: 8,
        amount: 4640,
        saleDate: today,
      },
      {
        id: 'SALE_C04',
        storeId: 'S003',
        menuId: 'M008',
        quantity: 32,
        amount: 18560,
        saleDate: today,
      },
      {
        id: 'SALE_C05',
        storeId: 'S003',
        menuId: 'M009',
        quantity: 25,
        amount: 12000,
        saleDate: today,
      },

      // 昨日の売上（参考）
      {
        id: 'SALE_A_Y1',
        storeId: 'S001',
        menuId: 'M001',
        quantity: 12,
        amount: 15360,
        saleDate: yesterday,
      },
      {
        id: 'SALE_A_Y2',
        storeId: 'S001',
        menuId: 'M008',
        quantity: 38,
        amount: 22040,
        saleDate: yesterday,
      },
      {
        id: 'SALE_B_Y1',
        storeId: 'S002',
        menuId: 'M003',
        quantity: 25,
        amount: 17000,
        saleDate: yesterday,
      },
    ]);
    console.log('✅ 売上データ作成');

    // 10. 仕入データ（今月分）
    await db.insert(purchases).values([
      {
        id: 'PUR_A01',
        storeId: 'S001',
        productId: 'I001',
        quantity: 2000,
        unitPrice: 12,
        totalAmount: 24000,
        purchaseDate: today,
      },
      {
        id: 'PUR_A02',
        storeId: 'S001',
        productId: 'I010',
        quantity: 5000,
        unitPrice: 2.5,
        totalAmount: 12500,
        purchaseDate: today,
      },
      {
        id: 'PUR_B01',
        storeId: 'S002',
        productId: 'I040',
        quantity: 30000,
        unitPrice: 0.5,
        totalAmount: 15000,
        purchaseDate: yesterday,
      },
      {
        id: 'PUR_C01',
        storeId: 'S003',
        productId: 'I050',
        quantity: 100,
        unitPrice: 800,
        totalAmount: 80000,
        purchaseDate: today,
      },
      {
        id: 'PUR_W01',
        storeId: 'W001',
        productId: 'I001',
        quantity: 50000,
        unitPrice: 11.5,
        totalAmount: 575000,
        purchaseDate: yesterday,
      },
    ]);
    console.log('✅ 仕入データ作成');

    // 11. 廃棄データ
    await db.insert(waste).values([
      {
        id: 'WASTE_A01',
        storeId: 'S001',
        productId: 'I021',
        quantity: 150,
        reason: '腐敗',
        wasteDate: yesterday,
        recordedBy: 'EMP101',
      },
      {
        id: 'WASTE_B01',
        storeId: 'S002',
        productId: 'I020',
        quantity: 200,
        reason: '品質不良',
        wasteDate: yesterday,
        recordedBy: 'EMP201',
      },
      {
        id: 'WASTE_C01',
        storeId: 'S003',
        productId: 'I022',
        quantity: 80,
        reason: '賞味期限切れ',
        wasteDate: yesterday,
        recordedBy: 'EMP301',
      },
    ]);
    console.log('✅ 廃棄データ作成');

    console.log('\n🎉 居酒屋風在庫管理システムのサンプルデータ投入完了！');
    console.log('📊 データサマリー:');
    console.log('  - 従業員: 20名（店舗A:5名、店舗B:6名、店舗C:5名、CK:3名、管理者:1名）');
    console.log('  - 店舗: 5拠点（店舗A/B/C、セントラルキッチン、倉庫）');
    console.log('  - メニュー: 10品目');
    console.log('  - 材料: 20品目');
    console.log(
      '  - 仕掛品: 5品目（サラダミックス、唐揚げ下味付け肉、カレールー、特製ドレッシング、照り焼きソース）'
    );
    console.log('  - 在庫アイテム: 45箇所（店舗A:14、店舗B:9、店舗C:8、CK:4、倉庫:5、仕掛品5）');
    console.log('  - 売上データ: 24件（本日21件、昨日3件）');
    console.log('  - 低在庫アラート: 店舗A2件、店舗C1件');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
