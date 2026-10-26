
import os
import sqlite3
from pathlib import Path

from flask import Flask, request, redirect, url_for, render_template_string
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "fridge.db"

load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ingredient_master (
                ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                category TEXT NOT NULL DEFAULT 'その他',
                default_unit TEXT NOT NULL DEFAULT '個'
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS stock_items (
                stock_id INTEGER PRIMARY KEY AUTOINCREMENT,
                ingredient_id INTEGER NOT NULL,
                quantity REAL NOT NULL DEFAULT 1,
                unit TEXT NOT NULL DEFAULT '個',
                expiry_date TEXT,
                FOREIGN KEY (ingredient_id)
                    REFERENCES ingredient_master(ingredient_id)
            )
        """)


HTML = """
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>冷蔵庫の食材管理</title>
    <style>
        body { max-width: 800px; margin: 40px auto; padding: 0 16px;
               font-family: sans-serif; background: #f5f7f2; color: #26352b; }
        h1 { color: #326b45; }
        form, .item { background: white; padding: 16px; margin: 12px 0;
                      border-radius: 10px; }
        input, select, button { padding: 9px; margin: 4px 0; }
        button { cursor: pointer; }
        .add { background: #326b45; color: white; border: 0; border-radius: 5px; }
        .delete { background: #a93232; color: white; border: 0; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>冷蔵庫の食材管理</h1>
    <p>食材の在庫を登録・確認できます。</p>

    <form method="post" action="{{ url_for('add_item') }}">
        <h2>食材を登録</h2>
        <div>
            <label>食材名</label><br>
            <input name="name" required maxlength="100" placeholder="例：鶏肉">
        </div>
        <div>
            <label>カテゴリー</label><br>
            <select name="category">
                <option>肉・魚</option>
                <option>野菜</option>
                <option>果物</option>
                <option>乳製品</option>
                <option>調味料</option>
                <option>その他</option>
            </select>
        </div>
        <div>
            <label>数量</label><br>
            <input name="quantity" type="number" min="0.01" step="0.01"
                   value="1" required>
            <select name="unit">
                <option>個</option>
                <option>g</option>
                <option>kg</option>
                <option>ml</option>
                <option>L</option>
                <option>本</option>
                <option>パック</option>
            </select>
        </div>
        <div>
            <label>賞味期限（任意）</label><br>
            <input name="expiry_date" type="date">
        </div>
        <button class="add" type="submit">食材を登録する</button>
    </form>

    <h2>冷蔵庫の在庫</h2>
    {% if items %}
        {% for item in items %}
            <div class="item">
                <strong>{{ item.name }}</strong>
                <p>分類：{{ item.category }}</p>
                <p>数量：{{ item.quantity }} {{ item.unit }}</p>
                <p>賞味期限：{{ item.expiry_date or '未設定' }}</p>
                <form method="post"
                      action="{{ url_for('delete_item', stock_id=item.stock_id) }}">
                    <button class="delete" type="submit">削除</button>
                </form>
            </div>
        {% endfor %}
    {% else %}
        <p>食材はまだ登録されていません。</p>
    {% endif %}
</body>
</html>
"""


@app.route("/")
def index():
    with get_db() as conn:
        items = conn.execute("""
            SELECT s.stock_id, m.name, m.category,
                   s.quantity, s.unit, s.expiry_date
            FROM stock_items AS s
            JOIN ingredient_master AS m
              ON s.ingredient_id = m.ingredient_id
            ORDER BY s.stock_id DESC
        """).fetchall()

    return render_template_string(HTML, items=items)


@app.route("/add", methods=["POST"])
def add_item():
    name = request.form.get("name", "").strip()
    category = request.form.get("category", "その他")
    unit = request.form.get("unit", "個")
    expiry_date = request.form.get("expiry_date", "").strip() or None

    try:
        quantity = float(request.form.get("quantity", "1"))
        if not name or quantity <= 0:
            return "食材名と正しい数量を入力してください。", 400
    except ValueError:
        return "数量は数字で入力してください。", 400

    with get_db() as conn:
        conn.execute("""
            INSERT INTO ingredient_master (name, category, default_unit)
            VALUES (?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                category = excluded.category
        """, (name, category, unit))

        ingredient = conn.execute(
            "SELECT ingredient_id FROM ingredient_master WHERE name = ?",
            (name,)
        ).fetchone()

        conn.execute("""
            INSERT INTO stock_items
                (ingredient_id, quantity, unit, expiry_date)
            VALUES (?, ?, ?, ?)
        """, (ingredient["ingredient_id"], quantity, unit, expiry_date))

    return redirect(url_for("index"))


@app.route("/delete/<int:stock_id>", methods=["POST"])
def delete_item(stock_id):
    with get_db() as conn:
        conn.execute(
            "DELETE FROM stock_items WHERE stock_id = ?",
            (stock_id,)
        )

    return redirect(url_for("index"))


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
