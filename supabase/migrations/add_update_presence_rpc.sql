-- Create a function to update the user's last_seen timestamp
-- This function runs with SECURITY DEFINER to bypass RLS policies, ensuring it always works for the authenticated user.

CREATE OR REPLACE FUNCTION public.update_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET last_seen = now()
  WHERE id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_presence() TO authenticated;
