-- Prepared only; not executed. Review existing schema before applying.
BEGIN;
CREATE TABLE public.saved_properties (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 property_id bigint NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, property_id)
);
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.saved_properties FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_properties TO authenticated;
CREATE POLICY saved_read_own ON public.saved_properties FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY saved_insert_own ON public.saved_properties FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY saved_delete_own ON public.saved_properties FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
COMMIT;
