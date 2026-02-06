import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Purchase {
  id: string;
  storeName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  purchaseDate: string;
  supplierId: string | null;
}

interface PurchaseSummary {
  totalAmount: number;
  purchaseCount: number;
  averagePurchase: number;
}

export default function PurchaseList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<PurchaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purchasesRes, summaryRes] = await Promise.all([
        apiClient.get('/api/purchases', { params: dateRange }),
        apiClient.get('/api/purchases/summary', { params: dateRange }),
      ]);
      setPurchases(purchasesRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="purchase-list">
      <div className="list-header">
        <h2>📦 仕入れ管理</h2>
        <div className="date-filters">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
          <span>〜</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </div>
      </div>

      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <span className="label">仕入総額</span>
            <span className="value">¥{summary.totalAmount.toLocaleString()}</span>
          </div>
          <div className="summary-card">
            <span className="label">仕入回数</span>
            <span className="value">{summary.purchaseCount}回</span>
          </div>
          <div className="summary-card">
            <span className="label">平均仕入額</span>
            <span className="value">¥{Math.round(summary.averagePurchase).toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>日付</th>
              <th>店舗</th>
              <th>商品名</th>
              <th>数量</th>
              <th>単価</th>
              <th>合計金額</th>
              <th>仕入先</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td>{new Date(purchase.purchaseDate).toLocaleDateString('ja-JP')}</td>
                <td>{purchase.storeName}</td>
                <td>{purchase.productName}</td>
                <td>{purchase.quantity.toLocaleString()}</td>
                <td>¥{purchase.unitPrice.toLocaleString()}</td>
                <td className="amount">¥{purchase.totalAmount.toLocaleString()}</td>
                <td>{purchase.supplierId || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {purchases.length === 0 && (
          <div className="empty-state">該当期間の仕入れデータがありません</div>
        )}
      </div>
    </div>
  );
}
