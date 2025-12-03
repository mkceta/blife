-- Eliminar el trigger de mensajes que está causando el error
DROP TRIGGER IF EXISTS on_message_created ON messages;
DROP FUNCTION IF EXISTS notify_on_message();
