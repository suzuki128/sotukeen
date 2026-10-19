
from database import (
    add_ingredient,
    get_ingredients,
    add_stock,
    get_stock,
    update_stock,
    delete_stock
)

ingredient_id = add_ingredient("鶏むね肉", "肉", "g")

stock_id = add_stock(
    ingredient_id,
    500,
    "g",
    "2026-10-15",
    "2026-10-18"
)

print("食材一覧")

for ingredient in get_ingredients():
    print(dict(ingredient))

print("在庫一覧")

for stock in get_stock():
    print(dict(stock))

update_stock(stock_id, 300)
print("在庫を300gに変更しました")

print("変更後の在庫")

for stock in get_stock():
    print(dict(stock))

delete_stock(stock_id)
print("在庫を削除しました")
