-- Habilitar Supabase Realtime para las tablas de encuestas
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Habilitar replicación para polls
ALTER PUBLICATION supabase_realtime ADD TABLE polls;

-- 2. Habilitar replicación para poll_options
ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;

-- 3. Habilitar replicación para poll_votes
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;

-- 4. Verificar que se habilitó correctamente
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('polls', 'poll_options', 'poll_votes');
