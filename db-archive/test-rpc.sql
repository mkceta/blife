-- Ejecuta esto en el SQL Editor de Supabase para crear/arreglar las funciones RPC

-- Función para incrementar contador de reacciones
CREATE OR REPLACE FUNCTION public.increment_reactions(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts 
  SET reactions_count = COALESCE(reactions_count, 0) + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para decrementar contador de reacciones
CREATE OR REPLACE FUNCTION public.decrement_reactions(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts 
  SET reactions_count = GREATEST(COALESCE(reactions_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que las funciones se crearon correctamente
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('increment_reactions', 'decrement_reactions');
