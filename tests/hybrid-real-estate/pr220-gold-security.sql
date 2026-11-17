-- Verify additive gold flags and NRI private table after applying migrations in disposable PG17.
reset role;
do $$
begin
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='properties' and column_name='is_featured_gold') then raise exception 'MISSING_PROJECT_GOLD';end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='property_inventory' and column_name='is_featured_gold') then raise exception 'MISSING_INVENTORY_GOLD';end if;
 if not exists(select 1 from pg_class where oid='public.property_nri_inquiries'::regclass and relrowsecurity) then raise exception 'NRI_RLS_DISABLED';end if;
 if has_table_privilege('anon','public.property_nri_inquiries','SELECT')
 or has_table_privilege('authenticated','public.property_nri_inquiries','INSERT')
 or has_table_privilege('authenticated','public.property_nri_inquiries','UPDATE')
 then raise exception 'NRI_PRIVATE_GRANT_LEAK';end if;
 if not has_table_privilege('service_role','public.property_nri_inquiries','INSERT') then raise exception 'NRI_SERVICE_GRANT_MISSING';end if;
 if not exists(select 1 from pg_indexes where schemaname='public' and tablename='properties' and indexname='properties_featured_gold_idx') then raise exception 'FEATURED_PROJECT_INDEX_MISSING';end if;
 if not exists(select 1 from pg_indexes where schemaname='public' and tablename='property_nri_inquiries' and indexname='property_nri_inquiries_request_id_key') then raise exception 'NRI_IDEMPOTENCY_INDEX_MISSING';end if;
 if has_column_privilege('authenticated','public.properties','is_featured_gold','UPDATE')
 or has_column_privilege('authenticated','public.property_inventory','is_featured_gold','UPDATE')
 then raise exception 'UNVERIFIED_GOLD_ESCALATION';end if;
end $$;
set role anon;
do $$begin
 if exists(select 1 from public.properties where is_featured_gold) then raise exception 'GOLD_AUTO_GRANTED';end if;
end $$;
reset role;
