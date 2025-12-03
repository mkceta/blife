ALTER TABLE flats ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}';
