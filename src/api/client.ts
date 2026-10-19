import { Food, GeneratedRecipe, ConsumptionHistoryItem, ReceiptCandidate } from '../types';

const API_BASE = '/api';

export async function fetchFoods(): Promise<Food[]> {
  const res = await fetch(`${API_BASE}/foods`);
  if (!res.ok) throw new Error('食材一覧の取得に失敗しました');
  return res.json();
}

export async function addFood(foodData: Omit<Food, 'id'>): Promise<Food> {
  const res = await fetch(`${API_BASE}/foods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(foodData),
  });
  if (!res.ok) throw new Error('食材の追加に失敗しました');
  return res.json();
}

export async function updateFood(id: string, foodData: Partial<Food>): Promise<Food> {
  const res = await fetch(`${API_BASE}/foods/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(foodData),
  });
  if (!res.ok) throw new Error('食材の更新に失敗しました');
  return res.json();
}

export async function updateQuantity(id: string, delta: number): Promise<Food> {
  const res = await fetch(`${API_BASE}/foods/${id}/quantity`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) throw new Error('数量の変更に失敗しました');
  return res.json();
}

export async function deleteFood(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/foods/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('食材の削除に失敗しました');
}

export async function generateAIRecipes(params: {
  mood?: string;
  maxTime?: number;
  condition?: string;
  prioritizeExpiration?: boolean;
}): Promise<GeneratedRecipe[]> {
  const res = await fetch(`${API_BASE}/recipes/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'AIレシピの生成に失敗しました');
  }
  return res.json();
}

export async function consumeRecipeIngredients(
  recipeTitle: string,
  ingredientsToDeduct: Array<{ foodId?: string; foodName: string; quantity: number }>
): Promise<{ message: string; consumedItems: any[] }> {
  const res = await fetch(`${API_BASE}/recipes/consume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeTitle, ingredientsToDeduct }),
  });
  if (!res.ok) throw new Error('食材消費の処理に失敗しました');
  return res.json();
}

export async function fetchConsumptionHistory(): Promise<ConsumptionHistoryItem[]> {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error('消費履歴の取得に失敗しました');
  return res.json();
}

export async function scanReceiptImage(file?: File): Promise<ReceiptCandidate[]> {
  const formData = new FormData();
  if (file) {
    formData.append('receiptImage', file);
  }
  const res = await fetch(`${API_BASE}/receipt/scan`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('レシートの読み取りに失敗しました');
  const data = await res.json();
  return data.candidates;
}
