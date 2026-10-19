import { GoogleGenAI } from '@google/genai';

export interface RecipeRequest {
  foods: Array<{ name: string; quantity: number; unit: string; expiration_date?: string }>;
  mood?: string;
  maxTime?: number;
  condition?: string;
  prioritizeExpiration?: boolean;
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

export async function generateRecipe(req: RecipeRequest): Promise<GeneratedRecipe[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  const foodListStr = req.foods
    .map(f => `・${f.name} (${f.quantity}${f.unit}${f.expiration_date ? `, 期限:${f.expiration_date}` : ''})`)
    .join('\n');
  const moodStr = req.mood || '指定なし';
  const maxTimeStr = req.maxTime ? `${req.maxTime}分以内` : '指定なし';
  const conditionStr = req.condition || 'なし';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
あなたはプロの料理研究家兼冷蔵庫管理AIです。
ユーザーの冷蔵庫にある食材を最大限に活用し、希望の気分や条件にピッタリ合う魅力的なレシピを2〜3提案してください。

【冷蔵庫にある食材】
${foodListStr}

【ユーザーの気分・希望】
・気分: ${moodStr}
・希望調理時間: ${maxTimeStr}
・こだわり条件: ${conditionStr}
${req.prioritizeExpiration ? '※賞味期限・消費期限が近い食材を優先して使用してください。' : ''}

【必須出力フォーマット】
以下のキーを持つJSON配列(JSONのみ、コードブロック不要)を出力してください:
[
  {
    "id": "recipe-1",
    "title": "料理名",
    "description": "アピールコメント・特徴",
    "cookingTime": 15,
    "difficulty": "簡単",
    "category": "和食",
    "availableIngredients": [
      { "name": "鶏むね肉", "amount": "1枚", "quantityToDeduct": 1, "unit": "枚" }
    ],
    "missingIngredients": [
      { "name": "醤油", "amount": "大さじ2" }
    ],
    "steps": [
      "1. 〇〇を切る",
      "2. 〇〇を炒める"
    ],
    "tips": "プロのアドバイスやコツ",
    "priorityUsedFoods": ["鶏むね肉"]
  }
]
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (text) {
        // JSONブロックが含まれている場合も対応
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const recipes = JSON.parse(cleaned) as GeneratedRecipe[];
        return recipes;
      }
    } catch (err) {
      console.error('Gemini API Error, using fallback generator:', err);
    }
  }

  // フォールバック（APIキー未設定または通信失敗時用のインテリジェント生成器）
  return generateSmartFallbackRecipes(req);
}

function generateSmartFallbackRecipes(req: RecipeRequest): GeneratedRecipe[] {
  const foods = req.foods;
  const foodNames = foods.map(f => f.name);

  const hasChicken = foodNames.some(n => n.includes('鶏') || n.includes('肉'));
  const hasPork    = foodNames.some(n => n.includes('豚'));
  const hasCabbage = foodNames.some(n => n.includes('キャベツ'));
  const hasEgg     = foodNames.some(n => n.includes('卵') || n.includes('たまご'));
  const hasOnion   = foodNames.some(n => n.includes('玉ねぎ') || n.includes('オニオン'));
  const hasTofu    = foodNames.some(n => n.includes('豆腐'));

  const recipes: GeneratedRecipe[] = [];

  if (hasChicken || hasCabbage || hasEgg) {
    const mainMeat = foods.find(f => f.name.includes('鶏') || f.name.includes('肉')) || { name: '鶏むね肉', quantity: 1, unit: '枚' };
    const mainVeg  = foods.find(f => f.name.includes('キャベツ') || f.name.includes('玉ねぎ')) || { name: 'キャベツ', quantity: 0.25, unit: '玉' };
    const eggFood  = foods.find(f => f.name.includes('卵')) || { name: '卵', quantity: 2, unit: '個' };

    recipes.push({
      id: `fallback-${Date.now()}-1`,
      title: `${mainMeat.name}と${mainVeg.name}のふんわり卵とじ`,
      description: `${req.mood || 'がっつり'}食べたい時に最適！フライパン一つでパパッと作れる絶品おかず。`,
      cookingTime: Math.min(req.maxTime || 15, 15),
      difficulty: '簡単',
      category: '和食',
      availableIngredients: [
        { name: mainMeat.name, amount: `1${mainMeat.unit}`, quantityToDeduct: 1, unit: mainMeat.unit },
        { name: mainVeg.name,  amount: `1/4${mainVeg.unit}`, quantityToDeduct: 0.25, unit: mainVeg.unit },
        { name: eggFood.name,  amount: `2${eggFood.unit}`,  quantityToDeduct: 2,    unit: eggFood.unit },
      ],
      missingIngredients: [
        { name: '醤油',   amount: '大さじ1.5' },
        { name: 'みりん', amount: '大さじ1' },
        { name: '和風だし', amount: '小さじ1' },
      ],
      steps: [
        `1. ${mainMeat.name}を食べやすい一口大のそぎ切りにし、${mainVeg.name}はザク切りにします。`,
        '2. フライパンに水100ml、醤油、みりん、和風だしを入れて中火で一煮立ちさせます。',
        `3. ${mainMeat.name}と${mainVeg.name}を加え、火が通るまで約5〜6分弱火〜中火で煮込みます。`,
        '4. 溶き卵を回し入れ、蓋をして30秒ほど蒸らしたら完成です！',
      ],
      tips: '溶き卵を2回に分けて入れると、よりふわとろに仕上がります！',
      priorityUsedFoods: [mainMeat.name, mainVeg.name],
    });
  }

  if (hasPork || hasOnion || hasTofu || recipes.length < 2) {
    recipes.push({
      id: `fallback-${Date.now()}-2`,
      title: 'シャキシャキ野菜と特製タレのスタミナ炒め',
      description: 'ご飯が止まらない！冷蔵庫の野菜を美味しく消費できる時短レシピ。',
      cookingTime: Math.min(req.maxTime || 20, 10),
      difficulty: '簡単',
      category: '中華',
      availableIngredients: foods.slice(0, 3).map(f => ({
        name: f.name,
        amount: `適量 (約1${f.unit})`,
        quantityToDeduct: Math.min(f.quantity, 1),
        unit: f.unit,
      })),
      missingIngredients: [
        { name: 'オイスターソース', amount: '大さじ1' },
        { name: 'ごま油',           amount: '小さじ1' },
      ],
      steps: [
        '1. 食材を食べやすい大きさに揃えて切ります。',
        '2. フライパンにごま油を熱し、火の通りにくい肉類・固い野菜から炒めます。',
        '3. 全体に火が通ったらオイスターソースを絡めてサッと炒め合わせます。',
      ],
      tips: '強火で手早く炒めることで野菜のシャキシャキ感が残ります。',
      priorityUsedFoods: foods.slice(0, 2).map(f => f.name),
    });
  }

  return recipes;
}
