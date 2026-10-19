export interface Food {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  purchase_date: string;
  expiration_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeneratedRecipe {
  id: string;
  title: string;
  description: string;
  cookingTime: number;
  difficulty: '簡単' | '普通' | '本格的';
  category: string;
  availableIngredients: Array<{ name: string; amount: string; quantityToDeduct: number; unit: string }>;
  missingIngredients: Array<{ name: string; amount: string }>;
  steps: string[];
  tips?: string;
  priorityUsedFoods?: string[];
}

export interface ConsumptionHistoryItem {
  id: string;
  food_id: string;
  food_name: string;
  quantity: number;
  unit: string;
  consumed_at: string;
}

export interface ReceiptCandidate {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  estimatedDays: number;
}
