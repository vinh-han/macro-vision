-- name: Get_session :one
select *
from sessions
where token = ?
;

-- name: Insert_session :one
insert into sessions(username, token, expires_at, date_created)
values (?,?,?,?)
returning *;

-- name: Remove_session :exec
delete from sessions
where token = ?
;

