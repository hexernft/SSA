create table if not exists public.online_records (
  collection text not null,
  record_id text not null,
  data jsonb,
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  primary key (collection, record_id)
);

alter table public.online_records enable row level security;

drop policy if exists "Authenticated staff can read online records" on public.online_records;
create policy "Authenticated staff can read online records"
  on public.online_records
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated staff can insert online records" on public.online_records;
create policy "Authenticated staff can insert online records"
  on public.online_records
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated staff can update online records" on public.online_records;
create policy "Authenticated staff can update online records"
  on public.online_records
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated staff can delete online records" on public.online_records;
create policy "Authenticated staff can delete online records"
  on public.online_records
  for delete
  to authenticated
  using (true);

create index if not exists online_records_collection_updated_at_idx
  on public.online_records (collection, updated_at desc);
