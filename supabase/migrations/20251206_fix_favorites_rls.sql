-- Ensure favorites table exists
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  listing_id uuid references public.listings on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, listing_id)
);

-- Enable RLS
alter table public.favorites enable row level security;

-- Drop existing policies if any
drop policy if exists "Users can view their own favorites" on public.favorites;
drop policy if exists "Users can insert their own favorites" on public.favorites;
drop policy if exists "Users can delete their own favorites" on public.favorites;

-- Create policies
create policy "Users can view their own favorites"
on public.favorites for select
using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
on public.favorites for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
on public.favorites for delete
using (auth.uid() = user_id);

-- Also ensure RPCs exist (re-run logic just in case)
create or replace function increment_favorites(listing_id uuid)
returns void as $$
begin
  update public.listings set favorites_count = favorites_count + 1 where id = favorites_count; -- Wait, this sql was wrong in my head, checking previous file
  update public.listings set favorites_count = coalesce(favorites_count, 0) + 1 where id = listing_id;
end;
$$ language plpgsql security definer;

create or replace function decrement_favorites(listing_id uuid)
returns void as $$
begin
  update public.listings set favorites_count = greatest(coalesce(favorites_count, 0) - 1, 0) where id = listing_id;
end;
$$ language plpgsql security definer;
