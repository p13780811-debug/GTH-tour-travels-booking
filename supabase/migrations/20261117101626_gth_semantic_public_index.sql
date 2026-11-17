-- GTH PRO semantic source index (opt-in, zero automatic data backfill).
-- The vector extension already lives in the non-exposed "extensions" schema.
-- No changes to existing RLS policies, properties, tender data, or supplier integrations.
CREATE TABLE IF NOT EXISTS public.gth_semantic_public_records (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sector text NOT NULL CHECK (sector IN ('property','tender','attraction','stadium','hotel_directory')),
  source_ref text NOT NULL CHECK (length(source_ref) BETWEEN 1 AND 150),
  title text NOT NULL CHECK (length(title) BETWEEN 3 AND 220),
  excerpt text NOT NULL CHECK (length(excerpt) BETWEEN 8 AND 1200),
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  city text CHECK (city IS NULL OR length(city) <= 100),
  canonical_path text NOT NULL CHECK (canonical_path ~ '^/(real-estate|tender|attractions|stadiums|hotels)/[a-zA-Z0-9/_-]{1,180}$'),
  source_url text NOT NULL CHECK (source_url ~ '^https://[^[:space:]]{4,1024}$'),
  embedding extensions.vector(384) NOT NULL,
  model text NOT NULL DEFAULT 'gte-small' CHECK (model = 'gte-small'),
  source_verified boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT false,
  source_deadline_at timestamptz,
  indexed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  CONSTRAINT gth_semantic_unique_source UNIQUE (sector, source_ref),
  CONSTRAINT gth_semantic_expiry CHECK (expires_at >= indexed_at)
);
COMMENT ON TABLE public.gth_semantic_public_records IS
  'Opt-in compact, source-reviewed public text embeddings (gte-small/384). No private content or 174k-row automatic backfill. Source rights and eligibility must be verified by restricted ingester.';
ALTER TABLE public.gth_semantic_public_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gth_semantic_public_select ON public.gth_semantic_public_records;
CREATE POLICY gth_semantic_public_select ON public.gth_semantic_public_records
  FOR SELECT TO anon, authenticated
  USING (source_verified AND is_public AND expires_at > now()
    AND (source_deadline_at IS NULL OR source_deadline_at > now()));
REVOKE ALL ON public.gth_semantic_public_records FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.gth_semantic_public_records TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gth_semantic_public_records TO service_role;
CREATE INDEX IF NOT EXISTS gth_semantic_public_eligible_idx
  ON public.gth_semantic_public_records(country_code, sector, expires_at)
  WHERE source_verified AND is_public;

-- Always invoker: RLS is enforced on the selected rows, no service-role bypass.
CREATE OR REPLACE FUNCTION public.gth_semantic_match(
  p_embedding extensions.vector(384),
  p_country text DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  sector text,
  source_ref text,
  title text,
  excerpt text,
  country_code text,
  city text,
  canonical_path text,
  source_url text,
  similarity double precision,
  indexed_at timestamptz
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, extensions, pg_temp AS $$
 SELECT s.sector,s.source_ref,s.title,s.excerpt,s.country_code,s.city,
   s.canonical_path,s.source_url, 1-(s.embedding <=> p_embedding) AS similarity,s.indexed_at
 FROM public.gth_semantic_public_records s
 WHERE s.source_verified AND s.is_public AND s.expires_at > now()
   AND (s.source_deadline_at IS NULL OR s.source_deadline_at > now())
   AND (p_country IS NULL OR (p_country ~ '^[A-Z]{2}$' AND s.country_code=p_country))
   AND (p_sector IS NULL OR (p_sector IN ('property','tender','attraction','stadium','hotel_directory') AND s.sector=p_sector))
   AND s.embedding IS NOT NULL
   AND (1-(s.embedding <=> p_embedding)) >= 0.35
 ORDER BY s.embedding <=> p_embedding, s.sector, s.source_ref
 LIMIT least(greatest(coalesce(p_limit,8),1),8);
$$;
REVOKE ALL ON FUNCTION public.gth_semantic_match(extensions.vector,text,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gth_semantic_match(extensions.vector,text,text,integer) TO anon, authenticated;
