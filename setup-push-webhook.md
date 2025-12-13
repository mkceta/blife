-- Configurar webhook para push notifications
-- IMPORTANTE: Esto NO se ejecuta en SQL Editor, se configura en el Dashboard de Supabase

-- 1. Ve a Database → Webhooks en el dashboard de Supabase
-- 2. Crea un nuevo webhook con estos parámetros:

-- Name: send-push-notification
-- Table: notifications
-- Events: INSERT, UPDATE
-- Type: HTTP Request
-- Method: POST
-- URL: https://[TU-PROJECT-REF].supabase.co/functions/v1/push-notification
-- HTTP Headers:
--   Authorization: Bearer [TU-SERVICE-ROLE-KEY]
--   Content-Type: application/json

-- Conditions (opcional):
-- Solo enviar si read = false

-- Esto enviará automáticamente las notificaciones push cuando:
-- - Se crea una nueva notificación (INSERT)
-- - Se actualiza una notificación existente (UPDATE) - útil para mensajes agrupados

-- ALTERNATIVA: Si prefieres SQL, necesitas habilitar la extensión pg_net primero:
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Luego puedes usar este trigger:
/*
CREATE OR REPLACE FUNCTION public.send_push_notification()
RETURNS TRIGGER AS $$
DECLARE
    request_id bigint;
BEGIN
    IF NEW.read = false THEN
        SELECT net.http_post(
            url := current_setting('app.settings.supabase_url') || '/functions/v1/push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
            ),
            body := jsonb_build_object('record', to_jsonb(NEW))
        ) INTO request_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_notification_push
    AFTER INSERT OR UPDATE ON public.notifications
    FOR EACH ROW
    WHEN (NEW.read = false)
    EXECUTE FUNCTION public.send_push_notification();
*/
