-- All records here are labelled, isolated test fixtures.
INSERT INTO public.tenders VALUES ('11111111-1111-4111-8111-111111111111','Synthetic test notice',true,true,'published',now()+interval '2 days','https://fixture.invalid/notice');
INSERT INTO public.gth_semantic_public_records(sector,source_ref,title,excerpt,country_code,canonical_path,source_url,embedding,source_verified,is_public)
VALUES ('tender','11111111-1111-4111-8111-111111111111','Synthetic test notice','Disposable test excerpt','IN','/tender/11111111-1111-4111-8111-111111111111','https://fixture.invalid/notice', ('[1,'||repeat('0,',382)||'0]')::extensions.vector,true,true);
DO $$ BEGIN
 IF has_table_privilege('anon','public.gth_semantic_public_records','SELECT') OR has_table_privilege('authenticated','public.gth_semantic_public_records','SELECT') THEN RAISE EXCEPTION 'Embedding table leaked'; END IF;
 IF has_function_privilege('anon','public.gth_semantic_match(extensions.vector,text,text,integer)','EXECUTE') OR has_function_privilege('authenticated','public.gth_semantic_match(extensions.vector,text,text,integer)','EXECUTE') THEN RAISE EXCEPTION 'Direct RPC leaked'; END IF;
END $$;
SET ROLE service_role;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.gth_semantic_match(('[1,'||repeat('0,',382)||'0]')::extensions.vector,'IN',NULL,6)) <> 1 THEN RAISE EXCEPTION 'Eligible notice missing'; END IF;
 IF (SELECT count(*) FROM public.gth_semantic_match(('[1,'||repeat('0,',382)||'0]')::extensions.vector,'GB',NULL,6)) <> 0 THEN RAISE EXCEPTION 'Country isolation failed'; END IF;
END $$;
RESET ROLE;
UPDATE public.tenders SET is_public=false;
SET ROLE service_role;
DO $$ BEGIN
 IF EXISTS (SELECT FROM public.gth_semantic_match(('[1,'||repeat('0,',382)||'0]')::extensions.vector,'IN',NULL,6)) THEN RAISE EXCEPTION 'Withdrawn notice leaked through cached vector'; END IF;
END $$;
RESET ROLE;
UPDATE public.tenders SET is_public=true, deadline_at=now()-interval '1 minute';
SET ROLE service_role;
DO $$ BEGIN
 IF EXISTS (SELECT FROM public.gth_semantic_match(('[1,'||repeat('0,',382)||'0]')::extensions.vector,'IN',NULL,6)) THEN RAISE EXCEPTION 'Expired source leaked'; END IF;
END $$;
RESET ROLE;
