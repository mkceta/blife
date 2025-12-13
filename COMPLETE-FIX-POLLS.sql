-- SOLUCIÓN COMPLETA: Recalcular contadores y arreglar triggers
-- Ejecuta TODO este script en el SQL Editor de Supabase

-- PASO 1: Recalcular todos los contadores existentes
DO $$
DECLARE
    poll_record RECORD;
    option_record RECORD;
    vote_count_val INTEGER;
BEGIN
    -- Para cada encuesta
    FOR poll_record IN SELECT id FROM polls LOOP
        -- Recalcular total_votes
        SELECT COUNT(*) INTO vote_count_val
        FROM poll_votes
        WHERE poll_id = poll_record.id;
        
        UPDATE polls
        SET total_votes = vote_count_val
        WHERE id = poll_record.id;
        
        RAISE NOTICE 'Poll % updated: % total votes', poll_record.id, vote_count_val;
    END LOOP;
    
    -- Para cada opción
    FOR option_record IN SELECT id FROM poll_options LOOP
        -- Recalcular vote_count
        SELECT COUNT(*) INTO vote_count_val
        FROM poll_votes
        WHERE option_id = option_record.id;
        
        UPDATE poll_options
        SET vote_count = vote_count_val
        WHERE id = option_record.id;
        
        RAISE NOTICE 'Option % updated: % votes', option_record.id, vote_count_val;
    END LOOP;
END $$;

-- PASO 2: Eliminar trigger viejo si existe
DROP TRIGGER IF EXISTS on_poll_vote_change ON poll_votes;
DROP FUNCTION IF EXISTS update_poll_vote_counts();

-- PASO 3: Crear función mejorada con logs
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_option_count INTEGER;
    v_poll_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Incrementar contador de la opción
        UPDATE poll_options
        SET vote_count = vote_count + 1
        WHERE id = NEW.option_id
        RETURNING vote_count INTO v_option_count;
        
        -- Incrementar contador total de la encuesta
        UPDATE polls
        SET total_votes = total_votes + 1
        WHERE id = NEW.poll_id
        RETURNING total_votes INTO v_poll_count;
        
        RAISE NOTICE 'VOTE INSERTED: poll_id=%, option_id=%, new_option_count=%, new_poll_total=%', 
            NEW.poll_id, NEW.option_id, v_option_count, v_poll_count;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrementar contador de la opción
        UPDATE poll_options
        SET vote_count = GREATEST(vote_count - 1, 0)
        WHERE id = OLD.option_id
        RETURNING vote_count INTO v_option_count;
        
        -- Decrementar contador total de la encuesta
        UPDATE polls
        SET total_votes = GREATEST(total_votes - 1, 0)
        WHERE id = OLD.poll_id
        RETURNING total_votes INTO v_poll_count;
        
        RAISE NOTICE 'VOTE DELETED: poll_id=%, option_id=%, new_option_count=%, new_poll_total=%', 
            OLD.poll_id, OLD.option_id, v_option_count, v_poll_count;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- PASO 4: Crear trigger
CREATE TRIGGER on_poll_vote_change
    AFTER INSERT OR DELETE ON poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_vote_counts();

-- PASO 5: Verificar que todo está bien
SELECT 'Triggers recreados correctamente' as status;

-- PASO 6: Mostrar estado actual
SELECT 
    p.question,
    p.total_votes as poll_total,
    po.option_text,
    po.vote_count as option_count,
    (SELECT COUNT(*) FROM poll_votes WHERE option_id = po.id) as actual_votes
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
ORDER BY p.created_at DESC;
