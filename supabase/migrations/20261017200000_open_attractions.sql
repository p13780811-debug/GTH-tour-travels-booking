-- Source-attributed places, NOT tours or tickets. RLS denies unpublished records.
BEGIN;
CREATE TABLE IF NOT EXISTS public.gth_open_attractions (
 wikidata_qid text PRIMARY KEY CHECK(wikidata_qid ~ '^Q[1-9][0-9]{0,14}$'),
 name text NOT NULL CHECK(char_length(name) BETWEEN 2 AND 180),
 description text CHECK(description IS NULL OR char_length(description)<=500),
 region_slug text NOT NULL CHECK(region_slug IN ('goa','maharashtra')),
 country_code text NOT NULL DEFAULT 'IN' CHECK(country_code='IN'),
 category text NOT NULL CHECK(category IN ('attraction','fort','beach','national-park','castle')),
 latitude double precision NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude double precision NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 wikidata_url text NOT NULL CHECK(wikidata_url ~ '^https://www[.]wikidata[.]org/wiki/Q[1-9][0-9]{0,14}$'),
 source_license text NOT NULL DEFAULT 'CC0-1.0' CHECK(source_license='CC0-1.0'),
 image_url text CHECK(image_url IS NULL OR image_url LIKE 'https://upload.wikimedia.org/wikipedia/commons/%'),
 commons_page text CHECK(commons_page IS NULL OR commons_page LIKE 'https://commons.wikimedia.org/wiki/File:%'),
 image_author text,image_license text,image_license_url text,
 media_checked_at timestamptz,
 is_public boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT gth_attraction_photo_provenance CHECK(
  (image_url IS NULL AND commons_page IS NULL AND image_author IS NULL AND image_license IS NULL AND image_license_url IS NULL) OR
  (image_url IS NOT NULL AND commons_page IS NOT NULL AND image_author IS NOT NULL AND image_license IS NOT NULL AND image_license_url IS NOT NULL)
 )
);
CREATE INDEX IF NOT EXISTS gth_open_attractions_public_region_name ON public.gth_open_attractions(region_slug,category,name) WHERE is_public=true;
ALTER TABLE public.gth_open_attractions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gth_open_attractions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.gth_open_attractions TO anon,authenticated;
DROP POLICY IF EXISTS "Published CC0 attraction records" ON public.gth_open_attractions;
CREATE POLICY "Published CC0 attraction records" ON public.gth_open_attractions FOR SELECT TO anon,authenticated USING (is_public=true);
COMMENT ON TABLE public.gth_open_attractions IS 'Community-maintained CC0 places, not verified tour suppliers or bookable tickets.';
COMMIT;
CREATE OR REPLACE FUNCTION public.gth_upsert_open_attractions(p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp
AS $$
DECLARE changed integer := 0;
BEGIN
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'Invalid bounded import'; END IF;
 INSERT INTO public.gth_open_attractions AS existing
 (wikidata_qid,name,description,region_slug,country_code,category,latitude,longitude,wikidata_url,source_license,image_url,commons_page,image_author,image_license,image_license_url,media_checked_at)
 SELECT r.wikidata_qid,r.name,r.description,r.region_slug,r.country_code,r.category,r.latitude,r.longitude,r.wikidata_url,'CC0-1.0',
 r.image_url,r.commons_page,r.image_author,r.image_license,r.image_license_url,r.media_checked_at
 FROM jsonb_to_recordset(p_rows) AS r(
  wikidata_qid text,name text,description text,region_slug text,country_code text,category text,
  latitude double precision,longitude double precision,wikidata_url text,source_license text,
  image_url text,commons_page text,image_author text,image_license text,image_license_url text,media_checked_at timestamptz)
 ON CONFLICT(wikidata_qid) DO UPDATE SET
  name=EXCLUDED.name,description=COALESCE(EXCLUDED.description,existing.description),
  region_slug=EXCLUDED.region_slug,country_code=EXCLUDED.country_code,category=EXCLUDED.category,
  latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,wikidata_url=EXCLUDED.wikidata_url,
  image_url=COALESCE(EXCLUDED.image_url,existing.image_url),
  commons_page=CASE WHEN EXCLUDED.image_url IS NULL THEN existing.commons_page ELSE EXCLUDED.commons_page END,
  image_author=CASE WHEN EXCLUDED.image_url IS NULL THEN existing.image_author ELSE EXCLUDED.image_author END,
  image_license=CASE WHEN EXCLUDED.image_url IS NULL THEN existing.image_license ELSE EXCLUDED.image_license END,
  image_license_url=CASE WHEN EXCLUDED.image_url IS NULL THEN existing.image_license_url ELSE EXCLUDED.image_license_url END,
  media_checked_at=CASE WHEN EXCLUDED.image_url IS NULL THEN existing.media_checked_at ELSE EXCLUDED.media_checked_at END,
  updated_at=now();
 -- Never update is_public: only explicitly reviewed source records may be visible.
 GET DIAGNOSTICS changed=ROW_COUNT;
 RETURN changed;
END;$$;
REVOKE ALL ON FUNCTION public.gth_upsert_open_attractions(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gth_upsert_open_attractions(jsonb) TO service_role;
