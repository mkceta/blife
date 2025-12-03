-- Add payment_methods column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}';

-- Update RLS policy to allow users to update this column
-- (The existing policy "Users can update own record" using 'FOR UPDATE' covers all columns, so no change needed there)
