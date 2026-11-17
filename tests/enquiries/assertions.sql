DO $$ BEGIN
 IF has_table_privilege('anon','public.gth_intelligence_leads','SELECT') OR has_table_privilege('anon','public.gth_intelligence_leads','INSERT') OR has_table_privilege('authenticated','public.gth_intelligence_leads','SELECT') THEN RAISE EXCEPTION 'Private enquiry grant leaked'; END IF;
 IF has_table_privilege('anon','public.gth_semantic_refresh_jobs','SELECT') OR has_function_privilege('anon','public.gth_claim_semantic_refresh(text)','EXECUTE') THEN RAISE EXCEPTION 'Refresh controls leaked'; END IF;
END $$;
SET ROLE service_role;
INSERT INTO public.gth_intelligence_leads(request_id,payload_hash,lead_kind,target_key,currency,full_name,email,services,whatsapp_message)
VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',repeat('a',64),'requirement','requirement:property_research','INR','Disposable test buyer','buyer@example.invalid',ARRAY['property_research'],'Isolated test request');
UPDATE public.gth_intelligence_leads SET status='reviewing',operator_notes='Disposable operator test';
DO $$ BEGIN
 IF (SELECT phone_e164 IS NOT NULL OR contact_preference<>'email' OR status<>'reviewing' FROM public.gth_intelligence_leads LIMIT 1) THEN RAISE EXCEPTION 'Email-only enquiry failed'; END IF;
 BEGIN
  UPDATE public.gth_intelligence_leads SET full_name='Forbidden direct edit';
  RAISE EXCEPTION 'Unexpected contact editing permission';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 IF (SELECT count(*) FROM public.gth_claim_semantic_refresh('tender'))<>1 THEN RAISE EXCEPTION 'Initial claim failed'; END IF;
 IF (SELECT count(*) FROM public.gth_claim_semantic_refresh('tender'))<>0 THEN RAISE EXCEPTION 'Refresh replay allowed'; END IF;
 IF (SELECT count(*) FROM public.gth_claim_semantic_refresh('unknown'))<>0 THEN RAISE EXCEPTION 'Unsupported source claimed'; END IF;
 BEGIN
  INSERT INTO public.gth_intelligence_leads(request_id,payload_hash,lead_kind,target_key,currency,full_name,email,services,whatsapp_message,contact_preference)
  VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',repeat('b',64),'requirement','requirement:group_stay','INR','Disposable test buyer','buyer@example.invalid',ARRAY['group_stay'],'Isolated test request','phone');
  RAISE EXCEPTION 'Phone preference without number accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END $$;
RESET ROLE;
