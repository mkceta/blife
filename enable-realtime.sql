-- Habilitar Realtime para la tabla posts
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Habilitar replicación para la tabla posts
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- 2. Habilitar publicación de cambios
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- Verificar que está habilitado
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'posts';
