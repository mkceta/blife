-- Add session_duration column to users table
-- Default: 604800 seconds (7 days)
ALTER TABLE public.users
ADD COLUMN session_duration INTEGER DEFAULT 604800;

COMMENT ON COLUMN public.users.session_duration IS 'Session duration in seconds. Default: 604800 (7 days)';
