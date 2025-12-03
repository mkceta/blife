-- Create reactions table for posts and listings
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'listing')),
    target_id UUID NOT NULL,
    emoji TEXT NOT NULL CHECK (emoji IN ('❤️', '👍', '🔥', '😂', '😍')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- Create index for faster queries
CREATE INDEX idx_reactions_target ON public.reactions(target_type, target_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);

-- Enable RLS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view reactions"
    ON public.reactions FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own reactions"
    ON public.reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
    ON public.reactions FOR DELETE
    USING (auth.uid() = user_id);

COMMENT ON TABLE public.reactions IS 'User reactions (emojis) on posts and listings';
