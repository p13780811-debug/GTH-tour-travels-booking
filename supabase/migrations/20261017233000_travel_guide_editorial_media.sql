-- Isolated guide-publishing and rights-approved Wikimedia Commons media registry.
-- Never mutate existing OSM source records or the importer's source identity.
BEGIN;
CREATE TABLE IF NOT EXISTS public.gth_travel_guide_publications (
 slug text PRIMARY KEY CHECK (slug ~ '^[a-z]+(?:-[a-z]+)*(?:/[a-z]+(?:-[a-z]+)*)?$'),
 content_version integer NOT NULL DEFAULT 1 CHECK (content_version>=1),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
 editorial_reviewed_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT guide_publication_requires_review CHECK (status<>'published' OR editorial_reviewed_at IS NOT NULL)
);
ALTER TABLE public.gth_travel_guide_publications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gth_travel_guide_publications FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.gth_travel_guide_publications TO anon,authenticated;
DROP POLICY IF EXISTS "Read published editorial guides" ON public.gth_travel_guide_publications;
CREATE POLICY "Read published editorial guides" ON public.gth_travel_guide_publications
 FOR SELECT TO anon,authenticated USING (status='published' AND editorial_reviewed_at IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.gth_travel_guide_media (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 guide_slug text NOT NULL REFERENCES public.gth_travel_guide_publications(slug) ON DELETE RESTRICT,
 image_url text NOT NULL CHECK (image_url LIKE 'https://upload.wikimedia.org/wikipedia/commons/%'),
 source_page text NOT NULL CHECK (source_page LIKE 'https://commons.wikimedia.org/wiki/File:%'),
 source_name text NOT NULL DEFAULT 'Wikimedia Commons' CHECK (source_name='Wikimedia Commons'),
 license_type text NOT NULL CHECK (license_type IN ('CC BY 4.0','CC BY-SA 4.0','CC0 1.0','Public domain')),
 license_url text NOT NULL CHECK (license_url LIKE 'https://%'),
 attribution_text text NOT NULL CHECK (char_length(attribution_text) BETWEEN 3 AND 400),
 alt_text text NOT NULL CHECK (char_length(alt_text) BETWEEN 8 AND 180),
 width integer NOT NULL CHECK (width>=800),
 height integer NOT NULL CHECK (height>=500),
 is_hero boolean NOT NULL DEFAULT false,
 priority smallint NOT NULL DEFAULT 0 CHECK(priority BETWEEN 0 AND 100),
 editorial_approved boolean NOT NULL DEFAULT false,
 rights_reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT media_rights_review_required CHECK(NOT editorial_approved OR rights_reviewed_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS gth_travel_guide_media_approved ON public.gth_travel_guide_media (guide_slug, is_hero DESC, priority DESC)
 WHERE editorial_approved=true;
CREATE UNIQUE INDEX IF NOT EXISTS gth_travel_guide_media_source_unique
 ON public.gth_travel_guide_media (guide_slug,image_url);
ALTER TABLE public.gth_travel_guide_media ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gth_travel_guide_media FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.gth_travel_guide_media TO anon,authenticated;
DROP POLICY IF EXISTS "Read approved licensed guide imagery" ON public.gth_travel_guide_media;
CREATE POLICY "Read approved licensed guide imagery" ON public.gth_travel_guide_media
 FOR SELECT TO anon,authenticated USING (editorial_approved=true AND rights_reviewed_at IS NOT NULL);
COMMENT ON TABLE public.gth_travel_guide_media IS
 'Editor-approved licensed travel guide media, stored separately from ODbL OSM places. Never implies verified attraction inventory.';
-- Candidate guides remain drafts until BOTH a human editorial check and a
-- separate media-rights check. Public index gates additionally enforce both.
INSERT INTO public.gth_travel_guide_publications (slug,content_version,status)
 VALUES ('india',1,'draft'),('france',1,'draft'),('australia',1,'draft'),
 ('dubai',1,'draft'),('paris',1,'draft'),('mumbai',1,'draft'),('goa',1,'draft'),
 ('paris/eiffel-tower-nearby-things-to-do',1,'draft')
 ON CONFLICT(slug) DO NOTHING;
COMMIT;
