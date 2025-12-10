ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Policy to allow users to update reactions on messages in threads they belong to
-- (Assuming standard RLS allows update if they participate)
-- If not, we might need a specific policy or RPC function. 
-- For now, letting 'update' on messages works if the RLS allows it.
