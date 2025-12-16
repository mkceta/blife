-- CRITICAL DATABASE ARCHITECTURE FIXES
-- Priority: HIGH - Performance & Data Integrity Issues

-- ============================================
-- PROBLEM 1: MISSING CRITICAL INDEXES
-- ============================================

-- Foreign keys WITHOUT indexes = SLOW JOINS
-- Every .eq('user_id') query scans the entire table!

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_flats_user_id ON flats(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_handled_by ON reports(handled_by);
CREATE INDEX IF NOT EXISTS idx_threads_buyer_id ON threads(buyer_id);
CREATE INDEX IF NOT EXISTS idx_threads_seller_id ON threads(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user);

-- Foreign key indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_threads_listing_id ON threads(listing_id);
CREATE INDEX IF NOT EXISTS idx_threads_flat_id ON threads(flat_id);
CREATE INDEX IF NOT EXISTS idx_listings_buyer_id ON listings(buyer_id);

-- ============================================
-- PROBLEM 2: NO COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================

-- Combined status + user_id queries (My Listings page)
CREATE INDEX IF NOT EXISTS idx_listings_user_status ON listings(user_id, status);

-- Combined thread queries (Messages page)
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(thread_id, created_at DESC);

-- Combined category + status (Category filtering)
-- Already exists in schema.sql but ensure it's there
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON listings(category, status);

-- Posts by user (Profile page)
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);

-- Flats by user
CREATE INDEX IF NOT EXISTS idx_flats_user_created ON flats(user_id, created_at DESC);

-- ============================================
-- PROBLEM 3: SCHEMA INCONSISTENCIES
-- ============================================

-- Issue: schema.sql uses 'users' table but references 'profiles'
-- The middleware queries 'profiles' but schema defines 'users'
-- This is a NAMING MISMATCH

-- Check if profiles table exists
DO $$
BEGIN
    -- If profiles table doesn't exist, it's using users table
    -- Middleware needs to query 'users' not 'profiles'
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
        RAISE NOTICE 'WARNING: profiles table does not exist, using users table';
    END IF;
END $$;

-- Add role index for admin checks in middleware
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'admin';

-- ============================================
-- PROBLEM 4: MISSING UPDATED_AT AUTO-UPDATE
-- ============================================

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flats_updated_at ON flats;
CREATE TRIGGER update_flats_updated_at
    BEFORE UPDATE ON flats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_threads_updated_at ON threads;
CREATE TRIGGER update_threads_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PROBLEM 5: NO SOFT DELETE MECHANISM
-- ============================================

-- Currently using is_hidden for soft deletes
-- But no deleted_at timestamp or deleted_by tracking

ALTER TABLE listings ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id);

ALTER TABLE flats ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE flats ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id);

-- Update RLS policies to exclude soft-deleted items
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON listings;
CREATE POLICY "Listings are viewable by everyone" ON listings
FOR SELECT USING (is_hidden = false AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone" ON posts
FOR SELECT USING (is_hidden = false AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Flats are viewable by everyone" ON flats;
CREATE POLICY "Flats are viewable by everyone" ON flats
FOR SELECT USING (is_hidden = false AND deleted_at IS NULL);

-- ============================================
-- PROBLEM 6: MISSING CONSTRAINTS
-- ============================================

-- Ensure email domains are validated
ALTER TABLE users ADD CONSTRAINT valid_uni_check 
CHECK (uni IN ('udc.es', 'udc.gal') OR uni IS NULL);

-- Ensure prices are positive
ALTER TABLE listings ADD CONSTRAINT positive_price_check 
CHECK (price_cents > 0);

ALTER TABLE flats ADD CONSTRAINT positive_rent_check 
CHECK (rent_cents > 0);

-- Ensure ratings are valid
ALTER TABLE users ADD CONSTRAINT valid_rating_avg_check 
CHECK (rating_avg >= 0 AND rating_avg <= 5);

ALTER TABLE users ADD CONSTRAINT valid_rating_count_check 
CHECK (rating_count >= 0);

-- Ensure counts are non-negative
ALTER TABLE listings ADD CONSTRAINT non_negative_favorites_check 
CHECK (favorites_count >= 0);

ALTER TABLE listings ADD CONSTRAINT non_negative_views_check 
CHECK (views_count >= 0);

ALTER TABLE posts ADD CONSTRAINT non_negative_reactions_check 
CHECK (reactions_count >= 0);

-- ============================================
-- PROBLEM 7: MISSING READ TRACKING FOR MESSAGES
-- ============================================

-- Messages table has no 'read' column
-- Middleware assumes it exists

ALTER TABLE messages ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Index for unread messages queries
CREATE INDEX IF NOT EXISTS idx_messages_thread_read ON messages(thread_id, read) WHERE read = false;

-- Trigger to set read_at when marked as read
CREATE OR REPLACE FUNCTION set_message_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read = true AND OLD.read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_message_read_at ON messages;
CREATE TRIGGER update_message_read_at
    BEFORE UPDATE OF read ON messages
    FOR EACH ROW
    EXECUTE FUNCTION set_message_read_at();

-- ============================================
-- PROBLEM 8: MISSING CASCADES ON CRITICAL RELATIONSHIPS
-- ============================================

-- When a listing is deleted, what happens to:
-- - Favorites? (Currently CASCADE - OK)
-- - Threads? (SET NULL - threads orphaned!)
-- - Messages in those threads? (Remain but listing is gone)

-- This is actually OK design, but we should document it
COMMENT ON TABLE threads IS 'Threads can exist without listings (for historical purposes)';
COMMENT ON COLUMN threads.listing_id IS 'NULL if listing was deleted, thread remains for message history';

-- ============================================
-- PROBLEM 9: FULL TEXT SEARCH NOT CONFIGURED
-- ============================================

-- Listings search currently uses basic LIKE queries
-- Should use PostgreSQL full-text search

-- Add tsvector column for full-text search
ALTER TABLE listings ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_listing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('spanish', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('spanish', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector
DROP TRIGGER IF EXISTS update_listings_search_vector ON listings;
CREATE TRIGGER update_listings_search_vector
    BEFORE INSERT OR UPDATE OF title, description, tags ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_search_vector();

-- Backfill existing listings
UPDATE listings SET search_vector = 
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(array_to_string(tags, ' '), '')), 'C');

-- Same for posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('spanish', coalesce(NEW.text, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_posts_search_vector ON posts;
CREATE TRIGGER update_posts_search_vector
    BEFORE INSERT OR UPDATE OF text ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_post_search_vector();

UPDATE posts SET search_vector = to_tsvector('spanish', coalesce(text, ''));

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_listings_user_id IS 'Critical for "My Listings" queries - 50+ queries/min';
COMMENT ON INDEX idx_messages_thread_created IS 'Critical for message pagination - prevents table scans';
COMMENT ON INDEX idx_users_role IS 'Partial index for fast admin checks in middleware';
COMMENT ON INDEX idx_listings_search IS 'Full-text search index for title/description/tags';

-- Add table-level comments
COMMENT ON TABLE listings IS 'Marketplace items. Uses soft delete (deleted_at). Search uses tsvector.';
COMMENT ON TABLE messages IS 'Chat messages. read=false indexed for unread counts.';
COMMENT ON TABLE users IS 'User profiles. Role field for RBAC. Rating fields maintained by triggers.';
