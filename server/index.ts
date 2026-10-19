import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool, { initDB } from './db';
import { generateRecipe } from './services/geminiService';
import { parseReceiptImage } from './services/ocrService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// アップロード先の準備
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// ============================================================
// 食材 (Foods) CRUD API
// ============================================================

// 全食材取得
app.get('/api/foods', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM foods ORDER BY expiration_date ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '食材の取得に失敗しました' });
  }
});

// 食材個別取得
app.get('/api/foods/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM foods WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: '食材が見つかりません' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'エラーが発生しました' });
  }
});

// 食材追加
app.post('/api/foods', async (req, res) => {
  try {
    const { name, quantity, unit, category, purchase_date, expiration_date } = req.body;
    if (!name || quantity === undefined || !unit) {
      return res.status(400).json({ error: '食材名・数量・単位は必須項目です' });
    }

    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    const today = new Date().toISOString().split('T')[0];

    const { rows } = await pool.query(
      `INSERT INTO foods (id, name, quantity, unit, category, purchase_date, expiration_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        name,
        Number(quantity),
        unit,
        category || 'その他',
        purchase_date || today,
        expiration_date || today,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '食材の追加に失敗しました' });
  }
});

// 食材編集
app.put('/api/foods/:id', async (req, res) => {
  try {
    const { name, quantity, unit, category, purchase_date, expiration_date } = req.body;

    const { rows } = await pool.query(
      `UPDATE foods
       SET name = $1, quantity = $2, unit = $3, category = $4,
           purchase_date = $5, expiration_date = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, Number(quantity), unit, category, purchase_date, expiration_date, req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: '食材が見つかりません' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: '食材の更新に失敗しました' });
  }
});

// 数量変更 (増減 API)
app.patch('/api/foods/:id/quantity', async (req, res) => {
  try {
    const { delta } = req.body;

    // 現在の数量を取得して加算 (0未満にはしない)
    const { rows } = await pool.query(
      `UPDATE foods
       SET quantity = GREATEST(0, quantity + $1), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [Number(delta), req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: '食材が見つかりません' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: '数量の変更に失敗しました' });
  }
});

// 食材削除
app.delete('/api/foods/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM foods WHERE id = $1',
      [req.params.id]
    );

    if (rowCount === 0) return res.status(404).json({ error: '食材が見つかりません' });
    res.json({ message: '削除されました', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: '食材の削除に失敗しました' });
  }
});

// ============================================================
// AI レシピ提案 API
// ============================================================
app.post('/api/recipes/generate', async (req, res) => {
  try {
    const { mood, maxTime, condition, prioritizeExpiration } = req.body;

    const { rows: foods } = await pool.query(
      'SELECT * FROM foods WHERE quantity > 0 ORDER BY expiration_date ASC'
    );

    if (foods.length === 0) {
      return res.status(400).json({ error: '冷蔵庫に食材が登録されていません。まずは食材を追加してください。' });
    }

    const recipes = await generateRecipe({
      foods,
      mood,
      maxTime: maxTime ? Number(maxTime) : undefined,
      condition,
      prioritizeExpiration,
    });

    res.json(recipes);
  } catch (error) {
    console.error('Recipe generation API failed:', error);
    res.status(500).json({ error: 'AIレシピの生成に失敗しました。' });
  }
});

// ============================================================
// レシピ確定 & 食材消費 API
// ============================================================
app.post('/api/recipes/consume', async (req, res) => {
  try {
    const { recipeTitle, ingredientsToDeduct } = req.body;
    const consumedItems: any[] = [];
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const item of ingredientsToDeduct) {
        // 食材を名前で検索
        let foodRow: any = null;
        if (item.foodId) {
          const r = await client.query('SELECT * FROM foods WHERE id = $1', [item.foodId]);
          foodRow = r.rows[0] ?? null;
        }
        if (!foodRow) {
          const r = await client.query(
            "SELECT * FROM foods WHERE name ILIKE $1 LIMIT 1",
            [`%${item.foodName}%`]
          );
          foodRow = r.rows[0] ?? null;
        }

        if (foodRow) {
          const newQty = Math.max(0, parseFloat(foodRow.quantity) - Number(item.quantity));
          await client.query(
            'UPDATE foods SET quantity = $1, updated_at = NOW() WHERE id = $2',
            [newQty, foodRow.id]
          );

          const histId = Date.now().toString() + Math.random().toString(36).substring(2, 5);
          await client.query(
            `INSERT INTO consumption_history (id, food_id, food_name, quantity, unit)
             VALUES ($1, $2, $3, $4, $5)`,
            [histId, foodRow.id, foodRow.name, item.quantity, foodRow.unit]
          );

          consumedItems.push({
            foodId: foodRow.id,
            name: foodRow.name,
            prevQuantity: foodRow.quantity,
            newQuantity: newQty,
          });
        }
      }

      // レシピ履歴の記録
      const recipeHistId = Date.now().toString();
      await client.query(
        `INSERT INTO recipe_history (id, recipe_name, recipe_data)
         VALUES ($1, $2, $3)`,
        [recipeHistId, recipeTitle, JSON.stringify(ingredientsToDeduct)]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: '食材の消費を記録し、冷蔵庫の残量を更新しました。', consumedItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '食材消費の更新に失敗しました' });
  }
});

// ============================================================
// 消費履歴取得 API
// ============================================================
app.get('/api/history', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM consumption_history ORDER BY consumed_at DESC LIMIT 50'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: '履歴の取得に失敗しました' });
  }
});

// ============================================================
// レシート自動登録 (OCR/AI) API
// ============================================================
app.post('/api/receipt/scan', upload.single('receiptImage'), async (req, res) => {
  try {
    const candidates = await parseReceiptImage(req.file?.path ?? '');

    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.json({ candidates });
  } catch (error) {
    res.status(500).json({ error: 'レシートの解析に失敗しました。' });
  }
});

// ============================================================
// 起動
// ============================================================
(async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🍳 冷蔵庫AI API サーバーが起動しました: http://localhost:${PORT}`);
    console.log(`🐘 データベース: PostgreSQL (fridge_db)`);
  });
})();
