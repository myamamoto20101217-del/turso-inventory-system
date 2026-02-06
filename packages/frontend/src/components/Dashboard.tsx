import { useState } from 'react';
import { logout } from '../config/firebase';
import {
  MdInventory,
  MdMenuBook,
  MdBarChart,
  MdShoppingCart,
  MdDelete,
  MdChecklist,
  MdShoppingBag,
} from 'react-icons/md';
import { IoLogOut } from 'react-icons/io5';
import InventoryList from './InventoryList';
import RecipeList from './RecipeList';
import SalesAnalytics from './SalesAnalytics';
import PurchaseList from './PurchaseList';
import WasteList from './WasteList';
import StocktakingList from './StocktakingList';
import OrderList from './OrderList';

type TabType = 'inventory' | 'recipes' | 'sales' | 'purchases' | 'waste' | 'stocktaking' | 'orders';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('inventory');

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const tabs = [
    { id: 'inventory' as TabType, label: '在庫管理', icon: MdInventory },
    { id: 'recipes' as TabType, label: 'レシピ', icon: MdMenuBook },
    { id: 'sales' as TabType, label: '売上分析', icon: MdBarChart },
    { id: 'purchases' as TabType, label: '仕入れ', icon: MdShoppingCart },
    { id: 'waste' as TabType, label: '廃棄', icon: MdDelete },
    { id: 'stocktaking' as TabType, label: '棚卸', icon: MdChecklist },
    { id: 'orders' as TabType, label: '発注', icon: MdShoppingBag },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>
          <MdInventory className="header-icon" /> 在庫管理システム
        </h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          <IoLogOut style={{ marginRight: '0.5rem' }} />
          ログアウト
        </button>
      </header>

      <div className="tab-navigation">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent className="tab-icon" />
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        {activeTab === 'inventory' && <InventoryList />}
        {activeTab === 'recipes' && <RecipeList />}
        {activeTab === 'sales' && <SalesAnalytics />}
        {activeTab === 'purchases' && <PurchaseList />}
        {activeTab === 'waste' && <WasteList />}
        {activeTab === 'stocktaking' && <StocktakingList />}
        {activeTab === 'orders' && <OrderList />}
      </div>
    </div>
  );
}
