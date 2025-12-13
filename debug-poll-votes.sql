-- Verificar que los votos se están guardando correctamente
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Ver todos los votos
SELECT 
    pv.id,
    p.question,
    po.option_text,
    u.alias_inst as voter,
    pv.voted_at
FROM poll_votes pv
JOIN polls p ON pv.poll_id = p.id
JOIN poll_options po ON pv.option_id = po.id
JOIN users u ON pv.user_id = u.id
ORDER BY pv.voted_at DESC
LIMIT 20;

-- 2. Ver contadores de votos
SELECT 
    p.question,
    p.total_votes as poll_total,
    po.option_text,
    po.vote_count as option_count,
    (SELECT COUNT(*) FROM poll_votes WHERE option_id = po.id) as actual_votes
FROM polls p
JOIN poll_options po ON p.id = po.id
ORDER BY p.created_at DESC;

-- 3. Verificar triggers
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('poll_votes', 'polls');
