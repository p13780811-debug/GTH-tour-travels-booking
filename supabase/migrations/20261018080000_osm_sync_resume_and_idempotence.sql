-- Resume oversized licensed Geofabrik regions across bounded GitHub Actions runs.
-- Keep existing public RLS, publication moderation and imported ODbL records unchanged.
BEGIN;

ALTER TABLE public.gth_osm_attraction_sync_runs
  ADD COLUMN IF NOT EXISTS next_offset integer NOT NULL DEFAULT 0
    CHECK (next_offset BETWEEN 0 AND 10000000),
  ADD COLUMN IF NOT EXISTS complete boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS gth_osm_sync_runs_region_latest
  ON public.gth_osm_attraction_sync_runs (source_region, completed_at DESC, run_id DESC);

-- Internal-only status for the already OIDC-authorized ingest gateway.
-- Latest successful receipt, not an optimistic in-flight claim.
CREATE OR REPLACE FUNCTION public.gth_osm_region_status()
RETURNS TABLE(
  source_region text,
  next_offset integer,
  complete boolean,
  last_completed_at timestamptz
)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path=public,pg_temp AS $$
  SELECT DISTINCT ON (r.source_region)
    r.source_region, r.next_offset, r.complete, r.completed_at
  FROM public.gth_osm_attraction_sync_runs AS r
  ORDER BY r.source_region, r.completed_at DESC, r.run_id DESC;
$$;
REVOKE ALL ON FUNCTION public.gth_osm_region_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gth_osm_region_status() TO service_role;

-- Batch-level capacity brake protects the Free database quota, including
-- unrelated GTH PRO tables. No deletion/truncation or automatic upsizing.
-- A successful conflict on unchanged data must NOT create a fresh row version.
CREATE OR REPLACE FUNCTION public.gth_upsert_osm_attractions(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE changed integer;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 100
 THEN RAISE EXCEPTION 'Invalid bounded OSM import'; END IF;
 IF pg_database_size(current_database()) >= 450 * 1024 * 1024
 THEN RAISE EXCEPTION 'OSM import stopped at configured database size guard'; END IF;

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
 region_scope=CASE WHEN current.region_scope='goa' AND EXCLUDED.country_code='IN'
                   THEN 'goa' ELSE EXCLUDED.region_scope END,
 city=COALESCE(EXCLUDED.city,current.city),
 latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,
 source_url=EXCLUDED.source_url,source_region=EXCLUDED.source_region,
 wikidata_qid=COALESCE(EXCLUDED.wikidata_qid,current.wikidata_qid),
 country_code=COALESCE(EXCLUDED.country_code,current.country_code),
 country_name=COALESCE(EXCLUDED.country_name,current.country_name),
 updated_at=now()
 WHERE (current.name,current.category,current.region_scope,current.city,
        current.latitude,current.longitude,current.source_url,current.source_region,
        current.wikidata_qid,current.country_code,current.country_name)
 IS DISTINCT FROM
       (EXCLUDED.name,EXCLUDED.category,
        CASE WHEN current.region_scope='goa' AND EXCLUDED.country_code='IN'
             THEN 'goa' ELSE EXCLUDED.region_scope END,
        COALESCE(EXCLUDED.city,current.city),
        EXCLUDED.latitude,EXCLUDED.longitude,EXCLUDED.source_url,EXCLUDED.source_region,
        COALESCE(EXCLUDED.wikidata_qid,current.wikidata_qid),
        COALESCE(EXCLUDED.country_code,current.country_code),
        COALESCE(EXCLUDED.country_name,current.country_name));
 GET DIAGNOSTICS changed=ROW_COUNT;
 RETURN changed;
END;$$;

REVOKE ALL ON FUNCTION public.gth_upsert_osm_attractions(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gth_upsert_osm_attractions(jsonb) TO service_role;
COMMIT;
