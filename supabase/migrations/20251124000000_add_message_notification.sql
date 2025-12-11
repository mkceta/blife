-- Migration to add message notification trigger
-- This migration creates the notify_on_message function and its trigger.
-- It uses the correct column names (from_user, thread_id) from the messages table.

DROP TRIGGER IF EXISTS on_message_created ON messages;
DROP FUNCTION IF EXISTS notify_on_message();

CREATE OR REPLACE FUNCTION notify_on_message() RETURNS trigger AS $$
DECLARE
    v_other_user_id uuid;
    v_sender_alias text;
    v_listing_title text;
    v_buyer_id uuid;
    v_seller_id uuid;
BEGIN
    -- Get thread participants
    SELECT buyer_id, seller_id INTO v_buyer_id, v_seller_id
    FROM threads
    WHERE id = NEW.thread_id;

    -- Determine the recipient (the user who is NOT the sender)
    IF NEW.from_user = v_buyer_id THEN
        v_other_user_id := v_seller_id;
    ELSE
        v_other_user_id := v_buyer_id;
    END IF;

    -- Get sender alias
    SELECT alias_inst INTO v_sender_alias
    FROM users
    WHERE id = NEW.from_user;

    -- Get listing title if the thread is linked to a listing
    SELECT l.title INTO v_listing_title
    FROM threads t
    LEFT JOIN listings l ON t.listing_id = l.id
    WHERE t.id = NEW.thread_id;

    -- Create notification for the recipient
    PERFORM create_notification(
        v_other_user_id,
        'message',
        'Nuevo mensaje',
        '@' || v_sender_alias || ' te envió un mensaje' ||
        CASE WHEN v_listing_title IS NOT NULL THEN ' sobre "' || v_listing_title || '"' ELSE '' END,
        '/messages/' || NEW.thread_id,
        jsonb_build_object('thread_id', NEW.thread_id, 'message_id', NEW.id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_created
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_message();
