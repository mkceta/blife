-- Comprehensive fix for users table, RLS, and presence

-- 1. Ensure last_seen column exists (using standard SQL)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- 2. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users are visible to everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 4. Create Policies

-- Allow everyone (authenticated) to view users
CREATE POLICY "Users are visible to everyone"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own record
CREATE POLICY "Users can update own record"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Create/Update the presence RPC function
CREATE OR REPLACE FUNCTION public.update_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET last_seen = now()
  WHERE id = auth.uid();
END;
$$;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.update_presence() TO authenticated;

-- 7. Ensure Realtime is enabled for users
-- We try to add the table to the publication. If it fails because it's already there, we ignore it.
-- But since we can't easily ignore errors in standard SQL script without DO block, we will use a DO block but keep it simple.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END $$;

-- 8. Set Replica Identity to FULL to ensure we get all columns in realtime updates
ALTER TABLE public.users REPLICA IDENTITY FULL;
