-- Disposable PostgreSQL fixture for RE-05/06: no external accounts or production writes.
\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create role service_role;
create schema if not exists auth;
create schema if not exists storage;

create table auth.users (id uuid primary key);
insert into auth.users (id) values
('11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222222'),
('33333333-3333-4333-8333-333333333333');

create or replace function auth.uid() returns uuid language sql stable as $$
select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb);
$$;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
select (string_to_array(name,'/'))[1:(cardinality(string_to_array(name,'/')) - 1)];
$$;
create table public.properties(
 id bigint primary key,
 title text not null,
 rera_id text not null,
 source_type text not null
);
insert into public.properties values
(42,'Real Registry Project','P51800002057','registry'),
(43,'Other Registry Project','P51800002058','registry');
create table storage.buckets(
 id text primary key,
 name text not null,
 public boolean not null default false,
 file_size_limit bigint,
 allowed_mime_types text[]
);
create table storage.objects(
 id uuid primary key default gen_random_uuid(),
 bucket_id text not null references storage.buckets(id),
 name text not null unique,
 metadata jsonb not null default '{}'::jsonb
);
alter table storage.objects enable row level security;
grant usage on schema auth, storage, public to authenticated;
grant select on public.properties to authenticated;
grant select,insert,delete on storage.objects to authenticated;
