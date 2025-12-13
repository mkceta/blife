-- Crear notificación cuando alguien reacciona a un post
-- Ejecuta esto en el SQL Editor de Supabase

CREATE OR REPLACE FUNCTION public.handle_new_reaction()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id uuid;
    post_author_alias text;
BEGIN
    -- Obtener el autor del post
    SELECT user_id INTO post_author_id
    FROM public.posts
    WHERE id = NEW.post_id;

    -- Solo crear notificación si el que reacciona NO es el autor del post
    IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
        -- Obtener el alias del usuario que reaccionó
        SELECT alias_inst INTO post_author_alias
        FROM public.users
        WHERE id = NEW.user_id;

        -- Crear la notificación
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            link,
            metadata
        ) VALUES (
            post_author_id,
            'reaction',
            'Nueva reacción',
            '@' || COALESCE(post_author_alias, 'Alguien') || ' reaccionó a tu publicación',
            '/community/post/' || NEW.post_id,
            jsonb_build_object('post_id', NEW.post_id, 'reactor_id', NEW.user_id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger
DROP TRIGGER IF EXISTS on_reaction_created ON public.reactions;
CREATE TRIGGER on_reaction_created
    AFTER INSERT ON public.reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_reaction();

-- Verificar que se creó correctamente
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_reaction_created';
