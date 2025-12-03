-- Add read column to messages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'read') THEN
        ALTER TABLE public.messages ADD COLUMN read BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
END $$;

-- Enable realtime for messages table if not already (it likely is, but good to ensure for the read status update)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
END $$;

-- Set replica identity to full to ensure we get updates
ALTER TABLE messages REPLICA IDENTITY FULL;
