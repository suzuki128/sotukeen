import React, { useState, useEffect } from 'react';
import { Food, GeneratedRecipe } from './types';
import {
  fetchFoods,
  addFood,
  updateFood,
  updateQuantity,
  deleteFood,
  generateAIRecipes,
  consumeRecipeIngredients
} from './api/client';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Fridge } from './components/Fridge';
import { RecipeGenerator } from './components/RecipeGenerator';
import { AddFoodModal } from './components/AddFoodModal';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { ConsumptionHistoryView } from './components/ConsumptionHistoryView';

export const App: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'fridge' | 'generator' | 'history'>('dashboard');

  // モーダル管理
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // AIレシピ管理
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<GeneratedRecipe | null>(null);
  const [presetMood, setPresetMood] = useState('');

  // 初回食材取得
  const loadFoods = async () => {
    try {
      const data = await fetchFoods();
      setFoods(data);
    } catch (err) {
      console.error('Failed to load foods:', err);
    }
  };

  useEffect(() => {
    loadFoods();
  }, []);

  // 数量増減
  const handleUpdateQuantity = async (id: string, delta: number) => {
    try {
      const updated = await updateQuantity(id, delta);
      setFoods(prev => prev.map(f => (f.id === id ? updated : f)));
    } catch (err) {
      console.error(err);
    }
  };

  // 食材削除
  const handleDeleteFood = async (id: string) => {
    try {
      await deleteFood(id);
      setFoods(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // 食材手動保存（新規 / 編集）
  const handleSaveFood = async (foodData: Omit<Food, 'id'>) => {
    try {
      if (editingFood) {
        const updated = await updateFood(editingFood.id, foodData);
        setFoods(prev => prev.map(f => (f.id === editingFood.id ? updated : f)));
      } else {
        const created = await addFood(foodData);
        setFoods(prev => [...prev, created]);
      }
      setEditingFood(null);
    } catch (err) {
      console.error(err);
    }
  };

  // レシートからの複数一括登録
  const handleAddBatchFoods = async (newFoods: Array<Omit<Food, 'id'>>) => {
    try {
      for (const item of newFoods) {
        await addFood(item);
      }
      await loadFoods();
    } catch (err) {
      console.error(err);
    }
  };

  // AIレシピ提案実行
  const handleGenerateRecipes = async (params: {
    mood?: string;
    maxTime?: number;
    condition?: string;
    prioritizeExpiration?: boolean;
  }) => {
    setIsGenerating(true);
    try {
      const generated = await generateAIRecipes(params);
      setRecipes(generated);
    } catch (err: any) {
      alert(err.message || 'AIレシピの生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  // ダッシュボードからのクイック気分選択
  const handleQuickGenerate = (mood: string) => {
    setPresetMood(mood);
    setCurrentTab('generator');
    handleGenerateRecipes({ mood, prioritizeExpiration: true });
  };

  // 「この料理を作った」で自動引き落とし
  const handleConsumeIngredients = async (
    recipeTitle: string,
    items: Array<{ foodId?: string; foodName: string; quantity: number }>
  ) => {
    await consumeRecipeIngredients(recipeTitle, items);
    await loadFoods(); // 残量最新化
  };

  return (
    <div>
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAddModal={() => { setEditingFood(null); setIsAddModalOpen(true); }}
        onOpenReceiptModal={() => setIsReceiptModalOpen(true)}
        foodCount={foods.filter(f => f.quantity > 0).length}
      />

      <main className="app-container">
        {currentTab === 'dashboard' && (
          <Dashboard
            foods={foods}
            onNavigateTab={setCurrentTab}
            onQuickGenerate={handleQuickGenerate}
            onOpenAddModal={() => { setEditingFood(null); setIsAddModalOpen(true); }}
          />
        )}

        {currentTab === 'fridge' && (
          <Fridge
            foods={foods}
            onUpdateQuantity={handleUpdateQuantity}
            onDeleteFood={handleDeleteFood}
            onEditFood={food => { setEditingFood(food); setIsAddModalOpen(true); }}
            onOpenAddModal={() => { setEditingFood(null); setIsAddModalOpen(true); }}
          />
        )}

        {currentTab === 'generator' && (
          <RecipeGenerator
            foods={foods}
            onGenerate={handleGenerateRecipes}
            recipes={recipes}
            isLoading={isGenerating}
            onSelectRecipe={setSelectedRecipe}
            presetMood={presetMood}
          />
        )}

        {currentTab === 'history' && (
          <ConsumptionHistoryView />
        )}
      </main>

      {/* 食材手動追加・編集モーダル */}
      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingFood(null); }}
        onSave={handleSaveFood}
        initialData={editingFood}
      />

      {/* レシート一括登録モーダル */}
      <ReceiptScannerModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onAddBatchFoods={handleAddBatchFoods}
      />

      {/* レシピ詳細 & 食材消費モーダル */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        foods={foods}
        onClose={() => setSelectedRecipe(null)}
        onConsumeIngredients={handleConsumeIngredients}
      />
    </div>
  );
};

export default App;
