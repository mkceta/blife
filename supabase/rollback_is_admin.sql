-- Rollback: Remove is_admin field if it was created
-- Execute this in Supabase SQL Editor if you ran the previous migration

-- Drop the index first
DROP INDEX IF EXISTS idx_users_is_admin;

-- Remove the column
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;

-- Verify it's gone
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_admin';
-- Should return 0 rows
