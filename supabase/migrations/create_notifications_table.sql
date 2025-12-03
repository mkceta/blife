-- Create notifications table
create table if not exists "public"."notifications" (
    "id" uuid default gen_random_uuid() primary key,
    "created_at" timestamp with time zone default now() not null,
    "user_id" uuid references "public"."users"("id") on delete cascade not null,
    "type" text not null check (type in ('comment', 'message', 'reaction', 'listing_sold', 'favorite', 'offer')),
    "title" text not null,
    "message" text not null,
    "link" text,
    "read" boolean default false not null,
    "data" jsonb default '{}'::jsonb
);

-- Create indexes for faster queries
create index if not exists "notifications_user_id_idx" on "public"."notifications"("user_id");
create index if not exists "notifications_read_idx" on "public"."notifications"("read");
create index if not exists "notifications_created_at_idx" on "public"."notifications"("created_at" desc);
create index if not exists "notifications_user_read_idx" on "public"."notifications"("user_id", "read");

-- Enable RLS
alter table "public"."notifications" enable row level security;

-- Policies
-- Users can view their own notifications
drop policy if exists "Users can view their own notifications" on "public"."notifications";
create policy "Users can view their own notifications"
    on "public"."notifications"
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
drop policy if exists "Users can update their own notifications" on "public"."notifications";
create policy "Users can update their own notifications"
    on "public"."notifications"
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Users can delete their own notifications
drop policy if exists "Users can delete their own notifications" on "public"."notifications";
create policy "Users can delete their own notifications"
    on "public"."notifications"
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- System can insert notifications (via triggers)
drop policy if exists "System can insert notifications" on "public"."notifications";
create policy "System can insert notifications"
    on "public"."notifications"
    for insert
    to authenticated
    with check (true);

-- Enable realtime for notifications table
-- Note: You need to enable this manually in Supabase Dashboard:
-- 1. Go to Database → Replication
-- 2. Find 'notifications' table
-- 3. Toggle it ON for supabase_realtime publication


-- Function to create notification
create or replace function create_notification(
    p_user_id uuid,
    p_type text,
    p_title text,
    p_message text,
    p_link text default null,
    p_data jsonb default '{}'::jsonb
) returns uuid as $$
declare
    v_notification_id uuid;
begin
    insert into notifications (user_id, type, title, message, link, data)
    values (p_user_id, p_type, p_title, p_message, p_link, p_data)
    returning id into v_notification_id;
    
    return v_notification_id;
end;
$$ language plpgsql security definer;

-- Trigger function for new comments
create or replace function notify_on_comment() returns trigger as $$
declare
    v_post_author_id uuid;
    v_commenter_alias text;
    v_post_text text;
begin
    -- Get post author and commenter info
    select user_id, text into v_post_author_id, v_post_text
    from posts
    where id = NEW.post_id;
    
    -- Don't notify if commenting on own post
    if v_post_author_id = NEW.user_id then
        return NEW;
    end if;
    
    -- Get commenter alias
    select alias_inst into v_commenter_alias
    from users
    where id = NEW.user_id;
    
    -- Create notification
    perform create_notification(
        v_post_author_id,
        'comment',
        'Nuevo comentario',
        '@' || v_commenter_alias || ' comentó en tu publicación',
        '/community',
        jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
    );
    
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for comments
drop trigger if exists on_comment_created on comments;
create trigger on_comment_created
    after insert on comments
    for each row
    execute function notify_on_comment();

-- Trigger function for new reactions
create or replace function notify_on_reaction() returns trigger as $$
declare
    v_post_author_id uuid;
    v_reactor_alias text;
begin
    -- Get post author
    select user_id into v_post_author_id
    from posts
    where id = NEW.post_id;
    
    -- Don't notify if reacting to own post
    if v_post_author_id = NEW.user_id then
        return NEW;
    end if;
    
    -- Get reactor alias
    select alias_inst into v_reactor_alias
    from users
    where id = NEW.user_id;
    
    -- Create notification
    perform create_notification(
        v_post_author_id,
        'reaction',
        'Nueva reacción',
        '@' || v_reactor_alias || ' reaccionó a tu publicación',
        '/community',
        jsonb_build_object('post_id', NEW.post_id)
    );
    
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for reactions
drop trigger if exists on_reaction_created on reactions;
create trigger on_reaction_created
    after insert on reactions
    for each row
    execute function notify_on_reaction();

-- Trigger function for new messages
-- NOTE: Temporarily commented out to fix message sending
-- Uncomment after verifying the trigger works correctly
/*
create or replace function notify_on_message() returns trigger as $$
declare
    v_other_user_id uuid;
    v_sender_alias text;
    v_listing_title text;
    v_buyer_id uuid;
    v_seller_id uuid;
begin
    -- Get thread participants
    select buyer_id, seller_id into v_buyer_id, v_seller_id
    from threads
    where id = NEW.thread_id;
    
    -- Determine the recipient (the user who is NOT the sender)
    if NEW.from_user = v_buyer_id then
        v_other_user_id := v_seller_id;
    else
        v_other_user_id := v_buyer_id;
    end if;
    
    -- Get sender alias
    select alias_inst into v_sender_alias
    from users
    where id = NEW.from_user;
    
    -- Get listing title if exists
    select l.title into v_listing_title
    from threads t
    left join listings l on t.listing_id = l.id
    where t.id = NEW.thread_id;
    
    -- Create notification
    perform create_notification(
        v_other_user_id,
        'message',
        'Nuevo mensaje',
        '@' || v_sender_alias || ' te envió un mensaje' || 
        case when v_listing_title is not null then ' sobre "' || v_listing_title || '"' else '' end,
        '/messages/' || NEW.thread_id,
        jsonb_build_object('thread_id', NEW.thread_id, 'message_id', NEW.id)
    );
    
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for messages
drop trigger if exists on_message_created on messages;
create trigger on_message_created
    after insert on messages
    for each row
    execute function notify_on_message();
*/


-- Trigger function for new wishlist items (favorites)
-- NOTE: Commented out because wishlist table doesn't exist yet
-- Uncomment this when you create the wishlist table
/*
create or replace function notify_on_favorite() returns trigger as $$
declare
    v_listing_owner_id uuid;
    v_user_alias text;
    v_listing_title text;
begin
    -- Get listing owner and title
    select user_id, title into v_listing_owner_id, v_listing_title
    from listings
    where id = NEW.listing_id;
    
    -- Don't notify if favoriting own listing
    if v_listing_owner_id = NEW.user_id then
        return NEW;
    end if;
    
    -- Get user alias
    select alias_inst into v_user_alias
    from users
    where id = NEW.user_id;
    
    -- Create notification
    perform create_notification(
        v_listing_owner_id,
        'favorite',
        'Nuevo favorito',
        '@' || v_user_alias || ' añadió "' || v_listing_title || '" a favoritos',
        '/market/' || NEW.listing_id,
        jsonb_build_object('listing_id', NEW.listing_id)
    );
    
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for wishlist
drop trigger if exists on_wishlist_created on wishlist;
create trigger on_wishlist_created
    after insert on wishlist
    for each row
    execute function notify_on_favorite();
*/

