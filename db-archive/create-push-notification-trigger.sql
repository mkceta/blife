-- Trigger para enviar push notifications cuando se crea una notificación
-- Ejecuta esto en el SQL Editor de Supabase

-- Crear función que invoca el Edge Function
CREATE OR REPLACE FUNCTION public.send_push_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo enviar push si la notificación no está leída
    IF NEW.read = false THEN
        -- Invocar Edge Function de forma asíncrona
        PERFORM net.http_post(
            url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
            ),
            body := jsonb_build_object(
                'record', jsonb_build_object(
                    'id', NEW.id,
                    'user_id', NEW.user_id,
                    'type', NEW.type,
                    'title', NEW.title,
                    'message', NEW.message,
                    'link', NEW.link
                )
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para INSERT
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.send_push_notification();

-- Crear trigger para UPDATE (cuando se actualiza el mensaje)
DROP TRIGGER IF EXISTS on_notification_updated ON public.notifications;
CREATE TRIGGER on_notification_updated
    AFTER UPDATE ON public.notifications
    FOR EACH ROW
    WHEN (OLD.message IS DISTINCT FROM NEW.message AND NEW.read = false)
    EXECUTE FUNCTION public.send_push_notification();

-- Verificar que se crearon
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'notifications'
AND trigger_name IN ('on_notification_created', 'on_notification_updated');
