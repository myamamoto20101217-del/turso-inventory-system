import axios, { AxiosInstance } from 'axios';
import { getIdToken } from '../config/firebase';
import { API_BASE_URL } from '../config/env';

/**
 * APIクライアントの作成
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // リクエストインターセプター: IDトークンを自動付与
    this.client.interceptors.request.use(
      async (config) => {
        // 開発モードでは認証トークンを付与しない
        if (import.meta.env.DEV) {
          return config;
        }

        const token = await getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // レスポンスインターセプター: エラーハンドリング
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !import.meta.env.DEV) {
          // 未認証エラー → ログイン画面へリダイレクト
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 在庫一覧取得
   */
  async getInventory(storeId?: string) {
    const params = storeId ? { storeId } : {};
    const response = await this.client.get('/api/inventory', { params });
    return response.data;
  }

  /**
   * 在庫更新
   */
  async updateInventory(id: string, quantity: number) {
    const response = await this.client.put(`/api/inventory/${id}`, { quantity });
    return response.data;
  }

  /**
   * 在庫アラート一覧
   */
  async getInventoryAlerts() {
    const response = await this.client.get('/api/inventory/alerts/list');
    return response.data;
  }

  /**
   * 商品一覧取得
   */
  async getProducts(categoryId?: string) {
    const params = categoryId ? { categoryId } : {};
    const response = await this.client.get('/api/products', { params });
    return response.data;
  }

  /**
   * 売上データ取得
   */
  async getSales(params: { storeId?: string; startDate?: string; endDate?: string }) {
    const response = await this.client.get('/api/sales', { params });
    return response.data;
  }

  /**
   * 売上サマリー取得
   */
  async getSalesSummary(params: { storeId?: string; startDate?: string; endDate?: string }) {
    const response = await this.client.get('/api/sales/summary', { params });
    return response.data;
  }
}

export const apiClient = new ApiClient();
