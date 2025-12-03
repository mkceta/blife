-- 1. Añadir columna last_seen si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_seen') THEN
        ALTER TABLE public.users ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Activar realtime (SOLO si no está ya activo)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;
END $$;

-- 3. Permitir que todos vean el estado de todos
drop policy if exists "Users are visible to everyone" on public.users;
create policy "Users are visible to everyone"
    on public.users
    for select
    to authenticated
    using (true);

-- 4. Permitir que cada usuario actualice su propio estado
drop policy if exists "Users can update own record" on public.users;
create policy "Users can update own record"
    on public.users
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);
