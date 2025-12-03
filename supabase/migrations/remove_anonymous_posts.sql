-- Remove anonymous posts functionality from database

-- Remove is_anonymous column from posts table
alter table public.posts drop column if exists is_anonymous;

-- Remove alias_anon column from users table  
alter table public.users drop column if exists alias_anon;
