-- ============ Main_dishes
-- name: Get_all_dishes :many
select *
from dishes
;

-- name: Insert_dish :one
INSERT INTO dishes(
	 name, course, alt_name, full_recipe, source, description, date_created
)
VALUES(?,?,?,?,?,?,?)
RETURNING id;

-- ============ Ingredients
-- name: Upsert_ingredient :one
INSERT INTO ingredients(
	 name, date_created
)
values(?,?)
ON CONFLICT(name) DO NOTHING
RETURNING id;

-- name: Insert_dish_ingredients :exec
INSERT INTO dish_ingredients(
	dish_id, ingredient_id, amount, unit
)
VALUES(?,?,?,?);
