-- PostgreSQL regex repetition bounds cannot exceed 255. The previous {4,1024}
-- expression compiled only on INSERT and blocked every semantic index write.
-- Keep explicit URL size and HTTPS/whitespace checks without a large quantifier.
ALTER TABLE public.gth_semantic_public_records
 DROP CONSTRAINT gth_semantic_public_records_source_url_check;
ALTER TABLE public.gth_semantic_public_records
 ADD CONSTRAINT gth_semantic_public_records_source_url_check
 CHECK (char_length(source_url) BETWEEN 12 AND 1024 AND source_url ~ '^https://[^[:space:]<>]+$');
