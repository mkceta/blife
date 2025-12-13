-- Añadir columna metadata a la tabla notifications
-- Ejecuta esto en el SQL Editor de Supabase

-- Añadir la columna metadata si no existe
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
ORDER BY ordinal_position;
