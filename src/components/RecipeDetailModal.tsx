import React, { useState } from 'react';
import { GeneratedRecipe, Food } from '../types';
import { X, Clock, ChefHat, CheckCircle2, AlertCircle, Utensils, Flame, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecipeDetailModalProps {
  recipe: GeneratedRecipe | null;
  foods: Food[];
  onClose: () => void;
  onConsumeIngredients: (recipeTitle: string, items: Array<{ foodId?: string; foodName: string; quantity: number }>) => Promise<void>;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  foods,
  onClose,
  onConsumeIngredients
}) => {
  const [showConsumeStep, setShowConsumeStep] = useState(false);
  const [deductItems, setDeductItems] = useState<Array<{ name: string; quantity: number; unit: string; checked: boolean }>>([]);

  if (!recipe) return null;

  // 消費ステップを開始
  const handleStartConsume = () => {
    const items = recipe.availableIngredients.map(ing => ({
      name: ing.name,
      quantity: ing.quantityToDeduct || 1,
      unit: ing.unit || '個',
      checked: true
    }));
    setDeductItems(items);
    setShowConsumeStep(true);
  };

  // 食材消費の実行
  const handleConfirmConsume = async () => {
    const activeItems = deductItems
      .filter(item => item.checked && item.quantity > 0)
      .map(item => {
        const matchedFood = foods.find(f => f.name.includes(item.name) || item.name.includes(f.name));
        return {
          foodId: matchedFood?.id,
          foodName: item.name,
          quantity: item.quantity
        };
      });

    try {
      await onConsumeIngredients(recipe.title, activeItems);
      
      // お祝い紙吹雪演出
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setShowConsumeStep(false);
      onClose();
    } catch (err) {
      alert('食材の自動引き落としに失敗しました');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700 }}>
              {recipe.category}
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
              {recipe.title}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {!showConsumeStep ? (
          /* レシピ詳細モード */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 概要タグ */}
            <div style={{ display: 'flex', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="var(--accent-cyan)" />
                <span>調理時間: <strong>{recipe.cookingTime}分</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChefHat size={16} color="var(--accent-amber)" />
                <span>難易度: <strong>{recipe.difficulty}</strong></span>
              </div>
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
              {recipe.description}
            </p>

            {/* 食材リスト */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              
              {/* 冷蔵庫にある食材 */}
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> 冷蔵庫にある食材
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.88rem' }}>
                  {recipe.availableIngredients.map((item, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>✓ {item.name}</span>
                      <span style={{ fontWeight: 600 }}>{item.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 不足している食材 */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} /> 不足・追加調味料
                </h3>
                {recipe.missingIngredients && recipe.missingIngredients.length > 0 ? (
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.88rem' }}>
                    {recipe.missingIngredients.map((item, i) => (
                      <li key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>・ {item.name}</span>
                        <span>{item.amount}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>不足なし！家にあるものだけで作れます。</div>
                )}
              </div>

            </div>

            {/* 調理手順 */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame color="var(--accent-rose)" size={18} /> 作り方
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recipe.steps.map((step, index) => (
                  <div key={index} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* ワンポイントアドバイス */}
            {recipe.tips && (
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem' }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>💡 コツ・ポイント: </strong> {recipe.tips}
              </div>
            )}

            {/* アクションボタン */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn btn-secondary" onClick={onClose}>
                閉じる
              </button>
              <button className="btn btn-primary" onClick={handleStartConsume} style={{ padding: '12px 20px' }}>
                <Utensils size={18} /> この料理を作りました！
              </button>
            </div>

          </div>
        ) : (
          /* 食材消費確認モード (要件定義書 セクション13) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-emerald)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '4px' }}>
                🎉 料理作成おつかれさまでした！
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                以下の使用食材をチェックし、「食材を消費する」を押すと冷蔵庫の残量が自動的に更新されます。
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {deductItems.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={e => {
                        const updated = [...deductItems];
                        updated[index].checked = e.target.checked;
                        setDeductItems(updated);
                      }}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>消費量:</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantity}
                      onChange={e => {
                        const updated = [...deductItems];
                        updated[index].quantity = Number(e.target.value);
                        setDeductItems(updated);
                      }}
                      className="input-field"
                      style={{ width: '70px', padding: '4px 8px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.85rem' }}>{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setShowConsumeStep(false)}>
                戻る
              </button>
              <button className="btn btn-primary" onClick={handleConfirmConsume} style={{ padding: '12px 24px' }}>
                <Check size={18} /> 食材を消費して冷蔵庫を更新
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
