import React, { useEffect, useState } from 'react';
import { ConsumptionHistoryItem } from '../types';
import { fetchConsumptionHistory } from '../api/client';
import { History, Calendar, Utensils, CheckCircle } from 'lucide-react';

export const ConsumptionHistoryView: React.FC = () => {
  const [history, setHistory] = useState<ConsumptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsumptionHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>
          <History size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>食材消費・調理履歴</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            レシピを作って自動引き落としされた食材のログです。食品ロス削減の成果が確認できます。
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loader-spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : history.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <Utensils size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <h3>まだ消費履歴がありません</h3>
          <p style={{ fontSize: '0.9rem' }}>「AIレシピ提案」で料理を作って「この料理を作りました」を押すと履歴が蓄積されます。</p>
        </div>
      ) : (
        <div className="glass-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={18} color="var(--accent-emerald)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.food_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {new Date(item.consumed_at).toLocaleString('ja-JP')}
                    </div>
                  </div>
                </div>

                <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>
                  -{item.quantity} {item.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
