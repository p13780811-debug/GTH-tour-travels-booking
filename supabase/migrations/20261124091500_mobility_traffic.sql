-- Public traffic data is projected by RPC. Accounts remain private.
create table public.mobility_traffic_zones (
  city text not null check (city in ('mumbai','kolkata')),
  zone text not null check (zone ~ '^[a-z0-9-]{2,40}$'),
  label text not null,
  local_label text not null,
  primary key (city, zone)
);

create table public.mobility_traffic_reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references auth.users(id) on delete cascade,
  city text not null,
  zone text not null,
  kind text not null check (kind in ('jam','closure','hazard','clear')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  withdrawn_at timestamptz,
  foreign key (city, zone) references public.mobility_traffic_zones(city, zone)
);

create index mobility_traffic_city_recent on public.mobility_traffic_reports(city,created_at desc) where withdrawn_at is null;
create index mobility_traffic_reporter_recent on public.mobility_traffic_reports(reporter,created_at desc);
create index mobility_traffic_recent on public.mobility_traffic_reports(created_at);
create index mobility_traffic_expiry on public.mobility_traffic_reports(expires_at);

alter table public.mobility_traffic_zones enable row level security;
alter table public.mobility_traffic_reports enable row level security;
revoke all on public.mobility_traffic_zones, public.mobility_traffic_reports from public, anon, authenticated;

insert into public.mobility_traffic_zones(city,zone,label,local_label) values
  ('mumbai','western-express','Western Express Highway','पश्चिम द्रुतगती महामार्ग'),
  ('mumbai','eastern-express','Eastern Express Highway','पूर्व द्रुतगती महामार्ग'),
  ('mumbai','andheri-airport','Andheri / Airport approach','अंधेरी / विमानतळ मार्ग'),
  ('mumbai','bkc','Bandra Kurla Complex','वांद्रे कुर्ला संकुल'),
  ('mumbai','dadar','Dadar','दादर'),
  ('mumbai','eastern-freeway','Eastern Freeway','पूर्व मुक्त मार्ग'),
  ('mumbai','atal-setu','Atal Setu approach','अटल सेतू मार्ग'),
  ('mumbai','thane-entry','Thane / Mulund entry','ठाणे / मुलुंड प्रवेश'),
  ('kolkata','em-bypass','EM Bypass','ইএম বাইপাস'),
  ('kolkata','vip-road','VIP Road / Airport approach','ভিআইপি রোড / বিমানবন্দর'),
  ('kolkata','sealdah','Sealdah','শিয়ালদহ'),
  ('kolkata','esplanade','Esplanade','এসপ্ল্যানেড'),
  ('kolkata','science-city','Science City junction','সায়েন্স সিটি মোড়'),
  ('kolkata','howrah-bridge','Howrah Bridge approach','হাওড়া ব্রিজের প্রবেশপথ'),
  ('kolkata','maa-flyover','Maa Flyover','মা উড়ালপুল'),
  ('kolkata','park-circus','Park Circus','পার্ক সার্কাস');

create function public.mobility_traffic_feed(p_city text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'zones', coalesce((
      select jsonb_agg(jsonb_build_object('id', z.zone, 'label', z.label, 'localLabel', z.local_label) order by z.label)
      from public.mobility_traffic_zones z where z.city=p_city
    ), '[]'::jsonb),
    'reports', coalesce((
      select jsonb_agg(jsonb_build_object('id', q.id,'zone',q.zone,'kind',q.kind,
        'createdAt',q.created_at,'expiresAt',q.expires_at) order by q.created_at desc,q.id)
      from (
        select r.id,r.zone,r.kind,r.created_at,r.expires_at
        from public.mobility_traffic_reports r
        where r.city=p_city and r.expires_at>now() and r.withdrawn_at is null
        order by r.created_at desc,r.id limit 80
      ) q
    ), '[]'::jsonb)
  );
$$;

create function public.mobility_submit_traffic_report(p_city text,p_zone text,p_kind text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  new_id uuid;
begin
  if actor is null or not exists (
    select 1 from auth.users u where u.id=actor and u.is_anonymous is not true
      and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null)
  ) then
    raise exception using errcode='42501',message='Confirmed account required';
  end if;
  if p_kind is null or p_kind not in ('jam','closure','hazard','clear')
    or not exists (select 1 from public.mobility_traffic_zones z where z.city=p_city and z.zone=p_zone) then
    raise exception using errcode='22023',message='Invalid traffic report';
  end if;
  if not pg_try_advisory_xact_lock(hashtextextended('gth-mobility-traffic-write',0)) then
    raise exception using errcode='PT429',message='Traffic report limit reached';
  end if;
  if (select count(*) from public.mobility_traffic_reports where created_at>now()-interval '1 minute')>=30
    or (select count(*) from public.mobility_traffic_reports where reporter=actor and created_at>now()-interval '24 hours')>=6
    or exists(select 1 from public.mobility_traffic_reports where reporter=actor and created_at>now()-interval '2 minutes')
    or exists(select 1 from public.mobility_traffic_reports where reporter=actor and city=p_city and zone=p_zone
      and kind=p_kind and expires_at>now() and withdrawn_at is null) then
    raise exception using errcode='PT429',message='Traffic report limit reached';
  end if;
  -- Clean a bounded batch on accepted writes without adding a scheduler.
  delete from public.mobility_traffic_reports where id in (
    select id from public.mobility_traffic_reports where expires_at<now()-interval '24 hours'
    order by expires_at limit 100
  );
  insert into public.mobility_traffic_reports(reporter,city,zone,kind,expires_at)
    values (actor,p_city,p_zone,p_kind,now()+interval '90 minutes') returning id into new_id;
  return new_id;
end;
$$;

create function public.mobility_withdraw_traffic_report(p_id uuid)
returns boolean language sql security definer set search_path = '' as $$
  with changed as (
    update public.mobility_traffic_reports set withdrawn_at=now()
    where id=p_id and reporter=auth.uid() and withdrawn_at is null and expires_at>now()
    returning id
  ) select exists(select 1 from changed);
$$;

revoke all on function public.mobility_traffic_feed(text) from public, anon, authenticated;
revoke all on function public.mobility_submit_traffic_report(text,text,text) from public, anon, authenticated;
revoke all on function public.mobility_withdraw_traffic_report(uuid) from public, anon, authenticated;
grant execute on function public.mobility_traffic_feed(text) to anon, authenticated;
grant execute on function public.mobility_submit_traffic_report(text,text,text) to authenticated;
grant execute on function public.mobility_withdraw_traffic_report(uuid) to authenticated;
