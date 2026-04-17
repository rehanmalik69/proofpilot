alter table public.evidence_files
alter column storage_bucket set default 'evidence-files';

insert into storage.buckets (id, name, public)
values ('evidence-files', 'evidence-files', false)
on conflict (id) do nothing;

drop policy if exists "evidence_files_bucket_read_own" on storage.objects;
create policy "evidence_files_bucket_read_own"
on storage.objects
for select
using (bucket_id = 'evidence-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "evidence_files_bucket_insert_own" on storage.objects;
create policy "evidence_files_bucket_insert_own"
on storage.objects
for insert
with check (bucket_id = 'evidence-files' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "evidence_files_bucket_delete_own" on storage.objects;
create policy "evidence_files_bucket_delete_own"
on storage.objects
for delete
using (bucket_id = 'evidence-files' and auth.uid()::text = (storage.foldername(name))[1]);
