-- Add comments table for community posts
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add comments_count to posts table
alter table public.posts add column if not exists comments_count int default 0;

-- Enable RLS for comments
alter table public.comments enable row level security;

-- Policies for comments
create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Users can insert own comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can update own comments" on public.comments for update using (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Index for performance
create index if not exists idx_comments_post_id on public.comments(post_id, created_at desc);

-- Trigger to update comments count
create or replace function update_post_comments_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.posts set comments_count = comments_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_comment_insert_delete
  after insert or delete on public.comments
  for each row execute procedure update_post_comments_count();
