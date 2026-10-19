-- Read-only, SECURITY INVOKER SEO eligibility views. Underlying table RLS remains authoritative.
-- Do not grant access to unreviewed directory records, tickets, owner data or draft listings.
BEGIN;
CREATE OR REPLACE VIEW public.gth_seo_hotels_v1 WITH (security_invoker=true) AS
 SELECT id,name,city,country_code,category,source_name,source_url,affiliate_link,created_at
 FROM public.hotels
 WHERE is_public IS TRUE AND media_rights_verified IS TRUE
   AND length(btrim(coalesce(name,'')))>=5 AND length(btrim(coalesce(city,'')))>=2
   AND source_name IS NOT NULL AND source_name<>'OpenStreetMap'
   AND source_url ~* '^https://[^ /?#]+'
   AND (source_name='GTH PRO Reviewed Hotel Partner' OR affiliate_link ~* '^https://[^ /?#]+');

CREATE OR REPLACE VIEW public.gth_seo_tours_v1 WITH (security_invoker=true) AS
 SELECT id,title,city,city_slug,country,provider,source_name,source_url,affiliate_link,image_url
 FROM public.tours
 WHERE is_public IS TRUE AND media_rights_verified IS TRUE
   AND length(btrim(coalesce(title,'')))>=12 AND length(btrim(coalesce(city,'')))>=2
   AND length(btrim(coalesce(provider,'')))>=2
   AND source_name IS NOT NULL AND source_url ~* '^https://[^ /?#]+'
   AND affiliate_link ~* '^https://[^ /?#]+';

CREATE OR REPLACE VIEW public.gth_seo_destinations_v1 WITH (security_invoker=true) AS
 SELECT slug,name,country,description,seo_title,seo_description,source_name,source_url,image_url,created_at
 FROM public.destinations
 WHERE is_active IS TRUE AND media_rights_verified IS TRUE
   AND source_name IS NOT NULL AND source_url ~* '^https://[^ /?#]+'
   AND length(btrim(coalesce(name,'')))>=3
   AND length(btrim(coalesce(description,'')))>=100
   AND slug ~ '^[a-z]+(-[a-z]+)*$' AND length(slug)<=80;

CREATE OR REPLACE VIEW public.gth_seo_attractions_v1 WITH (security_invoker=true) AS
 SELECT wikidata_qid,name,description,region_slug,country_code,category,latitude,longitude,
        wikidata_url,source_license,image_url,commons_page,image_author,image_license,image_license_url,updated_at
 FROM public.gth_open_attractions
 WHERE is_public IS TRUE AND source_license='CC0-1.0'
   AND length(btrim(coalesce(name,'')))>=3 AND length(btrim(coalesce(description,'')))>=90
   AND wikidata_qid ~ '^Q[1-9][0-9]{0,14}$'
   AND wikidata_url='https://www.wikidata.org/wiki/'||wikidata_qid;

CREATE OR REPLACE VIEW public.gth_seo_tenders_v1 WITH (security_invoker=true) AS
 SELECT id,title,buyer,country_code,sector,summary,deadline_at,source_name,source_reference,source_url,updated_at
 FROM public.tenders
 WHERE is_public IS TRUE AND source_verified IS TRUE AND status='published'
   AND deadline_at>now() AND length(btrim(coalesce(summary,'')))>=90
   AND length(btrim(coalesce(title,'')))>=12 AND length(btrim(coalesce(buyer,'')))>=3
   AND length(btrim(coalesce(source_reference,'')))>=3
   AND source_url ~* '^https://[^ /?#]+';

REVOKE ALL ON public.gth_seo_hotels_v1, public.gth_seo_tours_v1,
 public.gth_seo_destinations_v1, public.gth_seo_attractions_v1, public.gth_seo_tenders_v1 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.gth_seo_hotels_v1, public.gth_seo_tours_v1,
 public.gth_seo_destinations_v1, public.gth_seo_attractions_v1, public.gth_seo_tenders_v1 TO anon,authenticated;
COMMIT;
