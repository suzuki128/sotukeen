import React, { useState } from 'react';
import { Food } from '../types';
import { Plus, Minus, Trash2, Edit3, Calendar, Search, Filter, AlertCircle, AlertTriangle } from 'lucide-react';

interface FridgeProps {
  foods: Food[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onDeleteFood: (id: string) => void;
  onEditFood: (food: Food) => void;
  onOpenAddModal: () => void;
}

export const Fridge: React.FC<FridgeProps> = ({
  foods,
  onUpdateQuantity,
  onDeleteFood,
  onEditFood,
  onOpenAddModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('すべて');
  const [deleteConfirmFood, setDeleteConfirmFood] = useState<Food | null>(null);

  const categories = ['すべて', '肉類', '魚介類', '野菜', '卵・乳製品', '加工食品', '調味料', 'その他'];

  const today = new Date().toISOString().split('T')[0];

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'すべて' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDaysLeftInfo = (expDate: string) => {
    const diff = Math.ceil((new Date(expDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `期限切れ (${Math.abs(diff)}日前)`, className: 'badge-urgent' };
    if (diff === 0) return { label: '今日まで！', className: 'badge-urgent' };
    if (diff <= 2) return { label: `あと${diff}日`, className: 'badge-urgent' };
    if (diff <= 5) return { label: `あと${diff}日`, className: 'badge-warning' };
    return { label: `あと${diff}日`, className: 'badge-safe' };
  };

  const handleDecrement = (food: Food) => {
    if (food.quantity <= 1) {
      // 0以下になるため確認
      setDeleteConfirmFood(food);
    } else {
      onUpdateQuantity(food.id, -1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 検索・フィルターバー */}
      <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* 検索入力 */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="食材名で検索..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* カテゴリタグ */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 食材追加ボタン */}
        <button className="btn btn-primary" onClick={onOpenAddModal} style={{ fontSize: '0.88rem' }}>
          <Plus size={16} /> 食材を手動追加
        </button>
      </div>

      {/* 食材カードグリッド */}
      {filteredFoods.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>該当する食材が見つかりません</h3>
          <p style={{ fontSize: '0.9rem' }}>「食材を手動追加」または「レシート登録」から食材を追加してください。</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredFoods.map(food => {
            const expInfo = getDaysLeftInfo(food.expiration_date);
            const isZero = food.quantity <= 0;

            return (
              <div 
                key={food.id} 
                className="glass-card glass-card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: isZero ? 0.5 : 1,
                  border: isZero ? '1px dashed var(--accent-rose)' : undefined
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{food.category}</span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '2px 0' }}>{food.name}</h3>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => onEditFood(food)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="編集"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteFood(food.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '4px' }}
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 期限表示 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <Calendar size={14} />
                    <span>期限: {food.expiration_date}</span>
                    <span className={expInfo.className}>{expInfo.label}</span>
                  </div>
                </div>

                {/* 残量操作バー */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>残量</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => handleDecrement(food)}
                      style={{ width: '30px', height: '30px' }}
                    >
                      <Minus size={14} />
                    </button>

                    <span style={{ fontSize: '1.1rem', fontWeight: 800, minWidth: '40px', textAlign: 'center', color: food.quantity === 0 ? 'var(--accent-rose)' : 'var(--text-main)' }}>
                      {food.quantity} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>{food.unit}</span>
                    </span>

                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => onUpdateQuantity(food.id, 1)}
                      style={{ width: '30px', height: '30px' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 残量0時の削除確認モーダル */}
      {deleteConfirmFood && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmFood(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <AlertTriangle size={48} color="var(--accent-amber)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>食材を使い切りました</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '20px' }}>
              <strong>「{deleteConfirmFood.name}」</strong>の残量が0になります。冷蔵庫から削除しますか？
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  onUpdateQuantity(deleteConfirmFood.id, -1);
                  setDeleteConfirmFood(null);
                }}
              >
                残量0で残す
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  onDeleteFood(deleteConfirmFood.id);
                  setDeleteConfirmFood(null);
                }}
              >
                冷蔵庫から削除
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
