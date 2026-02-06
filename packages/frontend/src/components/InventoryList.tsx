import React, { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  MdExpandMore,
  MdChevronRight,
  MdRefresh,
  MdStore,
  MdWarning,
  MdCheckCircle,
} from 'react-icons/md';
import { apiClient } from '../api/client';

interface StoreInventory {
  id: string;
  storeId: string;
  storeName: string;
  quantity: number;
  isLowStock: boolean;
  updatedAt: string;
}

interface ProductInventory {
  productId: string;
  productName: string;
  categoryName: string;
  unit: string;
  minStock: number;
  totalQuantity: number;
  isLowStock: boolean;
  stores: StoreInventory[];
}

interface Store {
  id: string;
  name: string;
  type: string;
}

export default function InventoryList() {
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // フィルター状態
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedStore]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = selectedStore !== 'all' ? selectedStore : undefined;
      const [inventoryResponse, storesResponse] = await Promise.all([
        apiClient.getInventory(params),
        apiClient.getStores(),
      ]);
      setInventory(inventoryResponse.data);
      setStores(storesResponse);
      setError('');
    } catch (err: any) {
      setError('データの取得に失敗しました');
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // フィルター適用
  const filteredInventory = useMemo(() => {
    let result = [...inventory];
    if (showLowStockOnly) {
      result = result.filter((item) => item.isLowStock);
    }
    return result;
  }, [inventory, showLowStockOnly]);

  // テーブルカラム定義
  const columns = useMemo<ColumnDef<ProductInventory>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          return row.getCanExpand() ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="expand-button"
              style={{ cursor: 'pointer' }}
            >
              {row.getIsExpanded() ? <MdExpandMore size={20} /> : <MdChevronRight size={20} />}
            </button>
          ) : null;
        },
        size: 40,
      },
      {
        accessorKey: 'productName',
        header: '材料名',
        cell: (info) => <strong>{info.getValue() as string}</strong>,
      },
      {
        accessorKey: 'categoryName',
        header: 'カテゴリ',
        cell: (info) => (info.getValue() as string) || '-',
      },
      {
        accessorKey: 'totalQuantity',
        header: '合計在庫',
        cell: ({ row }) => (
          <strong>
            {row.original.totalQuantity} {row.original.unit}
          </strong>
        ),
      },
      {
        accessorKey: 'minStock',
        header: '最小在庫',
        cell: ({ row }) => `${row.original.minStock} ${row.original.unit}`,
      },
      {
        id: 'status',
        header: '状態',
        cell: ({ row }) =>
          row.original.isLowStock ? (
            <span className="badge badge-warning">
              <MdWarning size={16} /> 低在庫
            </span>
          ) : (
            <span className="badge badge-success">
              <MdCheckCircle size={16} /> 正常
            </span>
          ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredInventory,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowCanExpand: () => true,
    initialState: {
      sorting: [{ id: 'productName', desc: false }],
    },
  });

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const lowStockCount = inventory.filter((item) => item.isLowStock).length;
  const totalProducts = inventory.length;

  return (
    <div className="inventory-list">
      <div className="header">
        <h2>在庫一覧</h2>
        <button onClick={fetchData} className="btn btn-secondary">
          <MdRefresh size={18} /> 更新
        </button>
      </div>

      <div className="stats">
        <div className="stat-card">
          <span className="stat-label">総材料数</span>
          <span className="stat-value">{totalProducts}</span>
        </div>
        <div className="stat-card alert">
          <span className="stat-label">低在庫アラート</span>
          <span className="stat-value">{lowStockCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">表示中</span>
          <span className="stat-value">{filteredInventory.length}</span>
        </div>
      </div>

      {/* フィルターセクション */}
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="store-filter">
            <MdStore size={18} /> 店舗:
          </label>
          <select
            id="store-filter"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="filter-select"
          >
            <option value="all">すべての店舗</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
            />
            <span>
              <MdWarning size={18} /> 不足品のみ表示
            </span>
          </label>
        </div>

        {(selectedStore !== 'all' || showLowStockOnly) && (
          <button
            onClick={() => {
              setSelectedStore('all');
              setShowLowStockOnly(false);
            }}
            className="btn btn-link"
          >
            ✕ フィルターをクリア
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="inventory-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          cursor: header.column.getCanSort() ? 'pointer' : 'default',
                          userSelect: 'none',
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted() as string] ??
                          (header.column.getCanSort() ? ' ↕️' : '')}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-data">
                  該当するデータがありません
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  {/* 親行：材料の集計 */}
                  <tr
                    className={`product-row ${row.original.isLowStock ? 'low-stock' : ''} ${
                      row.getIsExpanded() ? 'expanded' : ''
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>

                  {/* 子行：店舗別の在庫詳細 */}
                  {row.getIsExpanded() &&
                    row.original.stores.map((store) => (
                      <tr key={store.id} className="store-detail-row">
                        <td></td>
                        <td colSpan={2} style={{ paddingLeft: '2rem' }}>
                          <MdStore size={16} style={{ marginRight: '0.5rem' }} />
                          {store.storeName}
                        </td>
                        <td>
                          {store.quantity} {row.original.unit}
                        </td>
                        <td>-</td>
                        <td>
                          {store.isLowStock ? (
                            <span className="badge badge-warning">
                              <MdWarning size={16} /> 低在庫
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              <MdCheckCircle size={16} /> 正常
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
