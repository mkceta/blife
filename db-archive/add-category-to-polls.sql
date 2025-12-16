-- Añadir categoría a las encuestas
-- Ejecuta esto en el SQL Editor de Supabase

ALTER TABLE polls ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- Actualizar RLS para incluir categoría
DROP POLICY IF EXISTS "Users can create their own polls" ON polls;
CREATE POLICY "Users can create their own polls" ON polls 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verificar
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'polls';
