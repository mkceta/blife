-- Sistema de Encuestas para Comunidad
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Tabla de encuestas
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    multiple_choice BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    total_votes INTEGER DEFAULT 0,
    
    CONSTRAINT question_length CHECK (char_length(question) >= 3 AND char_length(question) <= 200)
);

-- 2. Tabla de opciones de encuesta
CREATE TABLE IF NOT EXISTS poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    option_order INTEGER NOT NULL,
    
    CONSTRAINT option_text_length CHECK (char_length(option_text) >= 1 AND char_length(option_text) <= 100),
    CONSTRAINT max_5_options CHECK (option_order >= 0 AND option_order < 5)
);

-- 3. Tabla de votos
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Si es single choice, solo puede votar una vez por encuesta
    UNIQUE(poll_id, option_id, user_id)
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_polls_user_id ON polls(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);

-- 5. Función para verificar límite de 1 encuesta por día
CREATE OR REPLACE FUNCTION check_daily_poll_limit()
RETURNS TRIGGER AS $$
DECLARE
    polls_today INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO polls_today
    FROM polls
    WHERE user_id = NEW.user_id
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';
    
    IF polls_today >= 1 THEN
        RAISE EXCEPTION 'Solo puedes crear 1 encuesta por día';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para límite diario
DROP TRIGGER IF EXISTS enforce_daily_poll_limit ON polls;
CREATE TRIGGER enforce_daily_poll_limit
    BEFORE INSERT ON polls
    FOR EACH ROW
    EXECUTE FUNCTION check_daily_poll_limit();

-- 7. Función para actualizar contadores al votar
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
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrementar contador de la opción
        UPDATE poll_options
        SET vote_count = vote_count - 1
        WHERE id = OLD.option_id;
        
        -- Decrementar contador total de la encuesta
        UPDATE polls
        SET total_votes = total_votes - 1
        WHERE id = OLD.poll_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para actualizar contadores
DROP TRIGGER IF EXISTS on_poll_vote_change ON poll_votes;
CREATE TRIGGER on_poll_vote_change
    AFTER INSERT OR DELETE ON poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_vote_counts();

-- 9. Función para validar votos (single vs multiple choice)
CREATE OR REPLACE FUNCTION validate_poll_vote()
RETURNS TRIGGER AS $$
DECLARE
    is_multiple_choice BOOLEAN;
    existing_votes INTEGER;
BEGIN
    -- Verificar si la encuesta permite múltiples opciones
    SELECT multiple_choice INTO is_multiple_choice
    FROM polls
    WHERE id = NEW.poll_id;
    
    -- Si es single choice, verificar que no haya votado antes
    IF NOT is_multiple_choice THEN
        SELECT COUNT(*) INTO existing_votes
        FROM poll_votes
        WHERE poll_id = NEW.poll_id
        AND user_id = NEW.user_id;
        
        IF existing_votes > 0 THEN
            RAISE EXCEPTION 'Ya has votado en esta encuesta';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger para validar votos
DROP TRIGGER IF EXISTS validate_vote_before_insert ON poll_votes;
CREATE TRIGGER validate_vote_before_insert
    BEFORE INSERT ON poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION validate_poll_vote();

-- 11. RLS (Row Level Security)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Políticas para polls
DROP POLICY IF EXISTS "Polls are viewable by everyone" ON polls;
CREATE POLICY "Polls are viewable by everyone" ON polls FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own polls" ON polls;
CREATE POLICY "Users can create their own polls" ON polls FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;
CREATE POLICY "Users can delete their own polls" ON polls FOR DELETE USING (auth.uid() = user_id);

-- Políticas para poll_options
DROP POLICY IF EXISTS "Poll options are viewable by everyone" ON poll_options;
CREATE POLICY "Poll options are viewable by everyone" ON poll_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Poll options can be created with poll" ON poll_options;
CREATE POLICY "Poll options can be created with poll" ON poll_options FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM polls WHERE id = poll_id AND user_id = auth.uid())
);

-- Políticas para poll_votes
DROP POLICY IF EXISTS "Poll votes are viewable by everyone" ON poll_votes;
CREATE POLICY "Poll votes are viewable by everyone" ON poll_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can vote on polls" ON poll_votes;
CREATE POLICY "Users can vote on polls" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own votes" ON poll_votes;
CREATE POLICY "Users can remove their own votes" ON poll_votes FOR DELETE USING (auth.uid() = user_id);

-- 12. Verificar que todo se creó correctamente
SELECT 'Tablas creadas:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('polls', 'poll_options', 'poll_votes');

SELECT 'Triggers creados:' as status;
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table IN ('polls', 'poll_votes');
