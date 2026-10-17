BEGIN;
CREATE TABLE IF NOT EXISTS public.gth_attraction_affiliate_links (
 wikidata_qid text NOT NULL REFERENCES public.gth_open_attractions(wikidata_qid) ON DELETE CASCADE,
 partner text NOT NULL CHECK(partner IN ('getyourguide','viator')),
 approved_url text NOT NULL CHECK(approved_url ~ '^https://[^[:space:]]+$' AND char_length(approved_url)<=2048),
 provider_product_ref text,
 approved_by_admin boolean NOT NULL DEFAULT false,
 is_active boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(wikidata_qid,partner)
);
ALTER TABLE public.gth_attraction_affiliate_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gth_attraction_affiliate_links FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.gth_attraction_affiliate_links TO anon,authenticated;
DROP POLICY IF EXISTS "Approved links for published attractions" ON public.gth_attraction_affiliate_links;
CREATE POLICY "Approved links for published attractions" ON public.gth_attraction_affiliate_links
 FOR SELECT TO anon,authenticated USING(
 approved_by_admin=true AND is_active=true AND
 EXISTS(SELECT 1 FROM public.gth_open_attractions p WHERE p.wikidata_qid=gth_attraction_affiliate_links.wikidata_qid AND p.is_public=true));
COMMENT ON TABLE public.gth_attraction_affiliate_links IS 'Exact admin-approved provider links only. No invented tracking, tickets or prices.';
COMMIT;
