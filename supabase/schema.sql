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
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

alter table public.projects add column if not exists published boolean not null default true;

drop policy if exists "Anyone can read published projects" on public.projects;
create policy "Anyone can read published projects"
on public.projects for select
to anon, authenticated
using (published = true or auth.uid() = owner_id);

-- Users can view published entries later; initially each user can manage only their own projects.
drop policy if exists "Owners can read their projects" on public.projects;
drop policy if exists "Owners can create their projects" on public.projects;
drop policy if exists "Owners can update their projects" on public.projects;
drop policy if exists "Owners can delete their projects" on public.projects;
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

-- Private bucket: downloads use short-lived signed URLs after checking a published row.
insert into storage.buckets (id, name, public, file_size_limit)
values ('app-files', 'app-files', false, 104857600)
on conflict (id) do update set public = false, file_size_limit = 104857600;

drop policy if exists "Owners upload app files" on storage.objects;
create policy "Owners upload app files" on storage.objects
for insert to authenticated
with check (bucket_id = 'app-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Published app files can be downloaded" on storage.objects;
create policy "Published app files can be downloaded" on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'app-files'
  and exists (
    select 1 from public.projects p
    where p.storage_path = storage.objects.name and p.published = true
  )
);

drop policy if exists "Owners delete app files" on storage.objects;
create policy "Owners delete app files" on storage.objects
for delete to authenticated
using (bucket_id = 'app-files' and (storage.foldername(name))[1] = auth.uid()::text);
