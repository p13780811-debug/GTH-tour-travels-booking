-- Read-only listing media inventory. No customer/contact data.
SELECT id, slug, title, image, gallery, hero_image, ingestion_source, source_type
FROM public.properties
WHERE image IS NOT NULL OR hero_image IS NOT NULL OR gallery IS NOT NULL
ORDER BY id;
