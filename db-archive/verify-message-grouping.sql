-- Test para verificar que el trigger de mensajes agrupados funciona
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar que el trigger existe
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages'
AND trigger_name = 'on_message_created';

-- 2. Verificar que la función existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'notify_on_message';

-- 3. Ver las últimas notificaciones creadas (para debugging)
SELECT id, type, title, message, metadata, created_at, read
FROM notifications
WHERE type = 'message'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar estructura de la tabla notifications
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
