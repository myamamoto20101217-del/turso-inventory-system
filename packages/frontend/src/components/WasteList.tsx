import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Waste {
  id: string;
  storeName: string;
  productName: string;
  quantity: number;
  reason: string;
  wasteDate: string;
  recordedBy: string;
}

interface WasteSummary {
  totalQuantity: number;
  wasteCount: number;
  reasonCounts: Record<string, number>;
}

export default function WasteList() {
  const [wasteList, setWasteList] = useState<Waste[]>([]);
  const [summary, setSummary] = useState<WasteSummary | null>(null);
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
      const [wasteRes, summaryRes] = await Promise.all([
        apiClient.get('/api/waste', { params: dateRange }),
        apiClient.get('/api/waste/summary', { params: dateRange }),
      ]);
      setWasteList(wasteRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (err) {
      console.error('Failed to fetch waste data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="waste-list">
      <div className="list-header">
        <h2>🗑️ 廃棄管理</h2>
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
            <span className="label">廃棄総量</span>
            <span className="value">{summary.totalQuantity.toLocaleString()}</span>
          </div>
          <div className="summary-card">
            <span className="label">廃棄回数</span>
            <span className="value">{summary.wasteCount}回</span>
          </div>
          <div className="summary-card">
            <span className="label">主な理由</span>
            <span className="value">
              {Object.entries(summary.reasonCounts || {}).sort((a, b) => b[1] - a[1])[0]?.[0] ||
                '-'}
            </span>
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
              <th>理由</th>
              <th>記録者</th>
            </tr>
          </thead>
          <tbody>
            {wasteList.map((waste) => (
              <tr key={waste.id}>
                <td>{new Date(waste.wasteDate).toLocaleDateString('ja-JP')}</td>
                <td>{waste.storeName}</td>
                <td>{waste.productName}</td>
                <td>{waste.quantity.toLocaleString()}</td>
                <td>
                  <span className={`reason-badge ${waste.reason}`}>{waste.reason}</span>
                </td>
                <td>{waste.recordedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {wasteList.length === 0 && (
          <div className="empty-state">該当期間の廃棄データがありません</div>
        )}
      </div>

      {summary && summary.reasonCounts && (
        <div className="reason-chart">
          <h3>廃棄理由別集計</h3>
          <div className="reason-bars">
            {Object.entries(summary.reasonCounts).map(([reason, count]) => {
              const percentage = (count / summary.wasteCount) * 100;
              return (
                <div key={reason} className="reason-bar-item">
                  <span className="reason-label">{reason}</span>
                  <div className="bar-container">
                    <div className="bar" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span className="count">{count}回</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
