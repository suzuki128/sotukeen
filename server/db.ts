import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL 接続プール
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT)   || 5432,
  database: process.env.DB_NAME     || 'fridge_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// 接続確認
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL 接続エラー:', err.message);
    return;
  }
  release();
  console.log('✅ PostgreSQL (fridge_db) に接続しました');
});

// テーブル初期化 (存在しない場合のみ作成)
export async function initDB(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS foods (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        quantity    NUMERIC NOT NULL,
        unit        TEXT NOT NULL,
        category    TEXT DEFAULT 'その他',
        purchase_date    TEXT NOT NULL,
        expiration_date  TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS recipe_history (
        id          TEXT PRIMARY KEY,
        recipe_name TEXT NOT NULL,
        cooking_time INTEGER,
        difficulty  TEXT,
        recipe_data TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS consumption_history (
        id          TEXT PRIMARY KEY,
        food_id     TEXT,
        food_name   TEXT NOT NULL,
        quantity    NUMERIC NOT NULL,
        unit        TEXT NOT NULL,
        consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 初期シードデータ (foodsテーブルが空の場合のみ)
    const { rows } = await client.query('SELECT COUNT(*) AS cnt FROM foods');
    const count = parseInt(rows[0].cnt, 10);

    if (count === 0) {
      const today = new Date();
      const fmtDate = (offset: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        return d.toISOString().split('T')[0];
      };

      const seedFoods = [
        { id: 'seed-1', name: '鶏むね肉',   quantity: 2,   unit: '枚',    category: '肉類',       purchase_date: fmtDate(-1), expiration_date: fmtDate(1)  },
        { id: 'seed-2', name: 'キャベツ',   quantity: 0.5, unit: '玉',    category: '野菜',       purchase_date: fmtDate(-2), expiration_date: fmtDate(4)  },
        { id: 'seed-3', name: '卵',         quantity: 6,   unit: '個',    category: '卵・乳製品', purchase_date: fmtDate(-3), expiration_date: fmtDate(10) },
        { id: 'seed-4', name: '玉ねぎ',     quantity: 2,   unit: '個',    category: '野菜',       purchase_date: fmtDate(-4), expiration_date: fmtDate(12) },
        { id: 'seed-5', name: '豆腐',       quantity: 1,   unit: 'パック',category: '加工食品',   purchase_date: fmtDate(0),  expiration_date: fmtDate(2)  },
        { id: 'seed-6', name: '牛乳',       quantity: 1,   unit: '本',    category: '卵・乳製品', purchase_date: fmtDate(-1), expiration_date: fmtDate(3)  },
        { id: 'seed-7', name: '豚バラ肉',   quantity: 200, unit: 'g',     category: '肉類',       purchase_date: fmtDate(0),  expiration_date: fmtDate(3)  },
      ];

      for (const f of seedFoods) {
        await client.query(
          `INSERT INTO foods (id, name, quantity, unit, category, purchase_date, expiration_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [f.id, f.name, f.quantity, f.unit, f.category, f.purchase_date, f.expiration_date]
        );
      }
      console.log('🌱 初期シードデータを投入しました');
    }

    console.log('📦 テーブルの確認・作成が完了しました');
  } finally {
    client.release();
  }
}

export default pool;
