-- Add last_seen column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_seen') THEN
        ALTER TABLE public.users ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Enable realtime for users table
alter publication supabase_realtime add table users;

-- Ensure users are visible to authenticated users
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
