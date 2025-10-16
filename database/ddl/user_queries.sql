-- ----user_info-----
-- name: Get_password :one
select password_hash
from user_info
;

-- name: Insert_user_info :exec
insert into user_info(password_hash, date_created)
values(?,?);

