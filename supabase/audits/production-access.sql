-- Read-only catalog audit. Run using the Supabase SQL editor/admin connection.
-- Does not select customer rows, reveal auth users, or change grants/policies.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '10s';

-- Missing expected tables and disabled RLS are release blockers.
WITH expected(schema_name, table_name) AS (
  VALUES ('public','properties'), ('public','leads'), ('public','bookings'),
    ('public','saved_properties'), ('public','destinations'), ('public','tours'),
    ('public','hotels'), ('storage','objects')
)
SELECT e.schema_name, e.table_name,
  c.oid IS NOT NULL AS table_exists, c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  CASE WHEN c.oid IS NULL THEN 'MISSING: confirm schema'
       WHEN NOT c.relrowsecurity THEN 'BLOCKER: RLS disabled'
       ELSE 'Inspect grants AND every applicable policy' END AS review
FROM expected e
LEFT JOIN pg_namespace n ON n.nspname = e.schema_name
LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = e.table_name AND c.relkind IN ('r','p')
ORDER BY e.schema_name, e.table_name;

-- Policies combine according to permissive/restrictive semantics. Audit ALL
-- storage policies: an unrelated broad policy can permit this bucket too.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE (schemaname = 'public' AND tablename IN
  ('properties','leads','bookings','saved_properties','destinations','tours','hotels'))
  OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, policyname;

-- Effective privileges include inherited/public grants, unlike table_grants.
SELECT n.nspname AS schema_name, c.relname AS table_name, r.rolname AS role_name,
  has_schema_privilege(r.oid, n.oid, 'USAGE') AS schema_usage,
  has_table_privilege(r.oid, c.oid, 'SELECT') AS can_select,
  has_table_privilege(r.oid, c.oid, 'INSERT') AS can_insert,
  has_table_privilege(r.oid, c.oid, 'UPDATE') AS can_update,
  has_table_privilege(r.oid, c.oid, 'DELETE') AS can_delete,
  has_table_privilege(r.oid, c.oid, 'TRUNCATE') AS can_truncate,
  r.rolbypassrls AS bypasses_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN pg_roles r
WHERE c.relkind IN ('r','p') AND r.rolname IN ('anon','authenticated')
  AND ((n.nspname = 'public' AND c.relname IN
    ('properties','leads','bookings','saved_properties','destinations','tours','hotels'))
    OR (n.nspname = 'storage' AND c.relname = 'objects'))
ORDER BY n.nspname, c.relname, r.rolname;

-- Confirm ownership and moderation column names before writing migrations.
SELECT table_schema, table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('properties','leads','bookings','saved_properties')
  AND column_name IN ('id','user_id','owner_id','created_by','property_id','status','is_featured','featured','boost_expiry')
ORDER BY table_name, ordinal_position;

-- Public SECURITY DEFINER functions can bypass table RLS. Inspect functions
-- manually; this report avoids function bodies which may contain secrets.
SELECT n.nspname AS schema_name, p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer, p.proconfig AS function_config,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f'
ORDER BY p.proname, p.oid;

-- Views may expose protected rows unless security_invoker is set and grants
-- are scoped. This is a review report, not a proof of safe authorization.
SELECT n.nspname AS schema_name, c.relname AS view_name, c.reloptions,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
ORDER BY c.relname;
ROLLBACK;
