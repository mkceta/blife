-- SCRIPT SIMPLE PARA RECALCULAR CONTADORES
-- Ejecuta esto AHORA en Supabase SQL Editor

-- Recalcular vote_count para cada opción
UPDATE poll_options po
SET vote_count = (
    SELECT COUNT(*)
    FROM poll_votes pv
    WHERE pv.option_id = po.id
);

-- Recalcular total_votes para cada encuesta
UPDATE polls p
SET total_votes = (
    SELECT COUNT(*)
    FROM poll_votes pv
    WHERE pv.poll_id = p.id
);

-- Verificar resultados
SELECT 
    p.question,
    p.total_votes as poll_total,
    po.option_text,
    po.vote_count as option_count,
    (SELECT COUNT(*) FROM poll_votes WHERE option_id = po.id) as actual_votes
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
ORDER BY p.created_at DESC
LIMIT 10;
