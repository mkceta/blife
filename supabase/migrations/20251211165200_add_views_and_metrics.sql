-- Add views_count to listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Function to increment views safely
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE listings
  SET views_count = views_count + 1
  WHERE id = listing_id;
END;
$$;

-- Function to get average likes (favorites)
CREATE OR REPLACE FUNCTION get_average_listing_favorites()
RETURNS float
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_favs float;
BEGIN
  SELECT AVG(favorites_count) INTO avg_favs FROM listings WHERE status = 'active';
  RETURN COALESCE(avg_favs, 0);
END;
$$;
