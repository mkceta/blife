-- Create reports table
create table if not exists "public"."reports" (
    "id" uuid default gen_random_uuid() primary key,
    "created_at" timestamp with time zone default now() not null,
    "reporter_id" uuid references "public"."users"("id") on delete cascade not null,
    "target_type" text not null check (target_type in ('listing', 'post', 'user', 'flat')),
    "target_id" uuid not null,
    "reason" text not null,
    "details" text,
    "status" text default 'open' not null check (status in ('open', 'resolved'))
);

-- Create index for faster queries
create index if not exists "reports_reporter_id_idx" on "public"."reports"("reporter_id");
create index if not exists "reports_target_id_idx" on "public"."reports"("target_id");
create index if not exists "reports_status_idx" on "public"."reports"("status");

-- Enable RLS
alter table "public"."reports" enable row level security;

-- Policies
-- Users can create reports
create policy "Users can create reports"
    on "public"."reports"
    for insert
    to authenticated
    with check (auth.uid() = reporter_id);

-- Users can view their own reports
create policy "Users can view their own reports"
    on "public"."reports"
    for select
    to authenticated
    using (auth.uid() = reporter_id);

-- Admins can view all reports
create policy "Admins can view all reports"
    on "public"."reports"
    for select
    to authenticated
    using (
        exists (
            select 1 from "public"."users"
            where id = auth.uid() and role = 'admin'
        )
    );

-- Admins can update reports
create policy "Admins can update reports"
    on "public"."reports"
    for update
    to authenticated
    using (
        exists (
            select 1 from "public"."users"
            where id = auth.uid() and role = 'admin'
        )
    );

-- Admins can delete reports
create policy "Admins can delete reports"
    on "public"."reports"
    for delete
    to authenticated
    using (
        exists (
            select 1 from "public"."users"
            where id = auth.uid() and role = 'admin'
        )
    );
