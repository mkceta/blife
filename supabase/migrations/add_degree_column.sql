-- Add degree and session_duration columns to users table
alter table public.users add column if not exists degree text;
alter table public.users add column if not exists session_duration integer default 604800;

-- Add comments
comment on column public.users.degree is 'User''s university degree/major';
comment on column public.users.session_duration is 'Session duration in seconds (default 7 days)';
