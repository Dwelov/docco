-- Dataset Showcase schema (Phase 2, PRD §5).
-- Run once in Supabase → SQL Editor. Then create a public Storage
-- bucket named `datasets` (50 MB limit) in Storage settings.

create table public.datasets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  properties jsonb not null default '[]',
  columns jsonb not null default '[]',
  preview_rows jsonb not null default '[]',
  row_count integer not null default 0,
  column_count integer not null default 0,
  file_path text,
  file_url text,
  file_size_bytes bigint,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.datasets enable row level security;
-- No policies on purpose: the anon key can read/write nothing.
-- Only server code using the service role key touches this table.

-- Allow public (anon) downloads from the `datasets` bucket.
-- Safe to re-run; skips if the policy already exists.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read datasets'
  ) then
    create policy "Public read datasets"
      on storage.objects for select
      using (bucket_id = 'datasets');
  end if;
end $$;
