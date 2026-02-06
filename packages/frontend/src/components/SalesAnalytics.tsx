import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface SalesData {
  id: string;
  storeName: string;
  menuName: string;
  quantity: number;
  amount: number;
  saleDate: string;
}

interface SalesSummary {
  totalSales: number;
  totalQuantity: number;
  orderCount: number;
  averageOrderValue: number;
}

export default function SalesAnalytics() {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, summaryRes] = await Promise.all([
        apiClient.getSales(dateRange),
        apiClient.getSalesSummary(dateRange),
      ]);
      setSales(salesRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 店舗別集計
  const storeSales = sales.reduce(
    (acc, sale) => {
      const store = sale.storeName || '不明';
      if (!acc[store]) {
        acc[store] = { amount: 0, count: 0 };
      }
      acc[store].amount += sale.amount;
      acc[store].count += sale.quantity;
      return acc;
    },
    {} as Record<string, { amount: number; count: number }>
  );

  // メニュー別集計（トップ5）
  const menuSales = sales.reduce(
    (acc, sale) => {
      const menu = sale.menuName || '不明';
      if (!acc[menu]) {
        acc[menu] = { amount: 0, count: 0 };
      }
      acc[menu].amount += sale.amount;
      acc[menu].count += sale.quantity;
      return acc;
    },
    {} as Record<string, { amount: number; count: number }>
  );

  const topMenus = Object.entries(menuSales)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5);

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="sales-analytics">
      <div className="analytics-header">
        <h2>📊 売上分析</h2>
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
            <span className="label">総売上</span>
            <span className="value">¥{(summary.totalSales || 0).toLocaleString()}</span>
          </div>
          <div className="summary-card">
            <span className="label">注文件数</span>
            <span className="value">{summary.orderCount || 0}件</span>
          </div>
          <div className="summary-card">
            <span className="label">平均客単価</span>
            <span className="value">
              ¥{Math.round(summary.averageOrderValue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="analytics-grid">
        <div className="analytics-section">
          <h3>店舗別売上</h3>
          <div className="store-list">
            {Object.entries(storeSales).map(([store, data]) => (
              <div key={store} className="store-item">
                <span className="store-name">{store}</span>
                <div className="store-stats">
                  <span className="amount">¥{data.amount.toLocaleString()}</span>
                  <span className="count">{data.count}個</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-section">
          <h3>人気メニューTOP5</h3>
          <div className="menu-ranking">
            {topMenus.map(([menu, data], index) => (
              <div key={menu} className="menu-rank-item">
                <span className="rank">#{index + 1}</span>
                <span className="menu-name">{menu}</span>
                <div className="menu-stats">
                  <span className="amount">¥{data.amount.toLocaleString()}</span>
                  <span className="count">{data.count}個</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
