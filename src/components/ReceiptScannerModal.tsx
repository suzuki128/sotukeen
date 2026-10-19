import React, { useState } from 'react';
import { ReceiptCandidate, Food } from '../types';
import { scanReceiptImage } from '../api/client';
import { X, Upload, Receipt as ReceiptIcon, Check, Sparkles, Plus, AlertCircle } from 'lucide-react';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBatchFoods: (foods: Array<Omit<Food, 'id'>>) => Promise<void>;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onAddBatchFoods
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [candidates, setCandidates] = useState<Array<ReceiptCandidate & { checked: boolean }>>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const results = await scanReceiptImage(selectedFile || undefined);
      setCandidates(results.map(c => ({ ...c, checked: true })));
    } catch (err) {
      alert('レシートの読み取りに失敗しました。');
    } finally {
      setIsScanning(false);
    }
  };

  const handleBatchRegister = async () => {
    const activeCandidates = candidates.filter(c => c.checked);
    if (activeCandidates.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const foodsToCreate = activeCandidates.map(c => {
      const expDate = new Date(Date.now() + (c.estimatedDays || 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return {
        name: c.name,
        quantity: c.quantity || 1,
        unit: c.unit || '個',
        category: c.category || 'その他',
        purchase_date: todayStr,
        expiration_date: expDate
      };
    });

    await onAddBatchFoods(foodsToCreate);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ReceiptIcon color="var(--accent-cyan)" size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>レシートAI自動食材登録</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {candidates.length === 0 ? (
          /* 画像選択・スキャンフェーズ */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              スーパーなどの購入レシートを撮影・選択すると、AIが自動で食品名を抽出して冷蔵庫に一括登録します。
            </p>

            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '30px',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.6)',
              cursor: 'pointer'
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="receiptInput"
              />
              <label htmlFor="receiptInput" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <Upload size={36} color="var(--accent-cyan)" />
                {selectedFile ? (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>クリックして変更</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700 }}>レシート画像をアップロード・撮影</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>（未選択の場合はデモ用サンプル画像で解析します）</div>
                  </div>
                )}
              </label>
            </div>

            {previewUrl && (
              <div style={{ textAlign: 'center' }}>
                <img src={previewUrl} alt="Receipt preview" style={{ maxHeight: '180px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleScan}
              disabled={isScanning}
              style={{ padding: '14px', fontSize: '1rem' }}
            >
              {isScanning ? (
                <>
                  <div className="loader-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                  レシート画像を解析中...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> レシートを解析して商品抽出
                </>
              )}
            </button>

          </div>
        ) : (
          /* 抽出結果確認・一括登録フェーズ (要件定義書 セクション5.1) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-cyan)', fontSize: '0.88rem' }}>
              以下の商品が食材として抽出されました。登録する項目を確認・選択してください。
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {candidates.map((c, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={c.checked}
                      onChange={e => {
                        const updated = [...candidates];
                        updated[index].checked = e.target.checked;
                        setCandidates(updated);
                      }}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={c.name}
                      onChange={e => {
                        const updated = [...candidates];
                        updated[index].name = e.target.value;
                        setCandidates(updated);
                      }}
                      className="input-field"
                      style={{ width: '160px', padding: '4px 8px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <input
                      type="number"
                      value={c.quantity}
                      onChange={e => {
                        const updated = [...candidates];
                        updated[index].quantity = Number(e.target.value);
                        setCandidates(updated);
                      }}
                      className="input-field"
                      style={{ width: '50px', padding: '4px 6px', textAlign: 'center' }}
                    />
                    <span>{c.unit}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({c.category})</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setCandidates([])}>
                再スキャン
              </button>
              <button className="btn btn-primary" onClick={handleBatchRegister}>
                <Plus size={16} /> 選択した食材を冷蔵庫に一括登録
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
