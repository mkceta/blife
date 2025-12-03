-- Add missing indexes for performance optimization

-- Index for joining posts with users
create index if not exists idx_posts_user_id on public.posts(user_id);

-- Indexes for flats filtering and sorting
create index if not exists idx_flats_created_at on public.flats(created_at desc);
create index if not exists idx_flats_rent_cents on public.flats(rent_cents);
create index if not exists idx_flats_location_area on public.flats(location_area);
create index if not exists idx_flats_rooms on public.flats(rooms);

-- Index for favorites (user_id is already part of PK, but listing_id might be useful for reverse lookups if needed, though less critical for current query)
create index if not exists idx_favorites_listing_id on public.favorites(listing_id);
