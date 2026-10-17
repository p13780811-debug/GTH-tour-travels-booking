-- Independent ODbL-labelled community attraction directory (not sellable inventory).
BEGIN;
CREATE TABLE IF NOT EXISTS public.gth_osm_attractions (
 source_id text PRIMARY KEY CHECK (source_id ~ '^(node|way|relation)/[1-9][0-9]{0,18}$'),
 name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 180),
 category text NOT NULL CHECK(category IN ('attraction','museum','viewpoint','zoo','theme-park','fort','castle','ruins','monument','archaeological-site','beach','national-park','park','nature-reserve')),
 region_scope text NOT NULL CHECK(region_scope IN ('goa','india')),
 city text CHECK(city IS NULL OR char_length(city)<=100),
 latitude double precision NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude double precision NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 source_url text NOT NULL,
 source_region text NOT NULL,
 source_license text NOT NULL DEFAULT 'ODbL-1.0' CHECK(source_license='ODbL-1.0'),
 wikidata_qid text CHECK (wikidata_qid IS NULL OR wikidata_qid ~ '^Q[1-9][0-9]{0,14}$'),
 is_community_directory boolean NOT NULL DEFAULT true CHECK(is_community_directory=true),
 is_public boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT open_osm_attraction_url CHECK(source_url = 'https://www.openstreetmap.org/' || source_id)
);
CREATE INDEX IF NOT EXISTS gth_osm_attractions_region_category ON public.gth_osm_attractions(region_scope,category,name) WHERE is_public=true;
CREATE INDEX IF NOT EXISTS gth_osm_attractions_city ON public.gth_osm_attractions(city) WHERE is_public=true;
ALTER TABLE public.gth_osm_attractions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gth_osm_attractions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.gth_osm_attractions TO anon,authenticated;
DROP POLICY IF EXISTS "Public community ODbL attraction directory" ON public.gth_osm_attractions;
CREATE POLICY "Public community ODbL attraction directory" ON public.gth_osm_attractions
 FOR SELECT TO anon,authenticated USING (is_public=true AND is_community_directory=true);
COMMENT ON TABLE public.gth_osm_attractions IS 'Source-backed OSM place directory; not verified venue operations, tour inventory, ticket availability or licensed property photography. ODbL attribution required.';
COMMIT;

CREATE OR REPLACE FUNCTION public.gth_upsert_osm_attractions(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE changed integer;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 100
 THEN RAISE EXCEPTION 'Invalid bounded OSM import'; END IF;
 INSERT INTO public.gth_osm_attractions AS current
 (source_id,name,category,region_scope,city,latitude,longitude,source_url,source_region,source_license,wikidata_qid)
 SELECT r.source_id,r.name,r.category,r.region_scope,r.city,r.latitude,r.longitude,r.source_url,r.source_region,
 'ODbL-1.0',r.wikidata_qid
 FROM jsonb_to_recordset(p_rows) AS r(
 source_id text,name text,category text,region_scope text,city text,
 latitude double precision,longitude double precision,source_url text,source_region text,
 source_license text,wikidata_qid text)
 ON CONFLICT(source_id) DO UPDATE SET
 name=EXCLUDED.name,category=EXCLUDED.category,region_scope=EXCLUDED.region_scope,
 city=COALESCE(EXCLUDED.city,current.city),latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,
 source_url=EXCLUDED.source_url,source_region=EXCLUDED.source_region,
 wikidata_qid=COALESCE(EXCLUDED.wikidata_qid,current.wikidata_qid),updated_at=now();
 -- Never alter is_public or append commercial booking metadata.
 GET DIAGNOSTICS changed=ROW_COUNT;
 RETURN changed;
END;$$;
REVOKE ALL ON FUNCTION public.gth_upsert_osm_attractions(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gth_upsert_osm_attractions(jsonb) TO service_role;
