alter table public.cases
add column if not exists status text not null default 'draft';

update public.cases
set status = 'draft'
where status is null;

update public.cases
set status = 'draft'
where status = 'pending';

update public.cases
set status = 'resolved'
where status = 'closed';

alter table public.cases
drop constraint if exists cases_status_check;

alter table public.cases
add constraint cases_status_check
check (status in ('draft', 'under_review', 'ready_to_submit', 'submitted', 'resolved'));
