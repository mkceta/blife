-- Add indexes to improve filtering and sorting performance on the listings table

-- 1. Index for Price Filtering and Sorting (Used in Min/Max Price and Price Asc/Desc)
CREATE INDEX IF NOT EXISTS idx_listings_price_cents ON listings (price_cents);

-- 2. Index for User Filtering (Used in Profile and "My Listings")
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings (user_id);

-- 3. Index for Creation Date (Used in "Newest" sort/Discovery)
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings (created_at DESC);

-- 4. Index for Status (To quickly filter out 'sold' items)
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status);

-- 5. Composite Index for Category + Status (Common filter combination)
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON listings (category, status);

-- 6. Index for Favorites Count (Used in "Most Liked" sort)
CREATE INDEX IF NOT EXISTS idx_listings_favorites_count ON listings (favorites_count DESC);
