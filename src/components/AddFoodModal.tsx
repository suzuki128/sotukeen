import React, { useState, useEffect } from 'react';
import { Food } from '../types';
import { X, Check } from 'lucide-react';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (food: Omit<Food, 'id'>) => void;
  initialData?: Food | null;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultExpStr = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unit, setUnit] = useState('個');
  const [category, setCategory] = useState('野菜');
  const [purchaseDate, setPurchaseDate] = useState(todayStr);
  const [expirationDate, setExpirationDate] = useState(defaultExpStr);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setQuantity(initialData.quantity);
      setUnit(initialData.unit);
      setCategory(initialData.category || 'その他');
      setPurchaseDate(initialData.purchase_date);
      setExpirationDate(initialData.expiration_date);
    } else {
      setName('');
      setQuantity(1);
      setUnit('個');
      setCategory('野菜');
      setPurchaseDate(todayStr);
      setExpirationDate(defaultExpStr);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      quantity: Number(quantity),
      unit,
      category,
      purchase_date: purchaseDate,
      expiration_date: expirationDate,
    });
    onClose();
  };

  const commonUnits = ['個', '枚', '玉', '本', 'パック', '袋', 'g', 'ml', '切'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {initialData ? '食材の編集' : '新しい食材を登録'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 食材名 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              食材名 <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="例: 鶏むね肉, キャベツ, 卵"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {/* 数量 & 単位 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                数量 <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                className="input-field"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                単位
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="個, 枚, 玉..."
                value={unit}
                onChange={e => setUnit(e.target.value)}
              />
            </div>
          </div>

          {/* 単位ショートカット */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {commonUnits.map(u => (
              <button
                key={u}
                type="button"
                className="chip"
                style={{ padding: '3px 8px', fontSize: '0.78rem', background: unit === u ? 'var(--accent-cyan)' : undefined, color: unit === u ? '#fff' : undefined }}
                onClick={() => setUnit(u)}
              >
                {u}
              </button>
            ))}
          </div>

          {/* カテゴリ */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              カテゴリ
            </label>
            <select
              className="input-field"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="肉類">肉類</option>
              <option value="魚介類">魚介類</option>
              <option value="野菜">野菜</option>
              <option value="卵・乳製品">卵・乳製品</option>
              <option value="加工食品">加工食品</option>
              <option value="調味料">調味料</option>
              <option value="その他">その他</option>
            </select>
          </div>

          {/* 購入日 & 期限 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                購入日
              </label>
              <input
                type="date"
                className="input-field"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                賞味期限・消費期限
              </label>
              <input
                type="date"
                className="input-field"
                value={expirationDate}
                onChange={e => setExpirationDate(e.target.value)}
              />
            </div>
          </div>

          {/* ボタン */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} /> 保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
