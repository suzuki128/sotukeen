import React from 'react';
import { Refrigerator, Sparkles, LayoutDashboard, Receipt, History, Plus } from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'fridge' | 'generator' | 'history';
  setCurrentTab: (tab: 'dashboard' | 'fridge' | 'generator' | 'history') => void;
  onOpenAddModal: () => void;
  onOpenReceiptModal: () => void;
  foodCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAddModal,
  onOpenReceiptModal,
  foodCount
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* ロゴ */}
        <div 
          onClick={() => setCurrentTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <Refrigerator size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
              スマート冷蔵庫 <span style={{ color: 'var(--accent-emerald)' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              食材管理 & AIレシピ提案
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(30, 41, 59, 0.6)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            className={`btn ${currentTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('dashboard')}
            style={{ padding: '8px 14px', fontSize: '0.88rem', border: 'none' }}
          >
            <LayoutDashboard size={16} />
            ホーム
          </button>
          
          <button
            className={`btn ${currentTab === 'fridge' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('fridge')}
            style={{ padding: '8px 14px', fontSize: '0.88rem', border: 'none', position: 'relative' }}
          >
            <Refrigerator size={16} />
            冷蔵庫
            {foodCount > 0 && (
              <span style={{
                background: 'var(--accent-emerald)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                marginLeft: '4px'
              }}>
                {foodCount}
              </span>
            )}
          </button>

          <button
            className={`btn ${currentTab === 'generator' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('generator')}
            style={{ padding: '8px 14px', fontSize: '0.88rem', border: 'none' }}
          >
            <Sparkles size={16} color={currentTab === 'generator' ? '#fff' : 'var(--accent-amber)'} />
            AIレシピ提案
          </button>

          <button
            className={`btn ${currentTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('history')}
            style={{ padding: '8px 14px', fontSize: '0.88rem', border: 'none' }}
          >
            <History size={16} />
            消費履歴
          </button>
        </nav>

        {/* アクションボタン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-secondary"
            onClick={onOpenReceiptModal}
            title="レシート画像からAI一括登録"
            style={{ fontSize: '0.85rem', padding: '8px 12px' }}
          >
            <Receipt size={16} color="var(--accent-cyan)" />
            レシート登録
          </button>

          <button 
            className="btn btn-primary"
            onClick={onOpenAddModal}
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            <Plus size={16} />
            食材追加
          </button>
        </div>
      </div>
    </header>
  );
};
