-- Prepared only. Not applied to the live database.
BEGIN;
CREATE TABLE public.listing_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
 title text NOT NULL CHECK (length(title) BETWEEN 3 AND 180),
 country text NOT NULL CHECK (length(country) BETWEEN 2 AND 80),
 city text NOT NULL CHECK (length(city) BETWEEN 2 AND 80),
 location text NOT NULL CHECK (length(location) BETWEEN 2 AND 250),
 description text NOT NULL CHECK (length(description) BETWEEN 20 AND 5000),
 property_type text NOT NULL CHECK (property_type IN ('Apartment','Villa','Penthouse','Commercial','Plot')),
 listing_type text NOT NULL CHECK (listing_type IN ('buy','rent')),
 status text NOT NULL DEFAULT 'review' CHECK (status IN ('review','approved','rejected')),
 property_id bigint REFERENCES public.properties(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz
);
ALTER TABLE public.listing_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.listing_submissions FROM anon, authenticated;
GRANT SELECT ON public.listing_submissions TO authenticated;
GRANT INSERT (title,country,city,location,description,property_type,listing_type) ON public.listing_submissions TO authenticated;
CREATE POLICY submission_read ON public.listing_submissions FOR SELECT TO authenticated
 USING (owner_id = (SELECT auth.uid()) OR (SELECT auth.jwt()->'app_metadata'->>'role') = 'admin');
CREATE POLICY submission_insert ON public.listing_submissions FOR INSERT TO authenticated
 WITH CHECK (owner_id = (SELECT auth.uid()) AND status = 'review' AND property_id IS NULL AND reviewed_at IS NULL);
CREATE FUNCTION public.review_listing_submission(submission_id uuid, decision text) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item public.listing_submissions; published_id bigint;
BEGIN
 IF auth.uid() IS NULL OR COALESCE(auth.jwt()->'app_metadata'->>'role','') <> 'admin' THEN RAISE EXCEPTION 'Administrator required'; END IF;
 IF decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 SELECT * INTO item FROM public.listing_submissions WHERE id = submission_id FOR UPDATE;
 IF NOT FOUND OR item.status <> 'review' THEN RAISE EXCEPTION 'Submission unavailable'; END IF;
 IF decision = 'approved' THEN
 INSERT INTO public.properties(title,slug,country,city,location,description,property_type,listing_type,status,verified,source_type,ingestion_source)
 VALUES (item.title, 'listing-' || item.id::text, item.country,item.city,item.location,item.description,item.property_type,item.listing_type,'listed',false,'owner','Owner submission') RETURNING id INTO published_id;
 END IF;
 UPDATE public.listing_submissions SET status=decision, property_id=published_id, reviewed_at=now() WHERE id=item.id;
 RETURN published_id;
END; $$;
REVOKE ALL ON FUNCTION public.review_listing_submission(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_listing_submission(uuid,text) TO authenticated;
COMMIT;
