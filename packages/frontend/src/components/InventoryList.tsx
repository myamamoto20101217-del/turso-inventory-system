import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface InventoryItem {
  id: string;
  storeName: string;
  productName: string;
  quantity: number;
  unit: string;
  minStock: number;
  isLowStock: boolean;
}

export default function InventoryList() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getInventory();
      setInventory(response.data);
      setError('');
    } catch (err: any) {
      setError('在庫データの取得に失敗しました');
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="inventory-list">
      <div className="header">
        <h2>在庫一覧</h2>
        <button onClick={fetchInventory} className="btn btn-secondary">
          更新
        </button>
      </div>

      <div className="stats">
        <div className="stat-card">
          <span className="stat-label">総アイテム数</span>
          <span className="stat-value">{inventory.length}</span>
        </div>
        <div className="stat-card alert">
          <span className="stat-label">低在庫アラート</span>
          <span className="stat-value">{inventory.filter((item) => item.isLowStock).length}</span>
        </div>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>店舗</th>
            <th>商品名</th>
            <th>在庫数</th>
            <th>最小在庫</th>
            <th>状態</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.id} className={item.isLowStock ? 'low-stock' : ''}>
              <td>{item.storeName}</td>
              <td>{item.productName}</td>
              <td>
                {item.quantity} {item.unit}
              </td>
              <td>
                {item.minStock} {item.unit}
              </td>
              <td>
                {item.isLowStock ? (
                  <span className="badge badge-warning">⚠️ 低在庫</span>
                ) : (
                  <span className="badge badge-success">✓ 正常</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
