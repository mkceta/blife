-- Add RPC function for incrementing favorites count
create or replace function increment_favorites(listing_id uuid)
returns void as $$
begin
  update public.listings set favorites_count = favorites_count + 1 where id = listing_id;
end;
$$ language plpgsql security definer;
