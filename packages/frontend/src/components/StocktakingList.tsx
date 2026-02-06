import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Store {
  id: string;
  name: string;
}

interface Stocktaking {
  id: string;
  storeId: string;
  stocktakingDate: number;
  status: 'DRAFT' | 'CONFIRMED';
  employeeId: string;
  confirmedAt?: number;
  notes?: string;
  createdAt: number;
}

interface StocktakingDetail {
  id: string;
  productId?: string;
  productName?: string;
  wipItemId?: string;
  wipItemName?: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  unit: string;
  notes?: string;
}

interface StocktakingWithDetails {
  stocktaking: Stocktaking;
  details: StocktakingDetail[];
}

export default function StocktakingList() {
  const [stocktakings, setStocktakings] = useState<Stocktaking[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedStocktaking, setSelectedStocktaking] = useState<StocktakingWithDetails | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
    loadStocktakings();
  }, []);

  const loadStores = async () => {
    try {
      const response = await apiClient.get('/api/inventory/stores');
      setStores(response.data);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const loadStocktakings = async (storeId?: string) => {
    try {
      setLoading(true);
      const url = storeId ? `/api/stocktakings?storeId=${storeId}` : '/api/stocktakings';
      const response = await apiClient.get(url);
      setStocktakings(response.data);
    } catch (error) {
      console.error('Failed to load stocktakings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreChange = (storeId: string) => {
    setSelectedStore(storeId);
    loadStocktakings(storeId || undefined);
  };

  const handleCreateStocktaking = async () => {
    if (!selectedStore) {
      alert('店舗を選択してください');
      return;
    }

    try {
      await apiClient.post('/api/stocktakings', {
        storeId: selectedStore,
        employeeId: 'U001', // TODO: 実際のログインユーザーIDを使用
        autoGenerate: true, // 現在の在庫から自動生成
      });
      setShowCreateModal(false);
      loadStocktakings(selectedStore || undefined);
    } catch (error) {
      console.error('Failed to create stocktaking:', error);
      alert('棚卸の作成に失敗しました');
    }
  };

  const handleViewDetails = async (stocktakingId: string) => {
    try {
      const response = await apiClient.get(`/api/stocktakings/${stocktakingId}`);
      setSelectedStocktaking(response.data);
    } catch (error) {
      console.error('Failed to load stocktaking details:', error);
    }
  };

  const handleConfirmStocktaking = async (stocktakingId: string) => {
    if (!confirm('棚卸を確定しますか？確定後は在庫が調整され、変更できなくなります。')) {
      return;
    }

    try {
      await apiClient.post(`/api/stocktakings/${stocktakingId}/confirm`);
      alert('棚卸を確定しました');
      loadStocktakings(selectedStore || undefined);
      setSelectedStocktaking(null);
    } catch (error) {
      console.error('Failed to confirm stocktaking:', error);
      alert('棚卸の確定に失敗しました');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ja-JP');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: '下書き',
      CONFIRMED: '確定済',
    };
    const colors = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
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
        <h1 className="text-2xl font-bold">棚卸管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + 新規棚卸
        </button>
      </div>

      {/* フィルター */}
      <div className="mb-4">
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

      {/* 棚卸一覧 */}
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  棚卸ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  店舗ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  棚卸日
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
              {stocktakings.map((st) => (
                <tr key={st.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{st.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{st.storeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(st.stocktakingDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(st.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleViewDetails(st.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      詳細
                    </button>
                    {st.status === 'DRAFT' && (
                      <button
                        onClick={() => handleConfirmStocktaking(st.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        確定
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 新規作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">新規棚卸作成</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">店舗</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">選択してください</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              現在の在庫から自動的に棚卸明細が生成されます。
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateStocktaking}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedStocktaking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-3/4 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">棚卸詳細</h2>
            <div className="mb-4">
              <p>
                <strong>棚卸ID:</strong> {selectedStocktaking.stocktaking.id}
              </p>
              <p>
                <strong>店舗ID:</strong> {selectedStocktaking.stocktaking.storeId}
              </p>
              <p>
                <strong>棚卸日:</strong>{' '}
                {formatDate(selectedStocktaking.stocktaking.stocktakingDate)}
              </p>
              <p>
                <strong>ステータス:</strong>{' '}
                {getStatusBadge(selectedStocktaking.stocktaking.status)}
              </p>
            </div>

            <h3 className="font-bold mb-2">明細</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border">品目</th>
                    <th className="px-4 py-2 border">理論在庫</th>
                    <th className="px-4 py-2 border">実在庫</th>
                    <th className="px-4 py-2 border">差異</th>
                    <th className="px-4 py-2 border">単位</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStocktaking.details.map((detail) => (
                    <tr key={detail.id} className={detail.difference !== 0 ? 'bg-yellow-50' : ''}>
                      <td className="px-4 py-2 border">
                        {detail.productName || detail.wipItemName}
                      </td>
                      <td className="px-4 py-2 border text-right">{detail.systemQuantity}</td>
                      <td className="px-4 py-2 border text-right">{detail.actualQuantity}</td>
                      <td
                        className={`px-4 py-2 border text-right font-bold ${
                          detail.difference > 0
                            ? 'text-blue-600'
                            : detail.difference < 0
                              ? 'text-red-600'
                              : ''
                        }`}
                      >
                        {detail.difference > 0 ? '+' : ''}
                        {detail.difference}
                      </td>
                      <td className="px-4 py-2 border">{detail.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setSelectedStocktaking(null)}
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
