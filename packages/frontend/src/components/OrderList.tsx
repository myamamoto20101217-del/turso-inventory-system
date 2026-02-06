import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Store {
  id: string;
  name: string;
}

interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  supplierId?: string;
  orderDate: number;
  expectedDeliveryDate?: number;
  actualDeliveryDate?: number;
  status: 'DRAFT' | 'ORDERED' | 'DELIVERED' | 'CANCELLED';
  isAutoOrder: boolean;
  employeeId?: string;
  totalAmount: number;
  notes?: string;
}

interface OrderRecommendation {
  supplierId: string;
  items: Array<{
    productId: string;
    productName: string;
    currentQuantity: number;
    minStock: number;
    orderQuantity: number;
    unit: string;
    unitPrice: number;
    estimatedAmount: number;
  }>;
  totalAmount: number;
  itemCount: number;
}

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [recommendations, setRecommendations] = useState<OrderRecommendation[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
    loadOrders();
  }, []);

  const loadStores = async () => {
    try {
      const response = await apiClient.get('/api/inventory/stores');
      setStores(response.data);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const loadOrders = async (storeId?: string, status?: string) => {
    try {
      setLoading(true);
      let url = '/api/orders';
      const params = [];
      if (storeId) params.push(`storeId=${storeId}`);
      if (status) params.push(`status=${status}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await apiClient.get(url);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreChange = (storeId: string) => {
    setSelectedStore(storeId);
    loadOrders(storeId || undefined);
  };

  const loadRecommendations = async () => {
    if (!selectedStore) {
      alert('店舗を選択してください');
      return;
    }

    try {
      const response = await apiClient.get(`/api/orders/recommendations/${selectedStore}`);
      setRecommendations(response.data);
      setShowRecommendations(true);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      alert('推奨発注の取得に失敗しました');
    }
  };

  const createOrderFromRecommendation = async (rec: OrderRecommendation) => {
    if (!selectedStore) return;

    try {
      const items = rec.items.map((item) => ({
        productId: item.productId,
        quantity: item.orderQuantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
      }));

      await apiClient.post('/api/orders/from-recommendation', {
        storeId: selectedStore,
        supplierId: rec.supplierId,
        items,
        employeeId: 'U001', // TODO: 実際のログインユーザーIDを使用
      });

      alert('発注を作成しました');
      setShowRecommendations(false);
      loadOrders(selectedStore);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('発注の作成に失敗しました');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiClient.patch(`/api/orders/${orderId}/status`, { status });
      alert('ステータスを更新しました');
      loadOrders(selectedStore || undefined);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ja-JP');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: '下書き',
      ORDERED: '発注済',
      DELIVERED: '納品済',
      CANCELLED: 'キャンセル',
    };
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ORDERED: 'bg-blue-100 text-blue-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-sm ${colors[status as keyof typeof colors]}`}>
        {badges[status as keyof typeof badges]}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">発注管理</h1>
        <button
          onClick={loadRecommendations}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          🤖 自動発注推奨
        </button>
      </div>

      {/* フィルター */}
      <div className="mb-4 flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">店舗でフィルター</label>
          <select
            value={selectedStore}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="border rounded px-3 py-2 w-64"
          >
            <option value="">全店舗</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 発注一覧 */}
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  発注番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  店舗ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  仕入先ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  発注日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  合計金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{order.storeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{order.supplierId || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(order.orderDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                    ¥{order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {order.status === 'DRAFT' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ORDERED')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        発注確定
                      </button>
                    )}
                    {order.status === 'ORDERED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                        className="text-green-600 hover:text-green-800"
                      >
                        納品確認
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 推奨発注モーダル */}
      {showRecommendations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-3/4 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">🤖 自動発注推奨リスト</h2>
            <p className="text-sm text-gray-600 mb-4">
              最小在庫を下回っている材料の発注を提案します。仕入先ごとにグループ化されています。
            </p>

            {recommendations.length === 0 ? (
              <p className="text-center py-8 text-gray-500">現在、発注が必要な材料はありません。</p>
            ) : (
              recommendations.map((rec, idx) => (
                <div key={idx} className="mb-6 border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-bold">仕入先: {rec.supplierId}</h3>
                      <p className="text-sm text-gray-600">
                        {rec.itemCount}品目 / 合計: ¥{rec.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => createOrderFromRecommendation(rec)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      この仕入先で発注作成
                    </button>
                  </div>

                  <table className="min-w-full border text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 border">材料名</th>
                        <th className="px-3 py-2 border">現在在庫</th>
                        <th className="px-3 py-2 border">最小在庫</th>
                        <th className="px-3 py-2 border">発注量</th>
                        <th className="px-3 py-2 border">単価</th>
                        <th className="px-3 py-2 border">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.items.map((item, itemIdx) => (
                        <tr key={itemIdx}>
                          <td className="px-3 py-2 border">{item.productName}</td>
                          <td className="px-3 py-2 border text-right text-red-600">
                            {item.currentQuantity}
                            {item.unit}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {item.minStock}
                            {item.unit}
                          </td>
                          <td className="px-3 py-2 border text-right font-bold">
                            {item.orderQuantity}
                            {item.unit}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            ¥{item.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 border text-right font-bold">
                            ¥{item.estimatedAmount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowRecommendations(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
