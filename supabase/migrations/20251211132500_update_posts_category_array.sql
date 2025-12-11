
-- 1. Drop the old default first to avoid casting errors
ALTER TABLE public.posts 
  ALTER COLUMN category DROP DEFAULT;

-- 2. Update posts category column to array of text
ALTER TABLE public.posts 
  ALTER COLUMN category TYPE text[] 
  USING CASE 
    WHEN category IS NULL THEN ARRAY['General']::text[]
    ELSE string_to_array(category, ',') 
  END;

-- 3. Set the new default to an array containing 'General'
ALTER TABLE public.posts 
  ALTER COLUMN category SET DEFAULT ARRAY['General'];
