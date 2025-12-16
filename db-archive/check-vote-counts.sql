-- Query rápido para ver el estado actual de votos
SELECT 
    p.id as poll_id,
    p.question,
    p.total_votes as poll_total,
    po.id as option_id,
    po.option_text,
    po.vote_count as option_count,
    (SELECT COUNT(*) FROM poll_votes WHERE option_id = po.id) as actual_votes_in_db
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
ORDER BY p.created_at DESC, po.option_order
LIMIT 20;
