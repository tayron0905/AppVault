-- AppVault: private project library for the configured Supabase user.
-- Safe to rerun: policies are replaced; existing project rows and files are kept.

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

alter table public.projects add column if not exists published boolean not null default true;
alter table public.projects enable row level security;

drop policy if exists "Anyone can read published projects" on public.projects;
drop policy if exists "Owners can read their projects" on public.projects;
drop policy if exists "Owners can create their projects" on public.projects;
drop policy if exists "Owners can update their projects" on public.projects;
drop policy if exists "Owners can delete their projects" on public.projects;
drop policy if exists "AppVault owner can read projects" on public.projects;
drop policy if exists "AppVault owner can create projects" on public.projects;
drop policy if exists "AppVault owner can update projects" on public.projects;
drop policy if exists "AppVault owner can delete projects" on public.projects;

create policy "AppVault owner can read projects" on public.projects
for select to authenticated
using (auth.uid() = '39427ebf-d52c-42de-b757-143ec7f9f7b0'::uuid and auth.uid() = owner_id);

create policy "AppVault owner can create projects" on public.projects
for insert to authenticated
with check (auth.uid() = '39427ebf-d52c-42de-b757-143ec7f9f7b0'::uuid and auth.uid() = owner_id);

create policy "AppVault owner can update projects" on public.projects
for update to authenticated
using (auth.uid() = '39427ebf-d52c-42de-b757-143ec7f9f7b0'::uuid and auth.uid() = owner_id)
with check (auth.uid() = '39427ebf-d52c-42de-b757-143ec7f9f7b0'::uuid and auth.uid() = owner_id);

create policy "AppVault owner can delete projects" on public.projects
for delete to authenticated
using (auth.uid() = '39427ebf-d52c-42de-b757-143ec7f9f7b0'::uuid and auth.uid() = owner_id);

-- Private storage bucket with a 100 MiB per-file limit.
insert into storage.buckets (id, name, public, file_size_limit)
values ('app-files', 'app-files', false, 104857600)
on conflict (id) do update set public = false, file_size_limit = 104857600;

drop policy if exists "Owners upload app files" on storage.objects;
drop policy if exists "Published app files can be downloaded" on storage.objects;
drop policy if exists "Owners can read app files" on storage.objects;
drop policy if exists "Owners delete app files" on storage.objects;
drop policy if exists "AppVault owner can upload app files" on storage.objects;
drop policy if exists "AppVault owner can read app files" on storage.objects;
drop policy if exists "AppVault owner can delete app files" on storage.objects;

create policy "AppVault owner can upload app files" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'app-files'
  and auth.uid() = '39427ebf-d52c-42de-b757-143ec7f9f7b0'::uuid
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "AppVault owner can read app files" on storage.objects
for select to authenticated
using (
  bucket_id = 'app-files'
  and auth.uid() = '39427ebf-d52c-42de-b757-143ec7f9f7b0'::uuid
  and exists (
    select 1 from public.projects p
    where p.storage_path = storage.objects.name and p.owner_id = auth.uid()
  )
);

create policy "AppVault owner can delete app files" on storage.objects
for delete to authenticated
using (
  bucket_id = 'app-files'
  and auth.uid() = '39427ebf-d52c-42de-b757-143ec7f9f7b0'::uuid
  and (storage.foldername(name))[1] = auth.uid()::text
);
