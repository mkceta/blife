-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  uni text, -- 'udc.es' or 'udc.gal'
  alias_inst text unique,
  alias_anon text,
  bio text,
  avatar_url text,
  rating_avg numeric default 0,
  rating_count int default 0,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- LISTINGS TABLE
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  category text check (category in ('Electronica','LibrosApuntes','Material','Ropa','Muebles','Transporte','Servicios','Ocio','Otros')),
  title text not null,
  description text,
  price_cents int not null,
  currency text default 'EUR',
  status text check (status in ('active','sold')) default 'active',
  buyer_id uuid references public.users(id) on delete set null,
  photos jsonb, -- Array of objects {url, thumb, ...}
  tags text[],
  favorites_count int default 0,
  views_count int default 0,
  is_hidden boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FAVORITES TABLE
create table public.favorites (
  user_id uuid references public.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

-- THREADS TABLE
create table public.threads (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete set null,
  flat_id uuid references public.flats(id) on delete set null,
  buyer_id uuid references public.users(id) on delete cascade,
  seller_id uuid references public.users(id) on delete cascade,
  last_message_at timestamptz default now(),
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MESSAGES TABLE
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  from_user uuid references public.users(id) on delete set null,
  body text not null,
  created_at timestamptz default now()
);

-- REVIEWS TABLE
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.users(id) on delete cascade,
  buyer_id uuid references public.users(id) on delete cascade,
  stars int check (stars between 1 and 5),
  text text,
  created_at timestamptz default now()
);

-- REPORTS TABLE
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.users(id) on delete set null,
  target_type text check (target_type in ('listing','post','user','flat')),
  target_id uuid not null,
  reason text check (reason in ('spam','inapropiado','duplicado','estafa','otro')),
  details text,
  status text default 'open',
  handled_by uuid references public.users(id) on delete set null,
  resolution_note text,
  is_hidden boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- POSTS TABLE
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  text text not null,
  photo_url text,
  is_anonymous boolean default false,
  reactions_count int default 0,
  is_hidden boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- REACTIONS TABLE
create table public.reactions (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  kind text, -- 'like', etc.
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- FLATS TABLE
create table public.flats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  rent_cents int not null,
  area_m2 int,
  rooms int,
  baths int,
  location_area text,
  lat numeric,
  lng numeric,
  roommates_current int,
  photos jsonb,
  status text default 'active',
  is_hidden boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- INDEXES
create index idx_listings_category_status on public.listings(category, status);
create index idx_listings_created_at on public.listings(created_at desc);
create index idx_listings_tags on public.listings using gin(tags);
create index idx_messages_thread_id_created_at on public.messages(thread_id, created_at);
create index idx_posts_created_at on public.posts(created_at desc);
create index idx_threads_participants on public.threads(buyer_id, seller_id);

-- RLS POLICIES
alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.flats enable row level security;

-- Users
create policy "Public profiles are viewable by everyone" on public.users for select using (true);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Listings
create policy "Listings are viewable by everyone" on public.listings for select using (is_hidden = false);
create policy "Users can insert own listings" on public.listings for insert with check (auth.uid() = user_id);
create policy "Users can update own listings" on public.listings for update using (auth.uid() = user_id);
create policy "Users can delete own listings" on public.listings for delete using (auth.uid() = user_id);

-- Favorites
create policy "Users can view own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "Users can insert own favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "Users can delete own favorites" on public.favorites for delete using (auth.uid() = user_id);

-- Threads
create policy "Users can view threads they are part of" on public.threads for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Users can insert threads" on public.threads for insert with check (auth.uid() = buyer_id); -- Usually buyer starts thread

-- Messages
create policy "Users can view messages in their threads" on public.messages for select using (
  exists (select 1 from public.threads where id = thread_id and (buyer_id = auth.uid() or seller_id = auth.uid()))
);
create policy "Users can insert messages in their threads" on public.messages for insert with check (
  exists (select 1 from public.threads where id = thread_id and (buyer_id = auth.uid() or seller_id = auth.uid()))
);

-- Posts
create policy "Posts are viewable by everyone" on public.posts for select using (is_hidden = false);
create policy "Users can insert own posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on public.posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = user_id);

-- Flats
create policy "Flats are viewable by everyone" on public.flats for select using (is_hidden = false);
create policy "Users can insert own flats" on public.flats for insert with check (auth.uid() = user_id);
create policy "Users can update own flats" on public.flats for update using (auth.uid() = user_id);

-- Reports
create policy "Users can insert reports" on public.reports for insert with check (auth.uid() = reporter_id);
-- Reports are only viewable by admin (service role) or the reporter (maybe)

-- TRIGGER FOR NEW USERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, uni, alias_inst, alias_anon, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'uni',
    new.raw_user_meta_data->>'alias_inst',
    new.raw_user_meta_data->>'alias_anon',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
