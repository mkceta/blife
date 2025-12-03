-- Add RPC function for decrementing favorites count
create or replace function decrement_favorites(listing_id uuid)
returns void as $$
begin
  update public.listings set favorites_count = greatest(0, favorites_count - 1) where id = listing_id;
end;
$$ language plpgsql security definer;
