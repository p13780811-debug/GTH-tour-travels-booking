-- Disposable PostgreSQL fixtures only; never run against production.
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA extensions;
CREATE EXTENSION vector WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA public, extensions TO anon, authenticated, service_role;
CREATE TABLE public.properties (id bigint PRIMARY KEY, title text, slug text, verified boolean, status text, source_type text, official_source_reference text, official_source_url text);
CREATE TABLE public.tenders (id uuid PRIMARY KEY, title text, is_public boolean, source_verified boolean, status text, deadline_at timestamptz, source_url text);
CREATE TABLE public.gth_osm_attractions (source_id text PRIMARY KEY, name text, is_public boolean, source_license text, source_url text);
CREATE TABLE public.hotel_catalog (source_id text PRIMARY KEY, name text, source text, source_license text, source_url text);
GRANT SELECT ON public.properties, public.tenders, public.gth_osm_attractions, public.hotel_catalog TO service_role;
