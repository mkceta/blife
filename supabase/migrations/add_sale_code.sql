-- Add sale_code to listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS sale_code text;

-- Update complete_sale to handle code lookup if needed, 
-- but we might just look up the token from the code in the app layer 
-- to reuse the existing verify page.
