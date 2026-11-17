BEGIN;
-- Existing private enquiries gain an operator queue; no public table access.
ALTER TABLE public.gth_intelligence_leads
 ALTER COLUMN phone_e164 DROP NOT NULL,
 ADD COLUMN contact_preference text NOT NULL DEFAULT 'email' CHECK(contact_preference IN ('email','phone')),
 ADD COLUMN requested_city varchar(100) CHECK(requested_city !~ '[<>[:cntrl:]]'),
 ADD COLUMN country_code char(2) CHECK(country_code ~ '^[A-Z]{2}$'),
 ADD COLUMN status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewing','awaiting_supplier','contacted','closed')),
 ADD COLUMN operator_notes varchar(1500) NOT NULL DEFAULT '' CHECK(operator_notes !~ '[<>[:cntrl:]]'),
 ADD COLUMN next_follow_up_at timestamptz,
 ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
 ADD CONSTRAINT gth_enquiry_phone_preference CHECK(contact_preference <> 'phone' OR phone_e164 IS NOT NULL);
ALTER TABLE public.gth_intelligence_leads DROP CONSTRAINT gth_intelligence_leads_email_check;
ALTER TABLE public.gth_intelligence_leads ADD CONSTRAINT gth_intelligence_leads_email_check
 CHECK(email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$');
ALTER TABLE public.gth_intelligence_leads DROP CONSTRAINT gth_intelligence_leads_phone_e164_check;
ALTER TABLE public.gth_intelligence_leads ADD CONSTRAINT gth_intelligence_leads_phone_e164_check
 CHECK(phone_e164 ~ '^[+][1-9][0-9]{7,14}$');
ALTER TABLE public.gth_intelligence_leads DROP CONSTRAINT gth_intelligence_leads_lead_kind_check;
ALTER TABLE public.gth_intelligence_leads ADD CONSTRAINT gth_intelligence_leads_lead_kind_check CHECK(lead_kind IN ('infra','hospitality','requirement'));
ALTER TABLE public.gth_intelligence_leads DROP CONSTRAINT gth_intelligence_leads_target_key_check;
ALTER TABLE public.gth_intelligence_leads ADD CONSTRAINT gth_intelligence_leads_target_key_check
 CHECK(target_key ~ '^(property:[1-9][0-9]*|stadium:[a-z0-9-]+|osm:(node|way|relation)-[1-9][0-9]*|attraction:Q[1-9][0-9]*|requirement:(property_research|tender_support|group_stay))$');
ALTER TABLE public.gth_intelligence_leads DROP CONSTRAINT gth_intelligence_leads_services_check;
ALTER TABLE public.gth_intelligence_leads ADD CONSTRAINT gth_intelligence_leads_services_check
 CHECK(cardinality(services) BETWEEN 1 AND 3 AND services <@ ARRAY['investor_dossier','corporate_hospitality','group_transport','hotel_blocks','property_research','tender_support','group_stay']::text[]);
ALTER TABLE public.gth_intelligence_leads DROP CONSTRAINT gth_intelligence_leads_check;
ALTER TABLE public.gth_intelligence_leads ADD CONSTRAINT gth_intelligence_leads_check CHECK(
 (lead_kind='infra' AND property_id IS NOT NULL AND services=ARRAY['investor_dossier']::text[]) OR
 (lead_kind='hospitality' AND property_id IS NULL AND NOT ('investor_dossier'=ANY(services)) AND services <@ ARRAY['corporate_hospitality','group_transport','hotel_blocks']::text[]) OR
 (lead_kind='requirement' AND property_id IS NULL AND cardinality(services)=1 AND services <@ ARRAY['property_research','tender_support','group_stay']::text[] AND target_key='requirement:'||services[1])
);
CREATE INDEX gth_enquiry_queue_idx ON public.gth_intelligence_leads(status,id DESC);
GRANT UPDATE(status,operator_notes,next_follow_up_at,updated_at) ON public.gth_intelligence_leads TO service_role;
REVOKE ALL ON public.gth_intelligence_leads FROM PUBLIC,anon,authenticated;

-- Two bounded feed cursors, no credentials or source payloads stored here.
CREATE TABLE public.gth_semantic_refresh_jobs(
 sector text PRIMARY KEY CHECK(sector IN ('tender','attraction')),
 next_offset integer NOT NULL DEFAULT 0 CHECK(next_offset BETWEEN 0 AND 996 AND next_offset % 12=0),
 last_attempt_at timestamptz, last_success_at timestamptz, lease_until timestamptz,
 scanned integer NOT NULL DEFAULT 0 CHECK(scanned BETWEEN 0 AND 12),
 saved integer NOT NULL DEFAULT 0 CHECK(saved BETWEEN 0 AND 3),
 last_status text NOT NULL DEFAULT 'pending' CHECK(last_status IN ('pending','running','ok','failed','capacity_reserve'))
);
ALTER TABLE public.gth_semantic_refresh_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gth_semantic_refresh_jobs FROM PUBLIC,anon,authenticated;
GRANT SELECT,UPDATE ON public.gth_semantic_refresh_jobs TO service_role;
INSERT INTO public.gth_semantic_refresh_jobs(sector) VALUES ('tender'),('attraction');
CREATE FUNCTION public.gth_claim_semantic_refresh(p_sector text)
RETURNS TABLE(next_offset integer) LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path='' AS $$
 UPDATE public.gth_semantic_refresh_jobs j SET lease_until=now()+interval '10 minutes',last_attempt_at=now(),last_status='running'
 WHERE j.sector=p_sector AND (j.lease_until IS NULL OR j.lease_until<now())
 AND (j.last_attempt_at IS NULL OR j.last_attempt_at<now()-interval '5 hours')
 AND pg_database_size(current_database())<475000000
 RETURNING j.next_offset;
$$;
REVOKE ALL ON FUNCTION public.gth_claim_semantic_refresh(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gth_claim_semantic_refresh(text) TO service_role;
-- Share the registry's serialized capacity reserve with new embedding writes.
CREATE TRIGGER gth_semantic_capacity BEFORE INSERT OR UPDATE ON public.gth_semantic_public_records
 FOR EACH ROW EXECUTE FUNCTION public.gth_guard_registry_capacity();
NOTIFY pgrst,'reload schema';
COMMIT;

