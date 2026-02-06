import { useState, useEffect } from 'react';
import {
  MdAdd,
  MdRefresh,
  MdDelete,
  MdRestaurantMenu,
  MdExpandMore,
  MdChevronRight,
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

interface RecipeIngredient {
  productId: string;
  quantity: number;
  unit: string;
}

export default function RecipeList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // レシピ作成モーダル
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { productId: '', quantity: 0, unit: '' },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recipesRes, menusRes, productsRes] = await Promise.all([
        apiClient.get('/api/recipes'),
        apiClient.get('/api/menus'),
        apiClient.get('/api/products'),
      ]);
      const fetchedRecipes = recipesRes.data.data;
      setRecipes(fetchedRecipes);
      setMenus(menusRes.data.data.filter((m: Menu) => m.isActive));
      setProducts(productsRes.data.data);

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

  const handleCreateRecipe = async () => {
    if (!selectedMenuId || ingredients.some((i) => !i.productId || i.quantity <= 0)) {
      alert('メニューと材料を正しく選択してください');
      return;
    }

    try {
      await apiClient.post('/api/recipes', {
        menuId: selectedMenuId,
        ingredients,
      });
      setShowCreateModal(false);
      setSelectedMenuId('');
      setIngredients([{ productId: '', quantity: 0, unit: '' }]);
      fetchData();
    } catch (err) {
      console.error('Failed to create recipe:', err);
      alert('レシピの作成に失敗しました');
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

  const addIngredient = () => {
    setIngredients([...ingredients, { productId: '', quantity: 0, unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };

    // productIdが変更されたら、そのproductのunitを自動設定
    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].unit = product.unit;
      }
    }

    setIngredients(updated);
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="recipe-list">
      <div className="header">
        <h2>レシピ管理</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchData} className="btn btn-secondary">
            <MdRefresh size={18} /> 更新
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <MdAdd size={18} /> レシピ作成
          </button>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="メニュー・材料で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="recipe-groups">
        {Object.entries(groupedRecipes).length === 0 ? (
          <div className="empty-state">
            <MdRestaurantMenu size={48} style={{ opacity: 0.3 }} />
            <p>レシピが見つかりませんでした</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
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

      {/* レシピ作成モーダル */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>レシピ作成</h3>

            <div className="form-group">
              <label>メニュー</label>
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
            </div>

            <div className="form-group">
              <label>材料</label>
              {ingredients.map((ingredient, index) => (
                <div key={index} className="ingredient-input-row">
                  <select
                    value={ingredient.productId}
                    onChange={(e) => updateIngredient(index, 'productId', e.target.value)}
                    className="form-select"
                    style={{ flex: 2 }}
                  >
                    <option value="">材料を選択</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.categoryName})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={ingredient.quantity || ''}
                    onChange={(e) =>
                      updateIngredient(index, 'quantity', parseFloat(e.target.value))
                    }
                    placeholder="数量"
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    value={ingredient.unit}
                    readOnly
                    placeholder="単位"
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  {ingredients.length > 1 && (
                    <button onClick={() => removeIngredient(index)} className="btn-icon-delete">
                      <MdDelete size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addIngredient} className="btn btn-link">
                <MdAdd size={18} /> 材料を追加
              </button>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                キャンセル
              </button>
              <button onClick={handleCreateRecipe} className="btn btn-primary">
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
