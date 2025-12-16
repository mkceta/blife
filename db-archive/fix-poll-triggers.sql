-- Verificar y arreglar triggers de contadores de votos
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar si los triggers existen
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'poll_votes';

-- 2. Recrear la función de actualización de contadores
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Incrementar contador de la opción
        UPDATE poll_options
        SET vote_count = vote_count + 1
        WHERE id = NEW.option_id;
        
        -- Incrementar contador total de la encuesta
        UPDATE polls
        SET total_votes = total_votes + 1
        WHERE id = NEW.poll_id;
        
        RAISE NOTICE 'Vote counted: poll_id=%, option_id=%', NEW.poll_id, NEW.option_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrementar contador de la opción
        UPDATE poll_options
        SET vote_count = GREATEST(vote_count - 1, 0)
        WHERE id = OLD.option_id;
        
        -- Decrementar contador total de la encuesta
        UPDATE polls
        SET total_votes = GREATEST(total_votes - 1, 0)
        WHERE id = OLD.poll_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recrear el trigger
DROP TRIGGER IF EXISTS on_poll_vote_change ON poll_votes;
CREATE TRIGGER on_poll_vote_change
    AFTER INSERT OR DELETE ON poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_vote_counts();

-- 4. Verificar que se creó
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'poll_votes';

-- 5. Test manual: Insertar un voto de prueba
-- (Reemplaza los IDs con valores reales de tu DB)
/*
INSERT INTO poll_votes (poll_id, option_id, user_id)
VALUES (
    'TU_POLL_ID_AQUI',
    'TU_OPTION_ID_AQUI',
    'TU_USER_ID_AQUI'
);

-- Verificar que los contadores se actualizaron
SELECT p.question, p.total_votes, po.option_text, po.vote_count
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
WHERE p.id = 'TU_POLL_ID_AQUI';
*/
