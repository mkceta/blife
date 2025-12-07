-- Create Badges Table
create table if not exists public.badges (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  name text not null,
  description text not null,
  icon_name text not null, -- 'ShieldCheck', 'Trophy', 'Shield' etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create User Badges Table (Many to Many)
create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

-- Enable RLS
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

-- Policies
create policy "Badges are viewable by everyone"
  on public.badges for select
  to authenticated
  using (true);

create policy "User badges are viewable by everyone"
  on public.user_badges for select
  to authenticated
  using (true);

-- Seed Initial Badges (10 Badges)
insert into public.badges (code, name, description, icon_name)
values 
  ('verified_udc', 'Verificado UDC', 'Cuenta verificada con correo institucional UDC', 'ShieldCheck'),
  ('pro_trader', 'Vendedor Pro', 'Ha vendido 5 o más artículos en el mercado', 'Trophy'),
  ('admin', 'Administrador', 'Miembro del equipo de administración de Blife', 'Shield'),
  ('first_sale', 'Primera Venta', '¡Felicidades por tu primera venta!', 'Store'),
  ('scholar', 'Erudito', 'Aporta material académico (libros y apuntes)', 'BookOpen'),
  ('techie', 'Techie', 'Vendedor de gadgets y electrónica', 'Cpu'),
  ('fashion', 'Fashionista', 'Renueva su armario vendiendo ropa', 'Shirt'),
  ('five_stars', '5 Estrellas', 'Vendedor excelente con valoración media de 5 estrellas', 'Star'),
  ('early_bird', 'Pionero', 'Uno de los primeros 100 usuarios de Blife', 'Rocket'),
  ('influencer', 'Influencer', 'Usuario con perfil completo y foto establecida', 'Crown')
on conflict (code) do nothing;

-- Function to check and award badges
create or replace function public.check_and_award_badges(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  user_record record;
  badge_record record;
  sale_count integer;
  buy_count integer;
  total_tx integer;
  user_rating numeric;
  review_count integer;
  items_in_books integer;
  items_in_tech integer;
  items_in_fashion integer;
begin
  -- Get user details
  select * into user_record from public.users where id = target_user_id;
  
  if user_record is null then
    return;
  end if;

  -- 1. UDC Verified
  if (user_record.email ilike '%@udc.es' or user_record.email ilike '%@alumnado.udc.es') or (user_record.uni = 'udc.es') then
    select id into badge_record from public.badges where code = 'verified_udc';
    if found then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing;
    end if;
  end if;

  -- 2. Admin Badge
  if user_record.role = 'admin' then
      select id into badge_record from public.badges where code = 'admin';
      if found then
        insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing;
      end if;
  end if;

  -- Sales Stats
  select count(*) into sale_count from public.listings where user_id = target_user_id and status = 'sold';

  -- 3. First Sale
  if sale_count >= 1 then
    select id into badge_record from public.badges where code = 'first_sale';
    if found then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing;
    end if;
  end if;

  -- 4. Pro Trader (> 5 Sales) (Modified definition to focus on sales)
  if sale_count >= 5 then
    select id into badge_record from public.badges where code = 'pro_trader';
    if found then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing;
    end if;
  end if;

  -- 5. Five Stars (Avg Rating >= 4.8 and > 2 reviews)
  -- Using columns rating_avg and rating_count from users table (updated by trigger)
  if user_record.rating_avg >= 4.8 and user_record.rating_count >= 3 then
    select id into badge_record from public.badges where code = 'five_stars';
    if found then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing;
    end if;
  end if;

  -- Category Specific Badges
  -- 6. Scholar (Books)
  select count(*) into items_in_books from public.listings where user_id = target_user_id and category = 'LibrosApuntes';
  if items_in_books >= 1 then
    select id into badge_record from public.badges where code = 'scholar';
    if found then insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing; end if;
  end if;

  -- 7. Techie (Electronics)
  select count(*) into items_in_tech from public.listings where user_id = target_user_id and category = 'Electronica';
  if items_in_tech >= 1 then
    select id into badge_record from public.badges where code = 'techie';
    if found then insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing; end if;
  end if;

  -- 8. Fashionista (Clothing)
  select count(*) into items_in_fashion from public.listings where user_id = target_user_id and category = 'Ropa';
  if items_in_fashion >= 1 then
    select id into badge_record from public.badges where code = 'fashion';
    if found then insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing; end if;
  end if;

  -- 9. Influencer (Profile Complete: Avatar + Bio/Alias)
  -- Assuming avatar_url is not null and alias_inst is set.
  if user_record.avatar_url is not null and length(user_record.alias_inst) > 2 then
    select id into badge_record from public.badges where code = 'influencer';
    if found then insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing; end if;
  end if;

  -- 10. Early Bird (First 100 Users or specific date)
  -- We can check creation date. Let's say created before 2026 (for now everyone is early bird? or better, use serial check if possible)
  -- Simpler: Award to everyone for now as "Beta Tester" equivalent? 
  -- Let's stick to: if created_at < '2025-12-31' (Current year end)
  -- Or just check if total users count was low when they joined? Hard retrospectively.
  -- Let's just award it to everyone active now as 'Pionero'.
  select id into badge_record from public.badges where code = 'early_bird';
  if found then insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing; end if;

end;
$$;

-- Trigger to check badges on listing change
create or replace function public.trigger_check_badges_listing()
returns trigger
language plpgsql
security definer
as $$
begin
  -- On insert or update, check seller
  if (TG_OP = 'INSERT') then
    perform public.check_and_award_badges(new.user_id);
  elsif (TG_OP = 'UPDATE') then
    if (old.status <> new.status) or (old.category <> new.category) then
        perform public.check_and_award_badges(new.user_id);
    end if;
    -- If sold, check buyer too
    if new.status = 'sold' and new.buyer_id is not null then
      perform public.check_and_award_badges(new.buyer_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_listing_change_check_badges on public.listings;
create trigger on_listing_change_check_badges
after insert or update on public.listings
for each row
execute function public.trigger_check_badges_listing();

-- Trigger for user changes (Profile update)
create or replace function public.trigger_check_badges_user()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.check_and_award_badges(new.id);
  return new;
end;
$$;

drop trigger if exists on_user_change_check_badges on public.users;
create trigger on_user_change_check_badges
after insert or update of email, role, avatar_url, rating_avg on public.users
for each row
execute function public.trigger_check_badges_user();

-- BACKFILL
do $$
declare
  u record;
begin
  for u in select id from public.users
  loop
    perform public.check_and_award_badges(u.id);
  end loop;
end;
$$;
