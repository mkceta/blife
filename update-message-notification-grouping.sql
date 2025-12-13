-- Actualizar trigger de mensajes para agrupar notificaciones
-- Ejecuta esto en el SQL Editor de Supabase

-- Primero, eliminar el trigger y función existentes
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
DROP FUNCTION IF EXISTS notify_on_message();

-- Crear nueva función que agrupa notificaciones por thread
CREATE OR REPLACE FUNCTION public.notify_on_message() 
RETURNS TRIGGER AS $$
DECLARE
    v_other_user_id uuid;
    v_sender_alias text;
    v_listing_title text;
    v_buyer_id uuid;
    v_seller_id uuid;
    v_existing_notification_id uuid;
    v_unread_count int;
BEGIN
    -- Get thread participants
    SELECT buyer_id, seller_id INTO v_buyer_id, v_seller_id
    FROM public.threads
    WHERE id = NEW.thread_id;

    -- Determine the recipient (the user who is NOT the sender)
    IF NEW.from_user = v_buyer_id THEN
        v_other_user_id := v_seller_id;
    ELSE
        v_other_user_id := v_buyer_id;
    END IF;

    -- Get sender alias
    SELECT alias_inst INTO v_sender_alias
    FROM public.users
    WHERE id = NEW.from_user;

    -- Get listing title if the thread is linked to a listing
    SELECT l.title INTO v_listing_title
    FROM public.threads t
    LEFT JOIN public.listings l ON t.listing_id = l.id
    WHERE t.id = NEW.thread_id;

    -- Check if there's already an unread notification for this thread
    SELECT id INTO v_existing_notification_id
    FROM public.notifications
    WHERE user_id = v_other_user_id
      AND type = 'message'
      AND read = false
      AND metadata->>'thread_id' = NEW.thread_id::text
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_existing_notification_id IS NOT NULL THEN
        -- Update existing notification with new count
        -- Count unread messages in this thread
        SELECT COUNT(*) INTO v_unread_count
        FROM public.messages
        WHERE thread_id = NEW.thread_id
          AND from_user != v_other_user_id
          AND created_at > (
              SELECT created_at 
              FROM public.notifications 
              WHERE id = v_existing_notification_id
          );

        UPDATE public.notifications
        SET 
            message = CASE 
                WHEN v_unread_count > 1 THEN 
                    '@' || v_sender_alias || ' te envió ' || v_unread_count || ' mensajes' ||
                    CASE WHEN v_listing_title IS NOT NULL THEN ' sobre "' || v_listing_title || '"' ELSE '' END
                ELSE 
                    '@' || v_sender_alias || ' te envió un mensaje' ||
                    CASE WHEN v_listing_title IS NOT NULL THEN ' sobre "' || v_listing_title || '"' ELSE '' END
            END,
            created_at = NOW(), -- Update timestamp to bring it to the top
            metadata = jsonb_build_object(
                'thread_id', NEW.thread_id, 
                'message_id', NEW.id,
                'unread_count', v_unread_count
            )
        WHERE id = v_existing_notification_id;
    ELSE
        -- Create new notification
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            link,
            metadata
        ) VALUES (
            v_other_user_id,
            'message',
            'Nuevo mensaje',
            '@' || v_sender_alias || ' te envió un mensaje' ||
            CASE WHEN v_listing_title IS NOT NULL THEN ' sobre "' || v_listing_title || '"' ELSE '' END,
            '/messages/' || NEW.thread_id,
            jsonb_build_object('thread_id', NEW.thread_id, 'message_id', NEW.id, 'unread_count', 1)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_message();

-- Verificar que se creó correctamente
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_message_created';
