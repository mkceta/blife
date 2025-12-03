-- Add RPC functions for updating reactions count
create or replace function increment_reactions(post_id uuid)
returns void as $$
begin
  update public.posts set reactions_count = reactions_count + 1 where id = post_id;
end;
$$ language plpgsql security definer;

create or replace function decrement_reactions(post_id uuid)
returns void as $$
begin
  update public.posts set reactions_count = GREATEST(reactions_count - 1, 0) where id = post_id;
end;
$$ language plpgsql security definer;
