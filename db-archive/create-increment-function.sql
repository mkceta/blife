-- Crear función para incrementar contadores atómicamente
-- Ejecuta esto en Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment_poll_vote_counts(
    p_poll_id UUID,
    p_option_ids UUID[]
)
RETURNS void AS $$
BEGIN
    -- Incrementar contadores de opciones
    UPDATE poll_options
    SET vote_count = vote_count + 1
    WHERE id = ANY(p_option_ids);
    
    -- Incrementar contador total de la encuesta
    UPDATE polls
    SET total_votes = total_votes + array_length(p_option_ids, 1)
    WHERE id = p_poll_id;
    
    RAISE NOTICE 'Incremented % options for poll %', array_length(p_option_ids, 1), p_poll_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION increment_poll_vote_counts TO authenticated;
