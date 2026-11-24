-- Identify company-issued public notices without reclassifying existing procurement feeds.
alter table public.tenders
  add column notice_channel text not null default 'procurement_feed'
    check (notice_channel in ('procurement_feed','company'));

create index tenders_public_company_deadline_idx on public.tenders (deadline_at,id)
  where is_public and source_verified and status='published' and notice_channel='company';

-- Manually checked public source references. Store only factual metadata and an original link.
-- The publisher's advertised public cutoff is used as the conservative display deadline.
insert into public.tenders (
  source_name,source_reference,source_url,title,buyer,country_code,region,sector,summary,
  deadline_at,status,source_verified,is_public,notice_channel
)
select 'Tata Power public notices',notice.ref,'https://www.tatapower.com/tender',notice.title,notice.buyer,
  'IN',notice.region,notice.sector,
  'Public company RFQ. Match the reference on the issuer’s tender list and check the latest participation and bid deadlines.',
  notice.closes_at,'published',true,true,'company'
from (values
  ('4100073948','High-tension smart meters for the Mumbai distribution network','Tata Power Company Limited','Mumbai','goods','2026-12-04 09:30:00+05:30'::timestamptz),
  ('4100074074','Three-year maintenance for fire detection and alarms at Mundra','Tata Power Company Limited','Mundra','services','2026-11-28 18:29:00+05:30'::timestamptz),
  ('4100073265','Grinding assembly spares for the Mundra coal mill','Tata Power Company Limited','Mundra','goods','2026-11-28 18:29:00+05:30'::timestamptz),
  ('4100008212','Sodium hydroxide procurement for power generation','Prayagraj Power Generation Company Limited',null,'goods','2026-11-30 18:15:00+05:30'::timestamptz)
) as notice(ref,title,buyer,region,sector,closes_at)
where notice.closes_at > now()
on conflict (source_name,source_reference) do nothing;
