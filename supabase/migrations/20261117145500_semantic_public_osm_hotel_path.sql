-- Preserve all existing RLS/public filtering. Widen only canonical path character
-- validation to support a genuine OSM hotel detail path /hotels/stay/osm:node-123.
-- It is not a supplier booking route and is never treated as live inventory.
ALTER TABLE public.gth_semantic_public_records
 DROP CONSTRAINT IF EXISTS gth_semantic_public_records_canonical_path_check;
ALTER TABLE public.gth_semantic_public_records
 ADD CONSTRAINT gth_semantic_public_records_canonical_path_check
 CHECK (canonical_path ~ '^/(real-estate|tender|attractions|stadiums|hotels)/[a-zA-Z0-9/_:-]{1,180}$');
