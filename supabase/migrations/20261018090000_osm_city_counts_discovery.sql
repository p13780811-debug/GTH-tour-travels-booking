-- Read-only city discovery computed from real, source-tagged ODbL places.
-- No city inferred from an attraction's name or coarse country extract.
-- A minimum of two source-tagged records keeps misleading singleton labels off discovery.
BEGIN;
CREATE OR REPLACE VIEW public.gth_osm_attraction_city_counts
WITH (security_invoker = true) AS
SELECT country_code,
       MAX(country_name) AS country_name,
       MIN(btrim(city)) AS city,
       COUNT(*)::bigint AS records,
       MAX(updated_at) AS last_source_write
FROM public.gth_osm_attractions
WHERE is_public=true
  AND is_community_directory=true
  AND country_code IS NOT NULL
  AND city IS NOT NULL
  AND length(btrim(city)) BETWEEN 3 AND 80
  AND btrim(city) !~ '[[:cntrl:]]'
GROUP BY country_code, lower(btrim(city))
HAVING COUNT(*) >= 2;
REVOKE ALL ON public.gth_osm_attraction_city_counts FROM PUBLIC;
GRANT SELECT ON public.gth_osm_attraction_city_counts TO anon,authenticated;
COMMENT ON VIEW public.gth_osm_attraction_city_counts IS
 'ODbL community-mapped counts, only tagged city names and real country codes. Not independently verified city boundaries, attractions, tours, or booking inventory.';
COMMIT;
