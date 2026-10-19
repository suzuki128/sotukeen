import React from 'react';
import { Food } from '../types';
import { Sparkles, AlertTriangle, ArrowRight, Refrigerator, Clock, Utensils, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  foods: Food[];
  onNavigateTab: (tab: 'fridge' | 'generator') => void;
  onQuickGenerate: (mood: string) => void;
  onOpenAddModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  foods,
  onNavigateTab,
  onQuickGenerate,
  onOpenAddModal
}) => {
  const today = new Date().toISOString().split('T')[0];

  // 期限間近食材（今日から3日以内）
  const urgentFoods = foods.filter(f => {
    if (f.quantity <= 0) return false;
    const diff = Math.ceil((new Date(f.expiration_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 3;
  }).sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime());

  const getDaysLeft = (expDate: string) => {
    const diff = Math.ceil((new Date(expDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `期限切れ (${Math.abs(diff)}日前)`;
    if (diff === 0) return '今日まで！';
    return `あと${diff}日`;
  };

  const moods = [
    { label: 'がっつり', emoji: '🥩' },
    { label: 'あっさり', emoji: '🥗' },
    { label: '時短・簡単', emoji: '⚡' },
    { label: 'ヘルシー', emoji: '🥦' },
    { label: '温かいもの', emoji: '🍲' },
    { label: '和食', emoji: '🍱' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ヒーローバナー */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', padding: '4px 12px', borderRadius: '20px', color: '#6ee7b7', fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px' }}>
            <Sparkles size={14} /> AI搭載 スマート献立アシスタント
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>
            おかえりなさい！
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem' }}>
            現在、冷蔵庫には <strong style={{ color: 'var(--accent-emerald)', fontSize: '1.2rem' }}>{foods.filter(f => f.quantity > 0).length}種類</strong> の食材が保存されています。
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => onNavigateTab('generator')}
          style={{ padding: '14px 24px', fontSize: '1rem', borderRadius: '12px' }}
        >
          <Sparkles size={20} />
          AIにレシピを考えてもらう
        </button>
      </div>

      {/* 2カラムレイアウト */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* 期限が近い食材アラート */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle color="var(--accent-amber)" size={20} />
              ⚠ 期限が近い食材 ({urgentFoods.length})
            </h2>
            <button 
              onClick={() => onNavigateTab('fridge')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              一覧を見る <ArrowRight size={14} />
            </button>
          </div>

          {urgentFoods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: '8px' }} />
              <div>期限が近い食材はありません。安全です！</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {urgentFoods.map(food => {
                const daysLeft = Math.ceil((new Date(food.expiration_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={food.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: daysLeft <= 1 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: `1px solid ${daysLeft <= 1 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{food.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        残量: {food.quantity} {food.unit}
                      </div>
                    </div>
                    <span className={daysLeft <= 1 ? 'badge-urgent' : 'badge-warning'}>
                      {getDaysLeft(food.expiration_date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* クイック気分選択 */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils color="var(--accent-emerald)" size={20} />
            今日の気分で即レシピ作成
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            気分をワンタップすると、冷蔵庫の食材からAIがメニューをご提案します。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {moods.map(m => (
              <button
                key={m.label}
                onClick={() => onQuickGenerate(m.label)}
                className="chip"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.92rem'
                }}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 冷蔵庫サマリーミニカード */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Refrigerator color="var(--accent-cyan)" size={20} />
            冷蔵庫の食材ピックアップ
          </h2>
          <button 
            className="btn btn-secondary"
            onClick={onOpenAddModal}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            + 食材を追加する
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {foods.filter(f => f.quantity > 0).slice(0, 6).map(food => (
            <div key={food.id} style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{food.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                {food.quantity} {food.unit}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
