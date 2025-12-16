-- Versión mejorada del trigger de mensajes con mejor manejo de updates
-- Ejecuta esto en el SQL Editor de Supabase

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
DROP FUNCTION IF EXISTS notify_on_message();

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

    -- Determine recipient
    IF NEW.from_user = v_buyer_id THEN
        v_other_user_id := v_seller_id;
    ELSE
        v_other_user_id := v_buyer_id;
    END IF;

    -- Get sender alias
    SELECT alias_inst INTO v_sender_alias
    FROM public.users
    WHERE id = NEW.from_user;

    -- Get listing title
    SELECT l.title INTO v_listing_title
    FROM public.threads t
    LEFT JOIN public.listings l ON t.listing_id = l.id
    WHERE t.id = NEW.thread_id;

    -- Check for existing UNREAD notification for this thread
    SELECT id INTO v_existing_notification_id
    FROM public.notifications
    WHERE user_id = v_other_user_id
      AND type = 'message'
      AND read = false
      AND metadata->>'thread_id' = NEW.thread_id::text
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_existing_notification_id IS NOT NULL THEN
        -- Count total unread messages from this sender in this thread
        SELECT COUNT(*) INTO v_unread_count
        FROM public.messages m
        WHERE m.thread_id = NEW.thread_id
          AND m.from_user = NEW.from_user
          AND m.created_at >= (
              SELECT created_at 
              FROM public.notifications 
              WHERE id = v_existing_notification_id
          );

        -- Update existing notification
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
            created_at = NOW(), -- Update to bring to top
            metadata = jsonb_build_object(
                'thread_id', NEW.thread_id, 
                'message_id', NEW.id,
                'unread_count', v_unread_count,
                'sender_id', NEW.from_user
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
            jsonb_build_object(
                'thread_id', NEW.thread_id, 
                'message_id', NEW.id, 
                'unread_count', 1,
                'sender_id', NEW.from_user
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_message();
