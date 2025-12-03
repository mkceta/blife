-- Fix notifications permissions and realtime

-- 1. Ensure Realtime is enabled for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

-- 4. Create Policies

-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert notifications (e.g. for testing or specific flows, though usually server-side)
-- But importantly, for Realtime to work for the receiver, the receiver must have SELECT permission.
-- The sender might need INSERT permission.
CREATE POLICY "Users can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true); 
-- We allow insert for now to ensure no blockers, but ideally should restrict to system or specific logic.

-- 5. Set Replica Identity to FULL to ensure we get all columns in realtime updates
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
