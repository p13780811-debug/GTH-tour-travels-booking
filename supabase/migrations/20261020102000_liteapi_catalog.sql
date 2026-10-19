-- GTH PRO / LiteAPI licensed provider-content catalogue.
-- Additive only. OSM directory, reviewed hotels and booking mappings unchanged.
-- Apply as part of the approved consolidated release. Never run against production implicitly.
CREATE TABLE IF NOT EXISTS public.liteapi_hotel_catalog (
  hotel_id text PRIMARY KEY CHECK(hotel_id ~ '^[A-Za-z0-9_-]{1,128}$'),
  name text NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 240),
  city text,
  country_code text NOT NULL CHECK(country_code ~ '^[A-Z]{2}$'),
  address text,
  latitude double precision CHECK(latitude BETWEEN -90 AND 90),
  longitude double precision CHECK(longitude BETWEEN -180 AND 180),
  stars numeric(2,1) CHECK(stars BETWEEN 1 AND 5),
  hotel_type_id integer,
  category text,
  primary_image_url text,
  gallery_urls text[] NOT NULL DEFAULT '{}'::text[],
  amenities text[] NOT NULL DEFAULT '{}'::text[],
  description text,
  provider_updated_at timestamptz,
  details_fetched_at timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  source_name text NOT NULL DEFAULT 'LiteAPI / Nuitée',
  source_endpoint text NOT NULL DEFAULT '/v3.0/data/hotels',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS liteapi_hotel_catalog_country_city_idx
  ON public.liteapi_hotel_catalog(country_code,lower(city),hotel_id);
CREATE INDEX IF NOT EXISTS liteapi_hotel_catalog_published_idx
  ON public.liteapi_hotel_catalog(country_code,lower(city),hotel_id) WHERE is_published;
CREATE TABLE IF NOT EXISTS public.liteapi_hotel_sync_progress (
  country_code text NOT NULL CHECK(country_code ~ '^[A-Z]{2}$'),
  city_name text NOT NULL DEFAULT '',
  next_offset integer NOT NULL DEFAULT 0 CHECK(next_offset >= 0),
  sync_since timestamptz,
  last_completed_at timestamptz,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'partial' CHECK(status IN ('partial','complete','failed')),
  pages_completed bigint NOT NULL DEFAULT 0,
  rows_processed bigint NOT NULL DEFAULT 0,
  PRIMARY KEY(country_code,city_name)
);
ALTER TABLE public.liteapi_hotel_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liteapi_hotel_sync_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.liteapi_hotel_catalog FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.liteapi_hotel_sync_progress FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.liteapi_hotel_catalog TO anon, authenticated;
CREATE POLICY "liteapi published source content only"
  ON public.liteapi_hotel_catalog FOR SELECT TO anon,authenticated
  USING (is_published = true);
-- Only privileged ingestion processes can write or read sync progress.
-- Keep source content unpublished until account entitlements and image display rights are reviewed.
COMMENT ON TABLE public.liteapi_hotel_catalog IS
 'Provider-specific static LiteAPI content. is_published defaults false. Not a guaranteed rate, booking, endorsement, verified guest rating or confirmed availability. Preserve provider media rights.';

-- Atomic provider-ID deduplication. Summary refreshes cannot wipe previously fetched
-- full descriptions/gallery/amenities. Function is SECURITY INVOKER, service role only.
CREATE OR REPLACE FUNCTION public.liteapi_upsert_summaries(p_rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE n integer;
BEGIN
  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_rows) > 500 THEN
    RAISE EXCEPTION 'Invalid provider batch';
  END IF;
  INSERT INTO public.liteapi_hotel_catalog
   (hotel_id,name,city,country_code,address,latitude,longitude,stars,
    hotel_type_id,category,primary_image_url,provider_updated_at)
  SELECT h.hotel_id,h.name,h.city,h.country_code,h.address,h.latitude,h.longitude,
         h.stars,h.hotel_type_id,h.category,h.primary_image_url,h.provider_updated_at
  FROM jsonb_to_recordset(p_rows) AS h(
    hotel_id text,name text,city text,country_code text,address text,
    latitude double precision,longitude double precision,stars numeric,
    hotel_type_id integer,category text,primary_image_url text,provider_updated_at timestamptz
  )
  WHERE h.hotel_id ~ '^[A-Za-z0-9_-]{1,128}$'
    AND length(trim(h.name)) BETWEEN 2 AND 240
    AND h.country_code ~ '^[A-Z]{2}$'
    AND (h.stars IS NULL OR h.stars BETWEEN 1 AND 5)
  ON CONFLICT(hotel_id) DO UPDATE SET
    name=excluded.name,
    city=COALESCE(excluded.city,public.liteapi_hotel_catalog.city),
    country_code=excluded.country_code,
    address=COALESCE(excluded.address,public.liteapi_hotel_catalog.address),
    latitude=COALESCE(excluded.latitude,public.liteapi_hotel_catalog.latitude),
    longitude=COALESCE(excluded.longitude,public.liteapi_hotel_catalog.longitude),
    stars=COALESCE(excluded.stars,public.liteapi_hotel_catalog.stars),
    hotel_type_id=COALESCE(excluded.hotel_type_id,public.liteapi_hotel_catalog.hotel_type_id),
    category=COALESCE(excluded.category,public.liteapi_hotel_catalog.category),
    primary_image_url=COALESCE(excluded.primary_image_url,public.liteapi_hotel_catalog.primary_image_url),
    provider_updated_at=COALESCE(excluded.provider_updated_at,public.liteapi_hotel_catalog.provider_updated_at),
    last_seen_at=now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.liteapi_upsert_summaries(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.liteapi_upsert_summaries(jsonb) TO service_role;
