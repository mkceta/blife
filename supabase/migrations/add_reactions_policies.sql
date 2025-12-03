-- Add RLS policies for reactions table

-- Drop existing policies if they exist
drop policy if exists "Users can view reactions" on public.reactions;
drop policy if exists "Users can insert own reactions" on public.reactions;
drop policy if exists "Users can delete own reactions" on public.reactions;

-- Allow users to view all reactions
create policy "Users can view reactions" on public.reactions 
for select using (true);

-- Allow users to insert their own reactions
create policy "Users can insert own reactions" on public.reactions 
for insert with check (auth.uid() = user_id);

-- Allow users to delete their own reactions
create policy "Users can delete own reactions" on public.reactions 
for delete using (auth.uid() = user_id);
