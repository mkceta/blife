-- Add buyer_id column to listings table to track who purchased each item
ALTER TABLE public.listings
ADD COLUMN buyer_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
