
import sqlite3

DB_NAME = "fridge.db"


def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def create_tables():
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS ingredient_master (
                ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                category TEXT,
                default_unit TEXT NOT NULL DEFAULT '個'
            );

            CREATE TABLE IF NOT EXISTS receipts (
                receipt_id INTEGER PRIMARY KEY AUTOINCREMENT,
                image_path TEXT,
                ocr_text TEXT,
                status TEXT NOT NULL DEFAULT '確認待ち',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS stock_items (
                stock_id INTEGER PRIMARY KEY AUTOINCREMENT,
                ingredient_id INTEGER NOT NULL,
                quantity REAL NOT NULL DEFAULT 0
                    CHECK (quantity >= 0),
                unit TEXT NOT NULL,
                purchase_date TEXT,
                expiry_date TEXT,
                receipt_id INTEGER,
                FOREIGN KEY (ingredient_id)
                    REFERENCES ingredient_master(ingredient_id),
                FOREIGN KEY (receipt_id)
                    REFERENCES receipts(receipt_id)
            );

            CREATE TABLE IF NOT EXISTS receipt_items (
                receipt_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                receipt_id INTEGER NOT NULL,
                product_name TEXT NOT NULL,
                quantity REAL,
                unit TEXT,
                ingredient_id INTEGER,
                confirmed INTEGER NOT NULL DEFAULT 0
                    CHECK (confirmed IN (0, 1)),
                FOREIGN KEY (receipt_id)
                    REFERENCES receipts(receipt_id),
                FOREIGN KEY (ingredient_id)
                    REFERENCES ingredient_master(ingredient_id)
            );

            CREATE TABLE IF NOT EXISTS recipes (
                recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                mood TEXT,
                cooking_minutes INTEGER,
                servings INTEGER NOT NULL DEFAULT 1,
                instructions TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS recipe_ingredients (
                recipe_ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipe_id INTEGER NOT NULL,
                ingredient_id INTEGER,
                ingredient_name TEXT NOT NULL,
                quantity REAL,
                unit TEXT,
                is_optional INTEGER NOT NULL DEFAULT 0
                    CHECK (is_optional IN (0, 1)),
                FOREIGN KEY (recipe_id)
                    REFERENCES recipes(recipe_id) ON DELETE CASCADE,
                FOREIGN KEY (ingredient_id)
                    REFERENCES ingredient_master(ingredient_id)
            );

            CREATE INDEX IF NOT EXISTS idx_stock_ingredient
                ON stock_items(ingredient_id);

            CREATE INDEX IF NOT EXISTS idx_stock_expiry
                ON stock_items(expiry_date);

            CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe
                ON recipe_ingredients(recipe_id);
        """)


def add_ingredient(name, category, default_unit="個"):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO ingredient_master (name, category, default_unit)
            VALUES (?, ?, ?)
            """,
            (name, category, default_unit)
        )
        return cursor.lastrowid


def add_stock(ingredient_id, quantity, unit,
              purchase_date=None, expiry_date=None, receipt_id=None):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO stock_items (
                ingredient_id, quantity, unit,
                purchase_date, expiry_date, receipt_id
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                ingredient_id, quantity, unit,
                purchase_date, expiry_date, receipt_id
            )
        )
        return cursor.lastrowid


def get_stock():
    with get_connection() as conn:
        return conn.execute("""
            SELECT
                s.stock_id,
                i.name,
                i.category,
                s.quantity,
                s.unit,
                s.purchase_date,
                s.expiry_date
            FROM stock_items AS s
            JOIN ingredient_master AS i
                ON s.ingredient_id = i.ingredient_id
            ORDER BY s.expiry_date
        """).fetchall()


def update_stock(stock_id, quantity):
    if quantity < 0:
        raise ValueError("数量は0以上にしてください")

    with get_connection() as conn:
        cursor = conn.execute(
            "UPDATE stock_items SET quantity = ? WHERE stock_id = ?",
            (quantity, stock_id)
        )
        return cursor.rowcount > 0


def delete_stock(stock_id):
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM stock_items WHERE stock_id = ?",
            (stock_id,)
        )
        return cursor.rowcount > 0


def add_receipt(image_path=None, ocr_text=None):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO receipts (image_path, ocr_text)
            VALUES (?, ?)
            """,
            (image_path, ocr_text)
        )
        return cursor.lastrowid


def add_receipt_item(receipt_id, product_name,
                     quantity=None, unit=None, ingredient_id=None):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO receipt_items (
                receipt_id, product_name, quantity,
                unit, ingredient_id
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (receipt_id, product_name, quantity, unit, ingredient_id)
        )
        return cursor.lastrowid


def add_recipe(name, mood, cooking_minutes,
               servings, instructions, ingredients):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO recipes (
                name, mood, cooking_minutes, servings, instructions
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (name, mood, cooking_minutes, servings, instructions)
        )
        recipe_id = cursor.lastrowid

        for item in ingredients:
            conn.execute(
                """
                INSERT INTO recipe_ingredients (
                    recipe_id, ingredient_id, ingredient_name,
                    quantity, unit, is_optional
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    recipe_id,
                    item.get("ingredient_id"),
                    item["ingredient_name"],
                    item.get("quantity"),
                    item.get("unit"),
                    item.get("is_optional", 0)
                )
            )

        return recipe_id


def get_recipes():
    with get_connection() as conn:
        recipes = conn.execute(
            "SELECT * FROM recipes ORDER BY recipe_id DESC"
        ).fetchall()

        result = []

        for recipe in recipes:
            ingredients = conn.execute(
                """
                SELECT ingredient_name, quantity, unit, is_optional
                FROM recipe_ingredients
                WHERE recipe_id = ?
                """,
                (recipe["recipe_id"],)
            ).fetchall()

            result.append({
                "recipe": dict(recipe),
                "ingredients": [dict(item) for item in ingredients]
            })

        return result


if __name__ == "__main__":
    create_tables()
    print("データベースと6つのテーブルを作成しました。")
