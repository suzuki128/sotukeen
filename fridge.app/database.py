
import os
import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/fridge_db"
)


def get_connection():
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row
    )


def add_ingredient(name, category, default_unit="個"):
    with get_connection() as conn:
        result = conn.execute(
            """
            INSERT INTO ingredient_master (name, category, default_unit)
            VALUES (%s, %s, %s)
            ON CONFLICT (name)
            DO UPDATE SET
                category = EXCLUDED.category,
                default_unit = EXCLUDED.default_unit
            RETURNING ingredient_id
            """,
            (name, category, default_unit)
        ).fetchone()

        return result["ingredient_id"]


def get_ingredients():
    with get_connection() as conn:
        return conn.execute(
            """
            SELECT ingredient_id, name, category, default_unit
            FROM ingredient_master
            ORDER BY name
            """
        ).fetchall()


def add_stock(
    ingredient_id,
    quantity,
    unit,
    purchase_date=None,
    expiry_date=None,
    receipt_id=None
):
    with get_connection() as conn:
        result = conn.execute(
            """
            INSERT INTO stock_items (
                ingredient_id, quantity, unit,
                purchase_date, expiry_date, receipt_id
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING stock_id
            """,
            (
                ingredient_id, quantity, unit,
                purchase_date, expiry_date, receipt_id
            )
        ).fetchone()

        return result["stock_id"]


def get_stock():
    with get_connection() as conn:
        return conn.execute(
            """
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
            ORDER BY s.expiry_date NULLS LAST, i.name
            """
        ).fetchall()


def update_stock(stock_id, quantity):
    if quantity < 0:
        raise ValueError("数量は0以上にしてください")

    with get_connection() as conn:
        result = conn.execute(
            """
            UPDATE stock_items
            SET quantity = %s
            WHERE stock_id = %s
            RETURNING stock_id
            """,
            (quantity, stock_id)
        ).fetchone()

        return result is not None


def delete_stock(stock_id):
    with get_connection() as conn:
        result = conn.execute(
            """
            DELETE FROM stock_items
            WHERE stock_id = %s
            RETURNING stock_id
            """,
            (stock_id,)
        ).fetchone()

        return result is not None


def add_receipt(image_path=None, ocr_text=None):
    with get_connection() as conn:
        result = conn.execute(
            """
            INSERT INTO receipts (image_path, ocr_text)
            VALUES (%s, %s)
            RETURNING receipt_id
            """,
            (image_path, ocr_text)
        ).fetchone()

        return result["receipt_id"]


def add_receipt_item(
    receipt_id,
    product_name,
    quantity=None,
    unit=None,
    ingredient_id=None
):
    with get_connection() as conn:
        result = conn.execute(
            """
            INSERT INTO receipt_items (
                receipt_id, product_name, quantity,
                unit, ingredient_id
            )
            VALUES (%s, %s, %s, %s, %s)
            RETURNING receipt_item_id
            """,
            (receipt_id, product_name, quantity, unit, ingredient_id)
        ).fetchone()

        return result["receipt_item_id"]


def add_recipe(
    name,
    mood,
    cooking_minutes,
    servings,
    instructions,
    ingredients
):
    with get_connection() as conn:
        result = conn.execute(
            """
            INSERT INTO recipes (
                name, mood, cooking_minutes, servings, instructions
            )
            VALUES (%s, %s, %s, %s, %s)
            RETURNING recipe_id
            """,
            (name, mood, cooking_minutes, servings, instructions)
        ).fetchone()

        recipe_id = result["recipe_id"]

        for item in ingredients:
            conn.execute(
                """
                INSERT INTO recipe_ingredients (
                    recipe_id, ingredient_id, ingredient_name,
                    quantity, unit, is_optional
                )
                VALUES (%s, %s, %s, %s, %s, %s)
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
            """
            SELECT *
            FROM recipes
            ORDER BY recipe_id DESC
            """
        ).fetchall()

        result = []

        for recipe in recipes:
            ingredients = conn.execute(
                """
                SELECT ingredient_name, quantity, unit, is_optional
                FROM recipe_ingredients
                WHERE recipe_id = %s
                """,
                (recipe["recipe_id"],)
            ).fetchall()

            result.append({
                "recipe": dict(recipe),
                "ingredients": [dict(item) for item in ingredients]
            })

        return result
