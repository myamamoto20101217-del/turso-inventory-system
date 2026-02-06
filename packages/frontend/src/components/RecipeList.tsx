import { useState, useEffect } from 'react';
import {
  MdAdd,
  MdRefresh,
  MdDelete,
  MdRestaurantMenu,
  MdExpandMore,
  MdChevronRight,
  MdDragIndicator,
  MdInventory,
} from 'react-icons/md';
import { apiClient } from '../api/client';

interface Recipe {
  id: string;
  menuId: string | null;
  menuName: string | null;
  productId: string | null;
  productName: string | null;
  wipItemId: string | null;
  wipItemName: string | null;
  usedWipItemId: string | null;
  quantity: number;
  unit: string;
}

interface Menu {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  categoryName: string;
  unit: string;
}

interface WipItem {
  id: string;
  name: string;
  categoryName: string;
  unit: string;
}

interface RecipeIngredient {
  productId?: string;
  usedWipItemId?: string;
  quantity: number;
  unit: string;
  name?: string;
}

type TabType = 'product-recipes' | 'wip-items' | 'wip-recipes';

export default function RecipeList() {
  const [activeTab, setActiveTab] = useState<TabType>('product-recipes');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [wipItems, setWipItems] = useState<WipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // レシピ作成モーダル
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isWipRecipe, setIsWipRecipe] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [selectedWipItemId, setSelectedWipItemId] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recipesRes, menusRes, productsRes, wipItemsRes] = await Promise.all([
        apiClient.get('/api/recipes'),
        apiClient.get('/api/menus'),
        apiClient.get('/api/products'),
        apiClient.get('/api/wip-items'),
      ]);
      const fetchedRecipes = recipesRes.data.data;
      setRecipes(fetchedRecipes);
      setMenus(menusRes.data.data.filter((m: Menu) => m.isActive));
      setProducts(productsRes.data.data);
      setWipItems(wipItemsRes.data.data);

      // デフォルトで最初のメニューを展開
      if (fetchedRecipes.length > 0 && fetchedRecipes[0].menuName) {
        setExpandedMenus(new Set([fetchedRecipes[0].menuName]));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.menuName &&
      (recipe.menuName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.productName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // メニューごとにグループ化（仕掛品レシピは除外）
  const groupedRecipes = filteredRecipes.reduce(
    (acc, recipe) => {
      if (!recipe.menuName) return acc; // 仕掛品レシピは除外
      const menuName = recipe.menuName;
      if (!acc[menuName]) {
        acc[menuName] = [];
      }
      acc[menuName].push(recipe);
      return acc;
    },
    {} as Record<string, Recipe[]>
  );

  const toggleMenu = (menuName: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuName)) {
      newExpanded.delete(menuName);
    } else {
      newExpanded.add(menuName);
    }
    setExpandedMenus(newExpanded);
  };

  const openCreateModal = (isWip: boolean) => {
    setIsWipRecipe(isWip);
    setIngredients([]);
    setSelectedMenuId('');
    setSelectedWipItemId('');
    setShowCreateModal(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const isProduct = draggedId.startsWith('product-');
    const isWipItem = draggedId.startsWith('wip-');

    if (isProduct) {
      const productId = draggedId.replace('product-', '');
      const product = products.find((p) => p.id === productId);
      if (product && !ingredients.find((i) => i.productId === product.id)) {
        setIngredients([
          ...ingredients,
          {
            productId: product.id,
            quantity: 1,
            unit: product.unit,
            name: product.name,
          },
        ]);
      }
    } else if (isWipItem && isWipRecipe) {
      const wipId = draggedId.replace('wip-', '');
      const wip = wipItems.find((w) => w.id === wipId);
      if (wip && !ingredients.find((i) => i.usedWipItemId === wip.id)) {
        setIngredients([
          ...ingredients,
          {
            usedWipItemId: wip.id,
            quantity: 1,
            unit: wip.unit,
            name: wip.name,
          },
        ]);
      }
    }
  };

  const handleCreateRecipe = async () => {
    if (isWipRecipe) {
      if (!selectedWipItemId || ingredients.length === 0) {
        alert('仕掛品と材料を選択してください');
        return;
      }
      try {
        await apiClient.post('/api/recipes/wip', {
          wipItemId: selectedWipItemId,
          ingredients: ingredients.map((i) => ({
            productId: i.productId,
            usedWipItemId: i.usedWipItemId,
            quantity: i.quantity,
            unit: i.unit,
          })),
        });
        setShowCreateModal(false);
        fetchData();
      } catch (err) {
        console.error('Failed to create wip recipe:', err);
        alert('仕掛品レシピの作成に失敗しました');
      }
    } else {
      if (!selectedMenuId || ingredients.length === 0) {
        alert('メニューと材料を選択してください');
        return;
      }
      try {
        await apiClient.post('/api/recipes', {
          menuId: selectedMenuId,
          ingredients: ingredients.map((i) => ({
            productId: i.productId!,
            quantity: i.quantity,
            unit: i.unit,
          })),
        });
        setShowCreateModal(false);
        fetchData();
      } catch (err) {
        console.error('Failed to create recipe:', err);
        alert('レシピの作成に失敗しました');
      }
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('このレシピを削除しますか？')) return;

    try {
      await apiClient.delete(`/api/recipes/${recipeId}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      alert('レシピの削除に失敗しました');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updated = [...ingredients];
    updated[index].quantity = quantity;
    setIngredients(updated);
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="recipe-list">
      <div className="header">
        <h2>レシピ管理</h2>
        <button onClick={fetchData} className="btn btn-secondary">
          <MdRefresh size={18} /> 更新
        </button>
      </div>

      {/* タブナビゲーション */}
      <div className="recipe-tabs">
        <button
          className={`recipe-tab ${activeTab === 'product-recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('product-recipes')}
        >
          <MdRestaurantMenu size={18} />
          製品レシピ
        </button>
        <button
          className={`recipe-tab ${activeTab === 'wip-items' ? 'active' : ''}`}
          onClick={() => setActiveTab('wip-items')}
        >
          <MdInventory size={18} />
          仕掛品一覧
        </button>
        <button
          className={`recipe-tab ${activeTab === 'wip-recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('wip-recipes')}
        >
          <MdAdd size={18} />
          仕掛品レシピ作成
        </button>
      </div>

      {/* 製品レシピタブ */}
      {activeTab === 'product-recipes' && (
        <>
          <div className="tab-header">
            <input
              type="text"
              placeholder="メニュー・材料で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button onClick={() => openCreateModal(false)} className="btn btn-primary">
              <MdAdd size={18} /> レシピ作成
            </button>
          </div>

          <div className="recipe-groups">
            {Object.entries(groupedRecipes).length === 0 ? (
              <div className="empty-state">
                <MdRestaurantMenu size={48} style={{ opacity: 0.3 }} />
                <p>レシピが見つかりませんでした</p>
                <button onClick={() => openCreateModal(false)} className="btn btn-primary">
                  <MdAdd size={18} /> 最初のレシピを作成
                </button>
              </div>
            ) : (
              Object.entries(groupedRecipes).map(([menuName, menuRecipes]) => (
                <div key={menuName} className="recipe-card">
                  <div className="recipe-card-header" onClick={() => toggleMenu(menuName)}>
                    <div className="menu-info">
                      <button className="expand-button">
                        {expandedMenus.has(menuName) ? (
                          <MdExpandMore size={24} />
                        ) : (
                          <MdChevronRight size={24} />
                        )}
                      </button>
                      <MdRestaurantMenu size={20} />
                      <h3>{menuName}</h3>
                      <span className="ingredient-count">{menuRecipes.length}種類の材料</span>
                    </div>
                  </div>

                  {expandedMenus.has(menuName) && (
                    <div className="recipe-ingredients">
                      {menuRecipes.map((recipe) => (
                        <div key={recipe.id} className="ingredient-row">
                          <span className="ingredient-name">
                            {recipe.productName || recipe.wipItemName || '(材料名不明)'}
                          </span>
                          <span className="ingredient-quantity">
                            {recipe.quantity} {recipe.unit}
                          </span>
                          <button
                            onClick={() => handleDeleteRecipe(recipe.id)}
                            className="btn-icon-delete"
                            title="削除"
                          >
                            <MdDelete size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* 仕掛品一覧タブ */}
      {activeTab === 'wip-items' && (
        <div className="wip-items-grid">
          {wipItems.length === 0 ? (
            <div className="empty-state">
              <MdInventory size={48} style={{ opacity: 0.3 }} />
              <p>仕掛品が登録されていません</p>
            </div>
          ) : (
            wipItems.map((wip) => (
              <div key={wip.id} className="wip-item-card">
                <MdInventory size={32} style={{ color: 'var(--primary)' }} />
                <h4>{wip.name}</h4>
                <span className="wip-category">{wip.categoryName}</span>
                <span className="wip-unit">単位: {wip.unit}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* 仕掛品レシピ作成タブ */}
      {activeTab === 'wip-recipes' && (
        <div className="wip-recipe-creator">
          <button onClick={() => openCreateModal(true)} className="btn btn-primary btn-large">
            <MdAdd size={24} /> 仕掛品レシピを作成
          </button>
          <p className="help-text">
            仕掛品を選択して、材料をドラッグアンドドロップでレシピを作成できます
          </p>
        </div>
      )}

      {/* レシピ作成モーダル（ドラッグアンドドロップ対応） */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h3>{isWipRecipe ? '仕掛品レシピ作成' : 'レシピ作成'}</h3>

            <div className="recipe-creator-layout">
              {/* 左側: 材料リスト */}
              <div className="ingredients-panel">
                <h4>
                  <MdDragIndicator size={18} /> 材料をドラッグ
                </h4>
                <div className="draggable-items">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="draggable-item"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', `product-${product.id}`);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                    >
                      <MdDragIndicator size={18} />
                      <span className="name">{product.name}</span>
                      <span className="unit">{product.unit}</span>
                    </div>
                  ))}
                  {isWipRecipe &&
                    wipItems.map((wip) => (
                      <div
                        key={wip.id}
                        className="draggable-item wip"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', `wip-${wip.id}`);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                      >
                        <MdDragIndicator size={18} />
                        <span className="name">{wip.name}</span>
                        <span className="unit">{wip.unit}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* 右側: レシピエリア */}
              <div className="recipe-panel">
                <div className="form-group">
                  <label>{isWipRecipe ? '仕掛品' : 'メニュー'}</label>
                  {isWipRecipe ? (
                    <select
                      value={selectedWipItemId}
                      onChange={(e) => setSelectedWipItemId(e.target.value)}
                      className="form-select"
                    >
                      <option value="">仕掛品を選択</option>
                      {wipItems.map((wip) => (
                        <option key={wip.id} value={wip.id}>
                          {wip.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedMenuId}
                      onChange={(e) => setSelectedMenuId(e.target.value)}
                      className="form-select"
                    >
                      <option value="">メニューを選択</option>
                      {menus.map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name} ({menu.categoryName}) - ¥{menu.price}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div
                  className={`drop-zone ${ingredients.length === 0 ? 'empty' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {ingredients.length === 0 ? (
                    <p>
                      <MdDragIndicator size={24} style={{ opacity: 0.3 }} />
                      <br />
                      材料をここにドロップ
                    </p>
                  ) : (
                    ingredients.map((ingredient, index) => (
                      <div key={index} className="dropped-ingredient">
                        <span className="ingredient-name">{ingredient.name}</span>
                        <input
                          type="number"
                          value={ingredient.quantity}
                          onChange={(e) =>
                            updateIngredientQuantity(index, parseFloat(e.target.value))
                          }
                          className="quantity-input"
                          min="0"
                          step="0.1"
                        />
                        <span className="unit">{ingredient.unit}</span>
                        <button onClick={() => removeIngredient(index)} className="btn-icon-delete">
                          <MdDelete size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="modal-actions">
                  <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                    キャンセル
                  </button>
                  <button
                    onClick={handleCreateRecipe}
                    className="btn btn-primary"
                    disabled={ingredients.length === 0}
                  >
                    作成
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
