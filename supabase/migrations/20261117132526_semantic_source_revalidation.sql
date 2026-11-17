-- Revalidate public source eligibility at query time; preserve service-only access.
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
   -- A withdrawn, expired, renamed or re-routed source must disappear immediately,
   -- even while its bounded embedding cache has time remaining.
   AND (
     (s.sector = 'tender' AND EXISTS (
       SELECT 1 FROM public.tenders t WHERE t.id::text = s.source_ref
       AND t.is_public AND t.source_verified AND t.status = 'published'
       AND t.deadline_at > now() AND t.title = s.title
       AND t.source_url = s.source_url AND s.canonical_path = '/tender/' || t.id::text
     )) OR
     (s.sector = 'property' AND EXISTS (
       SELECT 1 FROM public.properties p WHERE p.id::text = s.source_ref
       AND p.verified AND p.status IS DISTINCT FROM 'archived'
       AND p.source_type IS DISTINCT FROM 'rera'
       AND nullif(trim(p.official_source_reference), '') IS NOT NULL
       AND p.official_source_url = s.source_url AND p.title = s.title
       AND s.canonical_path = '/real-estate/' || p.slug
     )) OR
     (s.sector = 'attraction' AND EXISTS (
       SELECT 1 FROM public.gth_osm_attractions a WHERE a.source_id = s.source_ref
       AND a.is_public AND a.source_license = 'ODbL-1.0' AND a.name = s.title
       AND a.source_url = s.source_url
       AND a.source_url = 'https://www.openstreetmap.org/' || a.source_id
       AND s.canonical_path = '/attractions/osm/' || replace(a.source_id, '/', '-')
     )) OR
     (s.sector = 'hotel_directory' AND EXISTS (
       SELECT 1 FROM public.hotel_catalog h WHERE h.source_id = s.source_ref
       AND h.source = 'osm' AND h.source_license = 'ODbL-1.0' AND h.name = s.title
       AND h.source_url = s.source_url
       AND h.source_url = 'https://www.openstreetmap.org/' || h.source_id
       AND s.canonical_path = '/hotels/stay/osm:' || replace(h.source_id, '/', '-')
     ))
   )
   AND s.embedding IS NOT NULL
   AND (1-(s.embedding <=> p_embedding)) >= 0.35
 ORDER BY s.embedding <=> p_embedding, s.sector, s.source_ref
 LIMIT least(greatest(coalesce(p_limit,8),1),8);
$$;
REVOKE ALL ON FUNCTION public.gth_semantic_match(extensions.vector,text,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gth_semantic_match(extensions.vector,text,text,integer) TO service_role;
