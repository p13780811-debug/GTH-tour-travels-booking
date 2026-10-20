-- Additive contract. Existing columns, unique indexes, policies and marketplace trust remain intact.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS developer_name text,
  ADD COLUMN IF NOT EXISTS locality text,
  ADD COLUMN IF NOT EXISTS unit_types text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS min_carpet_sqft numeric,
  ADD COLUMN IF NOT EXISTS max_carpet_sqft numeric,
  ADD COLUMN IF NOT EXISTS possession_date date,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS verified_status boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registry_evidence jsonb,
  ADD COLUMN IF NOT EXISTS osm_geometry jsonb,
  ADD COLUMN IF NOT EXISTS osm_evidence jsonb,
  ADD COLUMN IF NOT EXISTS registry_media_evidence jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS illustrative_media jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.properties.verified_status IS
  'Official registry identity matched by exact RERA ID, project name and district. NOT GTH/AI verification, title, availability or media approval. Defaults false.';
COMMENT ON COLUMN public.properties.illustrative_media IS
  'Reviewed commercial-use category artwork; never project photography and never a hero/gallery exact-project asset.';
COMMENT ON COLUMN public.properties.osm_geometry IS
  'Optional closed OSM building footprint, not cadastral boundary. Preserve ODbL attribution from osm_evidence.';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.properties'::regclass AND conname='properties_registry_coverage_check') THEN
    ALTER TABLE public.properties ADD CONSTRAINT properties_registry_coverage_check CHECK (
      (min_carpet_sqft IS NULL OR min_carpet_sqft > 0) AND
      (max_carpet_sqft IS NULL OR max_carpet_sqft > 0) AND
      (min_carpet_sqft IS NULL OR max_carpet_sqft IS NULL OR min_carpet_sqft <= max_carpet_sqft) AND
      (latitude IS NULL OR latitude BETWEEN -90 AND 90) AND
      (longitude IS NULL OR longitude BETWEEN -180 AND 180) AND
      (NOT verified_status OR COALESCE(registry_evidence->>'exact_detail_match', 'false') = 'true')
    ) NOT VALID;
  END IF;
END $$;
-- rera_id and slug already have unique indexes in the inspected production schema.
-- No trust flag backfill; no raw data copy; no GRANT or public-write policy changes.
COMMIT;
