-- Enable realtime for users table
alter publication supabase_realtime add table users;

-- Ensure users are visible to authenticated users
-- This is usually required for realtime to work properly for other users
drop policy if exists "Users are visible to everyone" on public.users;
create policy "Users are visible to everyone"
    on public.users
    for select
    to authenticated
    using (true);

-- Ensure users can update their own last_seen
drop policy if exists "Users can update own record" on public.users;
create policy "Users can update own record"
    on public.users
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);
