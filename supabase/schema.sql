-- AppVault initial schema
-- Run this in Supabase Dashboard > SQL Editor after creating your project.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 1200),
  version text not null default '',
  platform text not null check (platform in ('Android','Windows','macOS','Linux','Cross-Platform')),
  storage_path text,
  file_name text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Users can view published entries later; initially each user can manage only their own projects.
create policy "Owners can read their projects"
on public.projects for select
to authenticated
using (auth.uid() = owner_id);

create policy "Owners can create their projects"
on public.projects for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "Owners can update their projects"
on public.projects for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Owners can delete their projects"
on public.projects for delete
to authenticated
using (auth.uid() = owner_id);

-- Create a PRIVATE Storage bucket named app-files in the Supabase Dashboard.
-- Storage object policies should be added after deciding whether downloads are private
-- or public. Do not make arbitrary executable uploads publicly writable.
