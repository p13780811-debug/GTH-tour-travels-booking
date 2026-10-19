-- Supabase default privileges may pre-grant writes to newly created views.
-- These eligibility views are public read-only endpoints; underlying RLS stays active.
BEGIN;
REVOKE ALL ON public.gth_seo_hotels_v1, public.gth_seo_tours_v1,
 public.gth_seo_destinations_v1, public.gth_seo_attractions_v1,
 public.gth_seo_tenders_v1 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.gth_seo_hotels_v1, public.gth_seo_tours_v1,
 public.gth_seo_destinations_v1, public.gth_seo_attractions_v1,
 public.gth_seo_tenders_v1 TO anon, authenticated;
COMMIT;
