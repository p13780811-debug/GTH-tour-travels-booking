-- Additive global geography, searchable source records and public factual sync progress.
-- The existing India and Goa records, review flags and public RLS remain untouched.
BEGIN;
ALTER TABLE public.gth_osm_attractions
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS country_name text;
ALTER TABLE public.gth_osm_attractions DROP CONSTRAINT IF EXISTS gth_osm_attractions_region_scope_check;
ALTER TABLE public.gth_osm_attractions
  ADD CONSTRAINT gth_osm_attractions_region_scope_check
    CHECK (region_scope IN ('goa','india','world')),
  ADD CONSTRAINT gth_osm_country_code_check CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT gth_osm_country_name_check CHECK (country_name IS NULL OR char_length(country_name) BETWEEN 2 AND 100);
UPDATE public.gth_osm_attractions
  SET country_code='IN',country_name='India'
  WHERE source_region LIKE 'asia/india/%' AND country_code IS NULL;
CREATE INDEX IF NOT EXISTS gth_osm_attractions_country_keyset
  ON public.gth_osm_attractions(country_code,source_id)
  WHERE is_public=true AND is_community_directory=true;
CREATE INDEX IF NOT EXISTS gth_osm_attractions_category_keyset
  ON public.gth_osm_attractions(category,source_id)
  WHERE is_public=true AND is_community_directory=true;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS gth_osm_attractions_name_trgm
  ON public.gth_osm_attractions USING gin (name gin_trgm_ops)
  WHERE is_public=true AND is_community_directory=true;
CREATE OR REPLACE VIEW public.gth_osm_attraction_country_counts
  WITH (security_invoker = true) AS
  SELECT country_code,MAX(country_name) AS country_name,COUNT(*)::bigint AS records,
         MAX(updated_at) AS last_source_write
  FROM public.gth_osm_attractions
  WHERE is_public=true AND is_community_directory=true AND country_code IS NOT NULL
  GROUP BY country_code;
REVOKE ALL ON public.gth_osm_attraction_country_counts FROM PUBLIC;
GRANT SELECT ON public.gth_osm_attraction_country_counts TO anon,authenticated;
CREATE TABLE IF NOT EXISTS public.gth_osm_attraction_sync_runs (
  run_id text PRIMARY KEY CHECK (run_id ~ '^[0-9]{1,20}$'),
  source_region text NOT NULL CHECK (source_region ~ '^[a-z0-9-]+(/[a-z0-9-]+){0,5}$'),
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  country_name text NOT NULL CHECK (char_length(country_name) BETWEEN 2 AND 100),
  accepted integer NOT NULL CHECK (accepted BETWEEN 0 AND 250000),
  completed_at timestamptz NOT NULL DEFAULT now(),
  source_license text NOT NULL DEFAULT 'ODbL-1.0' CHECK(source_license='ODbL-1.0')
);
ALTER TABLE public.gth_osm_attraction_sync_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gth_osm_attraction_sync_runs FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.gth_osm_attraction_sync_runs TO anon,authenticated;
CREATE POLICY "Public successful source sync metadata" ON public.gth_osm_attraction_sync_runs
 FOR SELECT TO anon,authenticated USING (true);
CREATE OR REPLACE FUNCTION public.gth_upsert_osm_attractions(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE changed integer;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 100
 THEN RAISE EXCEPTION 'Invalid bounded OSM import'; END IF;
 INSERT INTO public.gth_osm_attractions AS current
 (source_id,name,category,region_scope,city,latitude,longitude,source_url,source_region,source_license,wikidata_qid,country_code,country_name)
 SELECT r.source_id,r.name,r.category,r.region_scope,r.city,r.latitude,r.longitude,r.source_url,r.source_region,
 'ODbL-1.0',r.wikidata_qid,r.country_code,r.country_name
 FROM jsonb_to_recordset(p_rows) AS r(
 source_id text,name text,category text,region_scope text,city text,
 latitude double precision,longitude double precision,source_url text,source_region text,
 source_license text,wikidata_qid text,country_code text,country_name text)
 ON CONFLICT(source_id) DO UPDATE SET
 name=EXCLUDED.name,category=EXCLUDED.category,
 region_scope=CASE WHEN current.region_scope='goa' AND EXCLUDED.country_code='IN' THEN 'goa' ELSE EXCLUDED.region_scope END,
 city=COALESCE(EXCLUDED.city,current.city),latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,
 source_url=EXCLUDED.source_url,source_region=EXCLUDED.source_region,
 wikidata_qid=COALESCE(EXCLUDED.wikidata_qid,current.wikidata_qid),
 country_code=COALESCE(EXCLUDED.country_code,current.country_code),
 country_name=COALESCE(EXCLUDED.country_name,current.country_name),updated_at=now();
 -- Preserve moderation / review state and never append commercial product claims.
 GET DIAGNOSTICS changed=ROW_COUNT;
 RETURN changed;
END;$$;
REVOKE ALL ON FUNCTION public.gth_upsert_osm_attractions(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gth_upsert_osm_attractions(jsonb) TO service_role;
COMMIT;