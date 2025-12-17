-- Migration: Add is_admin field to users table
-- Created: 2025-12-17
-- Purpose: Enable admin role verification for security-critical operations

-- Add is_admin column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Add comment for documentation
COMMENT ON COLUMN users.is_admin IS 'Indicates if user has administrator privileges. Used for ban/unban operations and other admin-only features.';

-- Optional: Set specific users as admin (replace with actual admin user IDs)
-- UPDATE users SET is_admin = true WHERE email = 'your-admin-email@udc.es';

-- Grant necessary permissions (if using RLS)
-- Users should be able to read their own is_admin status
-- Only admins should be able to modify it (handled at application level)
