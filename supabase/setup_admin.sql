-- Script para configurar administradores
-- Ejecuta esto en el SQL Editor de Supabase Dashboard

-- 1. Verificar que el campo is_admin existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_admin';

-- 2. Ver usuarios actuales (para encontrar tu ID)
SELECT id, email, alias_inst, is_admin 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Hacer admin a un usuario específico (reemplaza con tu email)
-- UPDATE users 
-- SET is_admin = true 
-- WHERE email = 'marcos.alfonso.grandas@udc.es';

-- 4. Verificar que funcionó
-- SELECT id, email, alias_inst, is_admin 
-- FROM users 
-- WHERE is_admin = true;
