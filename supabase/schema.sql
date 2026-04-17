create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  dispute_type text not null,
  merchant_name text not null,
  issue_description text not null,
  transaction_amount numeric(12, 2),
  incident_date date,
  status text not null default 'draft' check (status in ('draft', 'under_review', 'ready_to_submit', 'submitted', 'resolved')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size integer,
  mime_type text,
  storage_bucket text not null default 'evidence-files',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  analysis_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = nullif(excluded.full_name, ''),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_cases_updated_at on public.cases;
create trigger set_cases_updated_at
before update on public.cases
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_analyses_updated_at on public.analyses;
create trigger set_analyses_updated_at
before update on public.analyses
for each row execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.evidence_files enable row level security;
alter table public.analyses enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);

create policy "cases_manage_own"
on public.cases
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "evidence_manage_own"
on public.evidence_files
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "analyses_manage_own"
on public.analyses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('evidence-files', 'evidence-files', false)
on conflict (id) do nothing;

create policy "evidence_files_bucket_read_own"
on storage.objects
for select
using (bucket_id = 'evidence-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "evidence_files_bucket_insert_own"
on storage.objects
for insert
with check (bucket_id = 'evidence-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "evidence_files_bucket_delete_own"
on storage.objects
for delete
using (bucket_id = 'evidence-files' and auth.uid()::text = (storage.foldername(name))[1]);
