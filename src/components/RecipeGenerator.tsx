import React, { useState } from 'react';
import { Food, GeneratedRecipe } from '../types';
import { Sparkles, Clock, Utensils, AlertCircle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RecipeGeneratorProps {
  foods: Food[];
  onGenerate: (params: {
    mood?: string;
    maxTime?: number;
    condition?: string;
    prioritizeExpiration?: boolean;
  }) => Promise<void>;
  recipes: GeneratedRecipe[];
  isLoading: boolean;
  onSelectRecipe: (recipe: GeneratedRecipe) => void;
  presetMood?: string;
}

export const RecipeGenerator: React.FC<RecipeGeneratorProps> = ({
  foods,
  onGenerate,
  recipes,
  isLoading,
  onSelectRecipe,
  presetMood = ''
}) => {
  const [mood, setMood] = useState(presetMood || 'がっつり');
  const [maxTime, setMaxTime] = useState<number>(20);
  const [condition, setCondition] = useState('');
  const [prioritizeExpiration, setPrioritizeExpiration] = useState(true);

  const moodOptions = [
    'がっつり', 'あっさり', 'ヘルシー', '温かいもの', '辛いもの', '甘辛い', '和食', '洋食', '中華', '居酒屋風'
  ];

  const timeOptions = [10, 15, 20, 30, 45];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      mood,
      maxTime,
      condition,
      prioritizeExpiration
    });
  };

  const availableFoods = foods.filter(f => f.quantity > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 設定フォーム */}
      <div className="glass-card" style={{ border: '1px solid rgba(168, 85, 247, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent-purple)' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>今日の気分・希望条件を入力</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              冷蔵庫の食材 ({availableFoods.length}種) を使った最適レシピをGemini AIが生成します。
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 気分タグ */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
              どんな気分？
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {moodOptions.map(m => (
                <button
                  key={m}
                  type="button"
                  className={`chip ${mood === m ? 'active' : ''}`}
                  onClick={() => setMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 調理時間 & 期限優先フラグ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px' }}>
                調理時間
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {timeOptions.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${maxTime === t ? 'active' : ''}`}
                    onClick={() => setMaxTime(t)}
                    style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}
                  >
                    {t}分以内
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <input
                type="checkbox"
                id="prioExp"
                checked={prioritizeExpiration}
                onChange={e => setPrioritizeExpiration(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
              />
              <label htmlFor="prioExp" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                ⚠ 期限が近い食材を優先して使う
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>食品ロス削減に繋げます</span>
              </label>
            </div>
          </div>

          {/* 自由入力条件 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '6px' }}>
              その他の希望・自由記述（任意）
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="例: 今日は疲れているからワンパンで作りたい / お弁当のおかずにも使えるもの"
              value={condition}
              onChange={e => setCondition(e.target.value)}
            />
          </div>

          {/* 生成実行ボタン */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || availableFoods.length === 0}
            style={{
              padding: '16px',
              fontSize: '1.05rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))'
            }}
          >
            {isLoading ? (
              <>
                <div className="loader-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                AIが最高の一皿を考案中...
              </>
            ) : (
              <>
                <Sparkles size={20} /> AIレシピを生成・提案する
              </>
            )}
          </button>

        </form>
      </div>

      {/* ローディングオーバーレイ演出 */}
      {isLoading && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', border: '1px solid var(--accent-purple)' }}>
          <div className="loader-spinner" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
            AIが冷蔵庫の中身を分析中...
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            「{mood}」の気分に合わせ、期限の近い食材を活用した美味しいレシピを作成しています。
          </p>
        </div>
      )}

      {/* レシピ一覧表示 */}
      {recipes.length > 0 && !isLoading && (
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils color="var(--accent-emerald)" size={24} />
            AIからのおすすめレシピ ({recipes.length}品)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {recipes.map((recipe, index) => (
              <div 
                key={recipe.id || index}
                className="glass-card glass-card-interactive"
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}
              >
                <div>
                  {/* カテゴリ & 難易度 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700 }}>
                      {recipe.category}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Clock size={14} /> {recipe.cookingTime}分
                      <span style={{ color: 'var(--border-color)' }}>|</span>
                      <span>{recipe.difficulty}</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>
                    {recipe.title}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {recipe.description}
                  </p>

                  {/* 食材サマリー */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.83rem' }}>
                    <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> 冷蔵庫にある食材:
                    </div>
                    <div style={{ color: 'var(--text-main)', marginBottom: '6px' }}>
                      {recipe.availableIngredients.map(i => i.name).join('、')}
                    </div>

                    {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                      <>
                        <div style={{ color: 'var(--accent-amber)', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={14} /> 不足調味料・食材:
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {recipe.missingIngredients.map(i => i.name).join('、')}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => onSelectRecipe(recipe)}
                  style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
                >
                  レシピを見る・調理する <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
