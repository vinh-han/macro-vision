-- ============ DB INFO
-- name: GetInfo :one
select *
from db_info
;

-- name: UpdateInfo :exec
INSERT INTO db_info (version, last_scraped)
VALUES ($1, $2)
ON CONFLICT (version)
DO UPDATE SET
    version = EXCLUDED.version,
    last_scraped = EXCLUDED.last_scraped;

-- ============ Main_dishes
-- name: Get_all_dishes :many
select *
from dishes
;

-- name: Insert_dish :one
INSERT INTO dishes(
	dish_id,
	dish_name,
	course,
	alt_name,
	full_recipe,
	source,
	description,
	date_created
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING dish_id;

-- ============ Ingredients
-- name: Get_all_ingredients :many
select * from ingredients;

-- name: Get_one_ingredient :one
select * from ingredients
where ingredient_id = $1;

-- name: Search_ingredients :many
select * from ingredients
where ingredient_name ILIKE $1;

-- name: Upsert_ingredient :one
INSERT INTO ingredients(
    ingredient_id, ingredient_name, date_created
)
VALUES ($1, $2, $3)
ON CONFLICT (ingredient_name) DO NOTHING
RETURNING ingredient_id;

-- name: Insert_dish_ingredients :exec
INSERT INTO dish_ingredients(
	dish_id,
	ingredient_id,
	amount,
	unit
)
VALUES ($1, $2, $3, $4);

-- ----SESSION-----
-- name: Get_session :one
select *
from sessions
where token = $1
;

-- name: Insert_session :exec
INSERT INTO sessions(
	session_id,
	user_id,
	token,
	expires_at,
	date_created
)
VALUES ($1, $2, $3, $4, $5);

-- name: Remove_session :exec
delete from sessions
where token = $1
;

-- name: Get_token :one
select token
from sessions
where session_id = $1
;

-- ----users-----
-- name: Get_user_from_token :one
select users.*
from sessions
join users on users.user_id = sessions.user_id
where sessions.token = $1
and sessions.expires_at > NOW();

-- name: Get_user_from_name :one
select *
from users
where username = $1
;

-- name: Get_user_from_id :one
select *
from users
where user_id = $1
;

-- name: Insert_user :one
INSERT INTO users(
	user_id,
	username,
	display_name,
	email,
	password_hash,
	date_created
)
VALUES ($1, $2, $3, $4, $5, $6)
returning user_id;

-- name: Edit_user :one
update users
set display_name=$2, email=$3
where user_id=$1
returning display_name, email;

-- name: Change_password :exec
update users
set password_hash=$2
where user_id=$1;

-- name: Get_favorites :many
select dishes.dish_id, dishes.dish_name from dishes
inner join favorites on favorites.dish_id = dishes.dish_id
where favorites.user_id = $1;

-- name: Add_favorites :one
insert into favorites(
    user_id,
    dish_id,
    date_created
)
values($1,$2,$3)
returning dish_id;

-- name: Remove_favorite :one
DELETE FROM favorites
WHERE user_id = $1 AND dish_id = $2
returning dish_id;


-- DISHES --

-- name: Search_dishes :many
SELECT
    d.dish_id,
    d.dish_name,
    d.course,
    d.alt_name,
    d.description,
    COUNT(*) OVER () AS matches
FROM dishes d
JOIN dish_ingredients di
    ON di.dish_id = d.dish_id
WHERE
    d.dish_name ILIKE sqlc.arg(query)
    AND (
        array_length(sqlc.arg(courses)::text[], 1) is null
        OR d.course = ANY(sqlc.arg(courses)::text[])
)

GROUP BY
    d.dish_id
HAVING
    COUNT(di.ingredient_id)

BETWEEN sqlc.arg(min_ingredients)::int AND sqlc.arg(max_ingredients)::int
LIMIT sqlc.arg(return_limit)::int offset sqlc.arg(offset_value)::int ;

-- name: Get_dish :one
select * from dishes
where dish_id = $1;

-- Meal cards --

-- name: Get_meal_cards_daily :many
select * from meal_cards
WHERE meal_date >= $1
  AND meal_date <  $1 + INTERVAL '1 day'
  and user_id=$2;

-- name: Get_meal_cards_monthly :many
SELECT *
FROM meal_cards
WHERE meal_date >= date_trunc('month', $1::timestamptz)
  AND meal_date <  date_trunc('month', $1::timestamptz) + INTERVAL '1 month'
  and user_id=$2;

-- name: Get_card_with_id :one
select * from meal_cards
where card_id = $1 and user_id=$2;

-- name: Get_dishes_in_meal_card :many
select *
from dishes d
join meal_cards_dishes mcd on mcd.dish_id = d.dish_id
where mcd.card_id = $1;

-- name: Update_meal_card_info :one
update meal_cards
set title= $3, meal_date=$4
where card_id=$1 and user_id=$2
returning *;

-- name: Add_dish_to_card :one
insert into meal_cards_dishes(card_id, dish_id)
values($1, $2)
on conflict do nothing
returning card_id;

-- name: Remove_dish_from_card :one
delete from meal_cards_dishes
where card_id=$1 and dish_id=$2
returning card_id;

-- name: Create_meal_card :one
insert into meal_cards(
    card_id,
    user_id,
    title,
    meal_date,
    date_created
)
values($1, $2, $3, $4, $5)
returning *;

-- name: Remove_card :one
delete from meal_cards
where card_id = $1 and user_id = $2
returning card_id;

-- name: Add_dishes_to_card :exec
INSERT INTO meal_cards_dishes (card_id, dish_id)
SELECT
    $1,
    unnest($2::uuid[])
ON CONFLICT DO NOTHING;
