-- Add sale_token and buyer_id to listings table if they don't exist
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS sale_token text UNIQUE,
ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES auth.users(id);

-- Create a function to verify and complete sale
CREATE OR REPLACE FUNCTION complete_sale(token_input text, buyer_id_input uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    listing_record record;
BEGIN
    -- Find the listing with the matching token
    SELECT * INTO listing_record
    FROM listings
    WHERE sale_token = token_input
    AND status != 'sold';

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Update the listing
    UPDATE listings
    SET 
        status = 'sold',
        buyer_id = buyer_id_input,
        sale_token = NULL -- Clear the token so it can't be reused
    WHERE id = listing_record.id;

    RETURN true;
END;
$$;
