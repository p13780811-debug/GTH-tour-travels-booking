-- Source-authorised tender refresh (GTH PRO).
-- Invoker privileges ONLY; Supabase service_role invokes after GitHub OIDC
-- verification. Public, anon and authenticated do not have EXECUTE rights.
-- Source deadlines and corrigenda can change; preserve independent review.
create or replace function public.upsert_official_tender_batch(
  p_source text, p_records jsonb
) returns jsonb
language plpgsql security invoker
set search_path = pg_catalog, public
as $$
declare affected_count integer;
begin
  if p_source not in (
    'World Bank','TED EU','UK Find a Tender','UK Contracts Finder',
    'Ukraine Prozorro','CanadaBuys Open Data','Brazil PNCP','US SAM.gov'
  ) or p_records is null or jsonb_typeof(p_records) <> 'array'
    or jsonb_array_length(p_records) > 50 then
    raise exception 'Invalid approved official source batch';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_records) as entry(value)
    where jsonb_typeof(entry.value) <> 'object'
      or entry.value->>'source_name' is distinct from p_source
      or entry.value->>'status' is distinct from 'published'
      or entry.value->>'source_verified' is distinct from 'true'
      or entry.value->>'is_public' is distinct from 'true'
      or entry.value ? 'eligibility_requirements'
      or entry.value ? 'owner_id'
  ) then
    raise exception 'Untrusted fields in procurement batch';
  end if;

  with normalized as (
    select distinct on (x.source_reference)
      x.source_name,x.source_reference,x.source_url,x.title,x.buyer,
      x.country_code,x.region,x.sector,x.summary,x.deadline_at,
      x.published_at,x.estimated_value,x.currency
    from jsonb_to_recordset(p_records) as x (
      source_name text,source_reference text,source_url text,title text,
      buyer text,country_code text,region text,sector text,summary text,
      deadline_at timestamptz,published_at timestamptz,
      estimated_value numeric,currency text
    )
    order by x.source_reference
  ), changes as (
    insert into public.tenders (
      source_name,source_reference,source_url,title,buyer,country_code,
      region,sector,summary,deadline_at,published_at,estimated_value,
      currency,status,source_verified,is_public
    )
    select source_name,source_reference,source_url,title,buyer,country_code,
      region,sector,summary,deadline_at,published_at,estimated_value,
      currency,'published',true,true
    from normalized
    where source_name=p_source
    on conflict (source_name,source_reference) do update
      set source_url=excluded.source_url,
          title=excluded.title,
          buyer=excluded.buyer,
          country_code=excluded.country_code,
          region=excluded.region,
          sector=excluded.sector,
          summary=excluded.summary,
          deadline_at=excluded.deadline_at,
          published_at=excluded.published_at,
          estimated_value=excluded.estimated_value,
          currency=excluded.currency,
          updated_at=now()
    where public.tenders.status='published'
      and public.tenders.source_verified=true
      and public.tenders.is_public=true
      and (
        public.tenders.source_url,public.tenders.title,public.tenders.buyer,
        public.tenders.country_code,public.tenders.region,public.tenders.sector,
        public.tenders.summary,public.tenders.deadline_at,public.tenders.published_at,
        public.tenders.estimated_value,public.tenders.currency
      ) is distinct from (
        excluded.source_url,excluded.title,excluded.buyer,
        excluded.country_code,excluded.region,excluded.sector,
        excluded.summary,excluded.deadline_at,excluded.published_at,
        excluded.estimated_value,excluded.currency
      )
    returning id
  )
  select count(*) into affected_count from changes;

  return jsonb_build_object('applied_changes',affected_count);
end;
$$;

revoke all on function public.upsert_official_tender_batch(text,jsonb)
  from public, anon, authenticated;
grant execute on function public.upsert_official_tender_batch(text,jsonb)
  to service_role;

comment on function public.upsert_official_tender_batch(text,jsonb) is
  'Only GitHub OIDC authenticated service-role ingestion may update public source facts. Preserves requirements_verified, eligibility_requirements and manual review states. Unchanged records are not rewritten.';
