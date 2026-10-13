-- GTH PRO Tender Intelligence v1 (additive, RLS-first, no fake inventory).
-- Apply only after checking the target Supabase project. This migration inserts ZERO tenders.
create table if not exists public.tenders (
 id uuid primary key default gen_random_uuid(),
 source_name text not null check (char_length(source_name) between 2 and 120),
 source_reference text not null check (char_length(source_reference) between 2 and 160),
 source_url text not null check (source_url ~* '^https://[^[:space:]/]+/?.*$'),
 title text not null check (char_length(title) between 5 and 240),
 buyer text not null check (char_length(buyer) between 2 and 180),
 country_code text not null check (country_code ~ '^[A-Z]{2}$'),
 region text,
 sector text not null default 'other' check (sector in ('works','goods','services','consultancy','other')),
 summary text,
 deadline_at timestamptz not null,
 published_at timestamptz,
 estimated_value numeric(18,2) check (estimated_value is null or estimated_value >= 0),
 currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
 status text not null default 'review' check (status in ('review','published','archived')),
 source_verified boolean not null default false,
 is_public boolean not null default false,
 imported_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (source_name, source_reference),
 constraint tender_publication_requires_verified_source check (
   not (is_public or status = 'published') or source_verified
 ),
 constraint tender_published_requires_public check (
   status <> 'published' or is_public
 )
);
create index if not exists tenders_public_deadline_idx on public.tenders (deadline_at, id)
 where is_public and source_verified and status = 'published';
create index if not exists tenders_public_country_sector_idx on public.tenders (country_code, sector, deadline_at)
 where is_public and source_verified and status = 'published';
create table if not exists public.tender_ingestion_runs (
 id bigint generated always as identity primary key,
 source_name text not null,
 input_reference text not null,
 mode text not null check (mode in ('dry_run','commit')),
 imported_count integer not null default 0,
 rejected_count integer not null default 0,
 executed_at timestamptz not null default now()
);
alter table public.tenders enable row level security;
alter table public.tender_ingestion_runs enable row level security;
revoke all on public.tenders from public, anon, authenticated;
revoke all on public.tender_ingestion_runs from public, anon, authenticated;
grant select on public.tenders to anon, authenticated;
drop policy if exists "Public reads reviewed and current tenders" on public.tenders;
create policy "Public reads reviewed and current tenders" on public.tenders
 for select to anon, authenticated
 using (is_public = true and source_verified = true and status = 'published' and deadline_at > now());
comment on table public.tenders is 'Source-attributed tender notices. Publication requires independent verification; no application-side public writes.';
comment on table public.tender_ingestion_runs is 'Private audit of authorised tender imports; never exposed to anonymous users.';
