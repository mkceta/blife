-- Enable RLS on threads table
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own threads" ON threads;
DROP POLICY IF EXISTS "Users can insert threads" ON threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON threads;

-- Policy: Users can view threads where they are the buyer or seller
CREATE POLICY "Users can view their own threads"
ON threads FOR SELECT
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Policy: Users can insert threads (usually initiated by buyer)
CREATE POLICY "Users can insert threads"
ON threads FOR INSERT
WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Policy: Users can update their own threads (e.g. last_message_at)
CREATE POLICY "Users can update their own threads"
ON threads FOR UPDATE
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Ensure realtime is enabled for threads
ALTER PUBLICATION supabase_realtime ADD TABLE threads;
ALTER TABLE threads REPLICA IDENTITY FULL;
