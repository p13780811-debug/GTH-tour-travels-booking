-- Expand the existing traffic report system without modifying the destinations catalog.
alter table public.mobility_traffic_zones drop constraint mobility_traffic_zones_city_check;
alter table public.mobility_traffic_zones add constraint mobility_traffic_zones_city_check
  check(city in ('mumbai','kolkata') or (length(city)<=142 and city ~ '^d:[a-z0-9]+(-[a-z0-9]+)*$'));

create function public.mobility_traffic_city_active(p_city text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select coalesce(p_city in ('mumbai','kolkata') or (
    length(p_city)<=142 and p_city ~ '^d:[a-z0-9]+(-[a-z0-9]+)*$'
    and (substring(p_city,3) in ('delhi','bengaluru','dubai','london','new-york') or exists (
      select 1 from public.destinations d where d.slug=substring(p_city,3) and d.is_active is true
        and not (lower(d.name) in ('mumbai','kolkata') and (coalesce(d.country_code,'')='IN'
          or (d.country_code is null and coalesce(lower(d.country),'india')='india' and d.slug in ('mumbai','mumbai-in','kolkata','kolkata-in'))))
    ))
  ),false);
$$;
revoke all on function public.mobility_traffic_city_active(text) from public, anon, authenticated;

create or replace function public.mobility_traffic_feed(p_city text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'zones', coalesce((
      select jsonb_agg(jsonb_build_object('id', z.zone, 'label', z.label, 'localLabel', z.local_label) order by z.label)
      from public.mobility_traffic_zones z where z.city=p_city
    ), case when left(p_city,2)='d:' then
      jsonb_build_array(jsonb_build_object('id','citywide','label','Citywide','localLabel','Citywide'))
      else '[]'::jsonb end),
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
  ) where public.mobility_traffic_city_active(p_city);
$$;

create or replace function public.mobility_submit_traffic_report(p_city text,p_zone text,p_kind text)
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
  if not public.mobility_traffic_city_active(p_city) or p_kind is null
    or p_kind not in ('jam','closure','hazard','clear')
    or (left(p_city,2)='d:' and p_zone is distinct from 'citywide')
    or (left(p_city,2)<>'d:' and not exists (
      select 1 from public.mobility_traffic_zones z where z.city=p_city and z.zone=p_zone
    )) then
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
  if left(p_city,2)='d:' then
    insert into public.mobility_traffic_zones(city,zone,label,local_label)
      values(p_city,'citywide','Citywide','Citywide') on conflict(city,zone) do nothing;
  end if;
  insert into public.mobility_traffic_reports(reporter,city,zone,kind,expires_at)
    values (actor,p_city,p_zone,p_kind,now()+interval '90 minutes') returning id into new_id;
  return new_id;
end;
$$;


-- One shared daily allowance for public Overpass, even across serverless instances.
create table public.mobility_map_budget (
  id boolean primary key default true check(id),
  day date not null,
  used integer not null check(used between 0 and 120)
);
alter table public.mobility_map_budget enable row level security;
revoke all on public.mobility_map_budget from public, anon, authenticated;
create function public.mobility_reserve_map_read()
returns boolean language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'UTC')::date;
begin
  insert into public.mobility_map_budget as budget(id,day,used) values(true,today,1)
  on conflict(id) do update set day=today,used=case when budget.day=today then budget.used+1 else 1 end
    where budget.day<>today or budget.used<120;
  return found;
end;
$$;
revoke all on function public.mobility_reserve_map_read() from public, anon, authenticated;
grant execute on function public.mobility_reserve_map_read() to service_role;

create view public.gth_seo_mobility_v1 with (security_invoker=true) as
select slug,name,country,country_code from public.destinations
where is_active is true and length(slug)<=140 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  and length(trim(name)) between 1 and 120
  and slug not in ('mumbai','kolkata','delhi','bengaluru','dubai','london','new-york');
revoke all on public.gth_seo_mobility_v1 from public, anon, authenticated;
grant select on public.gth_seo_mobility_v1 to anon, authenticated;


create function public.mobility_withdraw_traffic_report(p_id uuid,p_city text)
returns boolean language sql security definer set search_path = '' as $$
  with changed as (
    update public.mobility_traffic_reports set withdrawn_at=now()
    where id=p_id and city=p_city and reporter=auth.uid() and withdrawn_at is null and expires_at>now()
    returning id
  ) select exists(select 1 from changed);
$$;
revoke all on function public.mobility_withdraw_traffic_report(uuid,text) from public, anon, authenticated;
grant execute on function public.mobility_withdraw_traffic_report(uuid,text) to authenticated;
