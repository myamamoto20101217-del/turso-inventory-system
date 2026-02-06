import { useState, useEffect } from 'react';
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

export default function RecipeList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/recipes');
      setRecipes(response.data.data);
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.menuName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.wipItemName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // メニューごとにグループ化
  const groupedRecipes = filteredRecipes.reduce(
    (acc, recipe) => {
      const menuName = recipe.menuName || '仕掛品レシピ';
      if (!acc[menuName]) {
        acc[menuName] = [];
      }
      acc[menuName].push(recipe);
      return acc;
    },
    {} as Record<string, Recipe[]>
  );

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="recipe-list">
      <div className="list-header">
        <h2>📖 レシピ管理</h2>
        <input
          type="text"
          placeholder="メニュー・材料で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="recipe-groups">
        {Object.entries(groupedRecipes).map(([menuName, menuRecipes]) => (
          <div key={menuName} className="recipe-group">
            <h3 className="menu-name">{menuName}</h3>
            <div className="recipe-items">
              {menuRecipes.map((recipe) => (
                <div key={recipe.id} className="recipe-item">
                  <span className="ingredient-name">
                    {recipe.productName || recipe.wipItemName}
                  </span>
                  <span className="quantity">
                    {recipe.quantity} {recipe.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="empty-state">レシピが見つかりませんでした</div>
      )}
    </div>
  );
}
