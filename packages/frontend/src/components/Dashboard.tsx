import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { logout } from '../config/firebase';
import InventoryList from './InventoryList';
import RecipeList from './RecipeList';
import SalesAnalytics from './SalesAnalytics';
import PurchaseList from './PurchaseList';
import WasteList from './WasteList';

interface SalesSummary {
  totalSales: number;
  totalQuantity: number;
  orderCount: number;
  averageOrderValue: number;
}

type TabType = 'inventory' | 'recipes' | 'sales' | 'purchases' | 'waste';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.getSalesSummary({
        startDate: today,
        endDate: today,
      });
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const tabs = [
    { id: 'inventory' as TabType, label: '📦 在庫管理', icon: '📦' },
    { id: 'recipes' as TabType, label: '📖 レシピ', icon: '📖' },
    { id: 'sales' as TabType, label: '📊 売上分析', icon: '📊' },
    { id: 'purchases' as TabType, label: '🛒 仕入れ', icon: '🛒' },
    { id: 'waste' as TabType, label: '🗑️ 廃棄', icon: '🗑️' },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>⚡ 在庫管理システム</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          ログアウト
        </button>
      </header>

      {!loading && summary && activeTab === 'inventory' && (
        <div className="dashboard-summary">
          <div className="summary-card">
            <span className="summary-label">本日の売上</span>
            <span className="summary-value">¥{summary.totalSales?.toLocaleString() || 0}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">注文件数</span>
            <span className="summary-value">{summary.orderCount || 0}件</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">平均客単価</span>
            <span className="summary-value">
              ¥{Math.round(summary.averageOrderValue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'inventory' && <InventoryList />}
        {activeTab === 'recipes' && <RecipeList />}
        {activeTab === 'sales' && <SalesAnalytics />}
        {activeTab === 'purchases' && <PurchaseList />}
        {activeTab === 'waste' && <WasteList />}
      </div>
    </div>
  );
}
