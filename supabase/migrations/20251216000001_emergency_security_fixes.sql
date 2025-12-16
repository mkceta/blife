-- EMERGENCY SECURITY FIXES
-- Run this IMMEDIATELY on production

-- ============================================
-- 1. ENABLE RLS ON STRIPE TABLES
-- ============================================

-- STRIPE TABLES SECTION SKIPPED
-- The following Stripe tables don't exist in production yet
-- Uncomment when Stripe integration is fully deployed

-- ALTER TABLE IF EXISTS stripe_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS stripe_orders ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
-- DROP POLICY IF EXISTS "Users can view own stripe account" ON stripe_accounts;
-- DROP POLICY IF EXISTS "Users can update own stripe account" ON stripe_accounts;
-- DROP POLICY IF EXISTS "Users can view orders they're involved in" ON stripe_orders;

-- Stripe Accounts: Users can only see their own
-- CREATE POLICY "Users can view own stripe account"
-- ON stripe_accounts FOR SELECT
-- USING (auth.uid() = user_id);

-- CREATE POLICY "Users can update own stripe account"
-- ON stripe_accounts FOR UPDATE
-- USING (auth.uid() = user_id);

-- Stripe Orders: Users can see orders where they're buyer OR seller
-- CREATE POLICY "Users can view orders they're involved in"
-- ON stripe_orders FOR SELECT
-- USING (
--   auth.uid() = buyer_id 
--   OR auth.uid() IN (
--     SELECT user_id FROM listings WHERE id = listing_id
--   )
-- );

-- ============================================
-- 2. REMOVE DEBUG TABLES (PRODUCTION)
-- ============================================

-- Remove insecure debug_logs table
DROP POLICY IF EXISTS "Allow public insert for debugging" ON debug_logs;
DROP POLICY IF EXISTS "Allow public select for debugging" ON debug_logs;
DROP TABLE IF EXISTS debug_logs CASCADE;

-- ============================================
-- 3. ADD INPUT VALIDATION TO RPC FUNCTIONS
-- ============================================

-- Fix increment_listing_views with validation
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id uuid)
RETURNS void AS $$
BEGIN
  -- Validate listing exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM listings 
    WHERE id = listing_id 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive listing';
  END IF;
  
  -- Update views
  UPDATE listings
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix increment_favorites with validation
CREATE OR REPLACE FUNCTION increment_favorites(listing_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM listings WHERE id = listing_id) THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  
  UPDATE listings
  SET favorites_count = COALESCE(favorites_count, 0) + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix decrement_favorites with validation
CREATE OR REPLACE FUNCTION decrement_favorites(listing_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM listings WHERE id = listing_id) THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  
  UPDATE listings
  SET favorites_count = GREATEST(COALESCE(favorites_count, 0) - 1, 0)
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix increment_reactions with validation
CREATE OR REPLACE FUNCTION increment_reactions(post_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM posts WHERE id = post_id) THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  
  UPDATE posts
  SET reactions_count = COALESCE(reactions_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix decrement_reactions with validation
CREATE OR REPLACE FUNCTION decrement_reactions(post_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM posts WHERE id = post_id) THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  
  UPDATE posts
  SET reactions_count = GREATEST(COALESCE(reactions_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. ADD RATE LIMITING TABLE (OPTIONAL)
-- ============================================

-- Track function calls to prevent abuse
CREATE TABLE IF NOT EXISTS function_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  called_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_function ON function_rate_limits(user_id, function_name, called_at);

-- Enable RLS
ALTER TABLE function_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
ON function_rate_limits FOR SELECT
USING (auth.uid() = user_id);

-- Auto-cleanup old entries (optional)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM function_rate_limits
  WHERE called_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. AUDIT EXISTING POLICIES
-- ============================================

-- List all tables without RLS enabled
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename
  FROM pg_tables t
  WHERE rowsecurity = true
)
ORDER BY tablename;

-- This will show which tables need RLS enabled
-- Review each one and decide if RLS is needed

COMMENT ON FUNCTION increment_listing_views(uuid) IS 'Increments listing view count with validation';
COMMENT ON FUNCTION increment_favorites(uuid) IS 'Increments favorites count with validation';
COMMENT ON FUNCTION decrement_favorites(uuid) IS 'Decrements favorites count with validation';
COMMENT ON FUNCTION increment_reactions(uuid) IS 'Increments reactions count with validation';
COMMENT ON FUNCTION decrement_reactions(uuid) IS 'Decrements reactions count with validation';
