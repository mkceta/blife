create table if not exists public.snake_leaderboard (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  score int not null default 0,
  created_at timestamptz default now()
);

-- Ensure one entry per user to store their High Score
alter table public.snake_leaderboard add constraint snake_leaderboard_user_id_key unique (user_id);

-- Index for sorting
create index if not exists idx_snake_leaderboard_score on public.snake_leaderboard(score desc);

-- RLS Policies
alter table public.snake_leaderboard enable row level security;

create policy "Leaderboard viewable by everyone" 
  on public.snake_leaderboard for select 
  using (true);

create policy "Users can insert own score" 
  on public.snake_leaderboard for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own score" 
  on public.snake_leaderboard for update 
  using (auth.uid() = user_id);
