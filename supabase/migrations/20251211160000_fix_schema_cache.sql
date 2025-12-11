-- Force schema cache reload
NOTIFY pgrst, 'reload config';

-- Ensure emoji column exists (safety net)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reactions' AND column_name = 'emoji') THEN
        ALTER TABLE public.reactions ADD COLUMN emoji TEXT DEFAULT '❤️';
        -- Add check constraint separately to avoid failures if exists (?)
    END IF;
END $$;
