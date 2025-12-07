-- Add new columns for listing attributes
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS condition text;

-- Add comment to document usage
COMMENT ON COLUMN listings.brand IS 'Brand of the item (e.g. Zara, Nike). Mainly for Clothing.';
COMMENT ON COLUMN listings.size IS 'Size of the item (e.g. M, 42, XL). Mainly for Clothing.';
COMMENT ON COLUMN listings.condition IS 'Condition of the item (e.g. New, Used, Good).';
