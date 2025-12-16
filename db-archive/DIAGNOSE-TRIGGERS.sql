-- DIAGNÓSTICO COMPLETO DE TRIGGERS
-- Ejecuta esto paso por paso y comparte los resultados

-- 1. Verificar que los triggers existen
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'poll_votes';

-- 2. Verificar que la función existe
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_poll_vote_counts';

-- 3. Test manual: Insertar un voto directamente en SQL
-- IMPORTANTE: Reemplaza estos IDs con valores reales de tu base de datos
DO $$
DECLARE
    test_poll_id UUID;
    test_option_id UUID;
    test_user_id UUID;
    initial_option_count INTEGER;
    initial_poll_count INTEGER;
    final_option_count INTEGER;
    final_poll_count INTEGER;
BEGIN
    -- Obtener IDs reales
    SELECT id INTO test_poll_id FROM polls ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO test_option_id FROM poll_options WHERE poll_id = test_poll_id LIMIT 1;
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    RAISE NOTICE 'Testing with poll_id=%, option_id=%, user_id=%', test_poll_id, test_option_id, test_user_id;
    
    -- Obtener contadores iniciales
    SELECT vote_count INTO initial_option_count FROM poll_options WHERE id = test_option_id;
    SELECT total_votes INTO initial_poll_count FROM polls WHERE id = test_poll_id;
    
    RAISE NOTICE 'BEFORE: option_count=%, poll_total=%', initial_option_count, initial_poll_count;
    
    -- Insertar voto de prueba
    INSERT INTO poll_votes (poll_id, option_id, user_id)
    VALUES (test_poll_id, test_option_id, test_user_id);
    
    -- Esperar un momento
    PERFORM pg_sleep(0.5);
    
    -- Obtener contadores finales
    SELECT vote_count INTO final_option_count FROM poll_options WHERE id = test_option_id;
    SELECT total_votes INTO final_poll_count FROM polls WHERE id = test_poll_id;
    
    RAISE NOTICE 'AFTER: option_count=%, poll_total=%', final_option_count, final_poll_count;
    
    IF final_option_count = initial_option_count + 1 AND final_poll_count = initial_poll_count + 1 THEN
        RAISE NOTICE '✅ TRIGGER FUNCIONANDO CORRECTAMENTE';
    ELSE
        RAISE NOTICE '❌ TRIGGER NO ESTÁ FUNCIONANDO';
    END IF;
    
    -- Limpiar voto de prueba
    DELETE FROM poll_votes WHERE poll_id = test_poll_id AND option_id = test_option_id AND user_id = test_user_id;
    
END $$;

-- 4. Verificar permisos de la función
SELECT 
    proname,
    proowner::regrole,
    proacl
FROM pg_proc
WHERE proname = 'update_poll_vote_counts';
