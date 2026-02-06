import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDbClient } from '../db/client';
import { products, categories } from '../db/schema';
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
 * 商品一覧取得
 * GET /api/products
 */
app.get('/', authMiddleware, async (c) => {
  const categoryId = c.req.query('categoryId');
  const db = createDbClient(c.env);

  try {
    const productList = await db
      .select({
        id: products.id,
        name: products.name,
        janCode: products.janCode,
        categoryId: products.categoryId,
        categoryName: categories.name,
        unit: products.unit,
        unitPrice: products.unitPrice,
        minStock: products.minStock,
        isActive: products.isActive,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(categoryId ? eq(products.categoryId, categoryId) : undefined)
      .orderBy(products.name);

    return c.json({
      success: true,
      data: productList,
      count: productList.length,
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

/**
 * 商品詳細取得
 * GET /api/products/:id
 */
app.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const db = createDbClient(c.env);

  try {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (result.length === 0) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

export default app;
