-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION increment_listing_views(uuid) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_average_listing_favorites() TO postgres, anon, authenticated, service_role;

-- Ensure listings table allows updates to views_count if we weren't using SECURITY DEFINER (we are, but good practice to check RLS if we changed approach)
-- For SECURITY DEFINER functions, the function runs with owner permissions, so RLS on table is bypassed.
-- The issue is likely the EXECUTE permission on the function itself.
