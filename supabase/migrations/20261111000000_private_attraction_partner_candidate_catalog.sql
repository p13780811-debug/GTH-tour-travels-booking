-- GTH PRO — private attraction partner candidate catalog.
-- Applied to the connected Supabase project as migration
-- private_attraction_partner_candidate_catalog, 2026-11-11.
-- Source records are NOT a certification of rights, commissions, availability,
-- attraction matches, actual affiliate attribution, or booking handoffs.
-- This migration is deliberately idempotent and does not alter existing public
-- attractions, tours, media, provider ingestion or authentication policies.

CREATE TABLE IF NOT EXISTS public.gth_attraction_supplier_candidates (
  provider text NOT NULL CHECK (provider IN ('getyourguide','wegotrip','nuitee')),
  provider_product_id text NOT NULL CHECK (char_length(provider_product_id) BETWEEN 1 AND 128),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 240),
  city_name text NOT NULL CHECK (char_length(city_name) BETWEEN 2 AND 120),
  country_name text NOT NULL CHECK (char_length(country_name) BETWEEN 2 AND 120),
  source_url text NOT NULL CHECK (source_url ~ '^https://[^[:space:]]+$' AND char_length(source_url) <= 2048),
  affiliate_url text CHECK (affiliate_url IS NULL OR (affiliate_url ~ '^https://[^[:space:]]+$' AND char_length(affiliate_url) <= 2048)),
  evidence_source text NOT NULL CHECK (char_length(evidence_source) BETWEEN 3 AND 240),
  matched_wikidata_qid text REFERENCES public.gth_open_attractions(wikidata_qid) ON DELETE SET NULL,
  approved_by_admin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT false,
  verified_exact_match boolean NOT NULL DEFAULT false,
  booking_handoff_tested boolean NOT NULL DEFAULT false,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_product_id),
  CONSTRAINT candidate_activation_requires_review CHECK (
    NOT is_active OR (approved_by_admin AND verified_exact_match
      AND booking_handoff_tested AND matched_wikidata_qid IS NOT NULL)
  )
);

ALTER TABLE public.gth_attraction_supplier_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gth_attraction_supplier_candidates FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.gth_attraction_supplier_candidates TO service_role;
COMMENT ON TABLE public.gth_attraction_supplier_candidates IS
 'Private source-backed product candidates. No public read/write, no implied attraction match, image-rights clearance, price, bookability or affiliate commission.';

-- Existing owner-supplied GetYourGuide cruise products with real supplier
-- identifiers; do not mark active/approved or claim exact Wikidata matches.
INSERT INTO public.gth_attraction_supplier_candidates
  (provider, provider_product_id, title, city_name, country_name,
   source_url, affiliate_url, evidence_source)
VALUES
  ('getyourguide','1250175','Hooghly River Sunset Cruise with Snacks and Drinks',
   'Kolkata','India',
   'https://www.getyourguide.com/kolkata-l275/kolkata-hooghly-river-sunset-cruise-with-snacks-drinks-t1250175/',
   'https://www.getyourguide.com/kolkata-l275/kolkata-hooghly-river-sunset-cruise-with-snacks-drinks-t1250175/?partner_id=DF3NBKA&utm_medium=online_publisher&cmp=gthpro_cruises_kolkata',
   'Existing GTH PRO featured GYG cruise and owner-provided affiliate URL'),
  ('getyourguide','1142848','Mumbai Private Sailing Yacht Cruise with Snacks',
   'Mumbai','India',
   'https://www.getyourguide.com/mumbai-l201/mumbai-private-sailing-yacht-cruise-with-snacks-t1142848/',
   'https://gyg.me/ZzIrHzQ9',
   'Existing GTH PRO featured cruise and owner-provided GYG short link')
ON CONFLICT (provider, provider_product_id) DO NOTHING;

-- Avoid duplicating the 523 WeGoTrip source products or creating any
-- additional supplier fetches. No public access to this audit view.
CREATE OR REPLACE VIEW public.gth_attraction_partner_catalog_v1
WITH (security_invoker = true) AS
  SELECT 'wegotrip'::text AS provider, w.provider_product_id, w.title,
    w.city_name, w.country_name, w.source_url,
    NULL::text AS affiliate_url,
    'supplier_snapshot_not_booking_verified'::text AS review_state,
    false AS approved_by_admin,
    NULL::text AS matched_wikidata_qid,
    w.last_verified_at AS last_checked_at
  FROM public.tour_supplier_products w
  WHERE w.provider = 'wegotrip' AND w.source_verified = true
    AND w.available = true AND w.source_url LIKE 'https://wegotrip.com/%'
  UNION ALL
  SELECT c.provider, c.provider_product_id, c.title, c.city_name,
    c.country_name, c.source_url, c.affiliate_url,
    'staged_unmatched_not_booking_verified'::text,
    c.approved_by_admin, c.matched_wikidata_qid, c.last_checked_at
  FROM public.gth_attraction_supplier_candidates c;
REVOKE ALL ON public.gth_attraction_partner_catalog_v1 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.gth_attraction_partner_catalog_v1 TO service_role;
COMMENT ON VIEW public.gth_attraction_partner_catalog_v1 IS
 'Private unified supplier-source audit catalog. No public links, no bookings, no image rights assertion, no API calls, and no duplicate WeGoTrip rows.';
