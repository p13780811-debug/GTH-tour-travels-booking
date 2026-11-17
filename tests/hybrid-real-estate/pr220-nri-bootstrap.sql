-- Disposable CI-only compatibility fixture for NRI schema migration.
create table if not exists public.property_leads (
 id bigint generated always as identity primary key
);
