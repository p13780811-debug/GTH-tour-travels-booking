-- Source-verification read policy remains intact, but direct Data API
-- embedding table scans and unaudited RPC calls are prohibited.
-- All semantic inference/results now run through the rate-limited, server-only
-- GTH API and the service-authenticated Edge Function.
REVOKE SELECT ON public.gth_semantic_public_records FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gth_semantic_match(extensions.vector,text,text,integer) FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gth_semantic_public_records TO service_role;
GRANT EXECUTE ON FUNCTION public.gth_semantic_match(extensions.vector,text,text,integer) TO service_role;
