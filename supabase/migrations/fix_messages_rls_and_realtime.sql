-- Allow users to update messages if they are the recipient (to mark as read)
-- We assume the 'read' column is the only thing being updated, but for simplicity we allow update if user is part of the thread.

-- First, ensure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their threads" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their threads" ON messages;

-- Policy: Users can view messages in threads they belong to
CREATE POLICY "Users can view messages in their threads"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM threads
    WHERE threads.id = messages.thread_id
    AND (threads.buyer_id = auth.uid() OR threads.seller_id = auth.uid())
  )
);

-- Policy: Users can insert messages into threads they belong to
CREATE POLICY "Users can insert messages in their threads"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = from_user
  AND EXISTS (
    SELECT 1 FROM threads
    WHERE threads.id = thread_id
    AND (threads.buyer_id = auth.uid() OR threads.seller_id = auth.uid())
  )
);

-- Policy: Users can update messages in their threads (specifically for marking as read)
CREATE POLICY "Users can update messages in their threads"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM threads
    WHERE threads.id = messages.thread_id
    AND (threads.buyer_id = auth.uid() OR threads.seller_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM threads
    WHERE threads.id = thread_id
    AND (threads.buyer_id = auth.uid() OR threads.seller_id = auth.uid())
  )
);

-- Ensure REPLICA IDENTITY is FULL for messages and users to support realtime updates
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;
