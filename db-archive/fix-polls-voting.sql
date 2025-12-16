-- Arreglar sistema de encuestas
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. QUITAR LÍMITE DIARIO
DROP TRIGGER IF EXISTS enforce_daily_poll_limit ON polls;
DROP FUNCTION IF EXISTS check_daily_poll_limit();

-- 2. ARREGLAR CONSTRAINT DE VOTOS
-- El problema es que la constraint UNIQUE no permite votar múltiples opciones
-- Necesitamos cambiarla

ALTER TABLE poll_votes DROP CONSTRAINT IF EXISTS poll_votes_poll_id_option_id_user_id_key;

-- Nueva constraint: solo permite un voto por opción (evita duplicados)
-- Pero permite múltiples votos en diferentes opciones
ALTER TABLE poll_votes ADD CONSTRAINT unique_user_option_vote 
    UNIQUE(user_id, option_id);

-- 3. MEJORAR VALIDACIÓN DE VOTOS
-- Reemplazar la función de validación
CREATE OR REPLACE FUNCTION validate_poll_vote()
RETURNS TRIGGER AS $$
DECLARE
    is_multiple_choice BOOLEAN;
    existing_votes_count INTEGER;
BEGIN
    -- Verificar si la encuesta permite múltiples opciones
    SELECT multiple_choice INTO is_multiple_choice
    FROM polls
    WHERE id = NEW.poll_id;
    
    -- Si es single choice, verificar que no haya votado en OTRA opción
    IF NOT is_multiple_choice THEN
        SELECT COUNT(DISTINCT option_id) INTO existing_votes_count
        FROM poll_votes
        WHERE poll_id = NEW.poll_id
        AND user_id = NEW.user_id;
        
        IF existing_votes_count > 0 THEN
            RAISE EXCEPTION 'Ya has votado en esta encuesta';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar cambios
SELECT 'Límite diario eliminado' as status;
SELECT 'Constraints de votos actualizados' as status;
