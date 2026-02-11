import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import inventoryRoutes from './routes/inventory';
import productsRoutes from './routes/products';
import salesRoutes from './routes/sales';
import recipesRoutes from './routes/recipes';
import menusRoutes from './routes/menus';
import purchasesRoutes from './routes/purchases';
import wasteRoutes from './routes/waste';
import stocktakingsRoutes from './routes/stocktakings';
import ordersRoutes from './routes/orders';
import wipProductionsRoutes from './routes/wip-productions';
import wipItemsRoutes from './routes/wip-items';
import storesRoutes from './routes/stores';

// Cloudflare Pages環境変数の型定義
type Bindings = {
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
};

// 認証ユーザー情報の型
type Variables = {
  user: {
    uid: string;
    email: string | undefined;
    emailVerified: boolean;
  };
};

declare global {
  type CloudflareBindings = Bindings;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware
app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      // 許可するオリジンのパターン
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/,
        /^https:\/\/.*\.inventory-frontend-8of\.pages\.dev$/,
        /^https:\/\/inventory-frontend-8of\.pages\.dev$/,
      ];

      // いずれかのパターンにマッチすればオリジンを返す
      if (allowedPatterns.some((pattern) => pattern.test(origin))) {
        return origin;
      }
      return false;
    },
    credentials: true,
  })
);

// Health check
app.get('/', (c) => {
  return c.json({
    message: '🚀 爆速在庫管理API - Powered by Hono + Turso',
    version: '1.0.0',
    status: 'healthy',
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.route('/api/inventory', inventoryRoutes);
app.route('/api/products', productsRoutes);
app.route('/api/sales', salesRoutes);
app.route('/api/recipes', recipesRoutes);
app.route('/api/menus', menusRoutes);
app.route('/api/purchases', purchasesRoutes);
app.route('/api/waste', wasteRoutes);
app.route('/api/stores', storesRoutes);
app.route('/api/wip-items', wipItemsRoutes);
app.route('/api/stocktakings', stocktakingsRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/wip-productions', wipProductionsRoutes);

// 404 Handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error Handler
app.onError((err, c) => {
  console.error('Server Error:', err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;
