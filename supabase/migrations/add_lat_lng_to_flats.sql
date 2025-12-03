ALTER TABLE flats ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE flats ADD COLUMN IF NOT EXISTS lng double precision;

-- Update existing rows with a default location (A Coruña) to allow setting NOT NULL
UPDATE flats SET lat = 43.3623, lng = -8.4115 WHERE lat IS NULL;

-- Make them mandatory
ALTER TABLE flats ALTER COLUMN lat SET NOT NULL;
ALTER TABLE flats ALTER COLUMN lng SET NOT NULL;
