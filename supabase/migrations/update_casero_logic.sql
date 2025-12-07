-- Update the trigger logic for badges to include 'flats' table events
-- and update the check_and_award_badges function to look for flats.

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
  flats_count integer;
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

  -- 2. Casero (Check FLATS table)
  -- The badge code is still 'admin' for now based on setup-badges.ts matching, or we could migrate the code.
  -- Assuming we reuse 'admin' code for 'Casero' as per the TypeScript file.
  
  select count(*) into flats_count from public.flats where user_id = target_user_id;
  
  if flats_count >= 1 then
      select id into badge_record from public.badges where code = 'admin'; -- Mapped to Casero
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

  -- 4. Pro Trader (> 5 Sales)
  if sale_count >= 5 then
    select id into badge_record from public.badges where code = 'pro_trader';
    if found then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing;
    end if;
  end if;

  -- 5. Impecable (Avg Rating >= 4.8 and > 2 reviews)
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

  -- 7. G33k (Electronics)
  select count(*) into items_in_tech from public.listings where user_id = target_user_id and category = 'Electronica';
  if items_in_tech >= 1 then
    select id into badge_record from public.badges where code = 'techie';
    if found then insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing; end if;
  end if;

  -- 8. Swagger (Clothing)
  select count(*) into items_in_fashion from public.listings where user_id = target_user_id and category = 'Ropa';
  if items_in_fashion >= 1 then
    select id into badge_record from public.badges where code = 'fashion';
    if found then insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing; end if;
  end if;

  -- 9. Sinvergüenza (Influencer)
  if user_record.avatar_url is not null and length(user_record.alias_inst) > 2 then
    select id into badge_record from public.badges where code = 'influencer';
    if found then insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing; end if;
  end if;

  -- 10. Pionero
  select id into badge_record from public.badges where code = 'early_bird';
  if found then insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id) on conflict do nothing; end if;

end;
$$;


-- Trigger to check badges on FLAT creation
create or replace function public.trigger_check_badges_flat()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    perform public.check_and_award_badges(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_flat_created_check_badges on public.flats;
create trigger on_flat_created_check_badges
after insert on public.flats
for each row
execute function public.trigger_check_badges_flat();
