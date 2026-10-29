-- Additive workspace. Existing registry, media rights and publication gates stay authoritative.
begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
create schema if not exists estate_workspace_private;
revoke all on schema estate_workspace_private from public,anon,authenticated;
create table public.property_price_events(
 id uuid primary key default gen_random_uuid(),inventory_id uuid not null references public.property_inventory(id) on delete cascade,
 project_id bigint not null references public.properties(id) on delete cascade,
 amount numeric(14,2) not null check(amount>0),previous_amount numeric(14,2),currency text not null check(currency~'^[A-Z]{3}$'),
 event_type text not null check(event_type in ('published','price_changed')),listing_type text not null check(listing_type in ('buy','rent')),
 property_type text,area_sqft numeric,area_basis text,city text,country text,recorded_at timestamptz not null default now()
);
create index estate_prices_unit_time on public.property_price_events(inventory_id,recorded_at desc);
create index estate_prices_locality on public.property_price_events(country,city,currency,recorded_at desc);
alter table public.property_price_events enable row level security;
revoke all on public.property_price_events from anon,authenticated;
grant select on public.property_price_events to anon,authenticated;
create policy estate_public_prices on public.property_price_events for select to anon,authenticated using (
 exists(select 1 from public.property_inventory i join public.properties p on p.id=i.project_id where i.id=inventory_id and i.status='published' and coalesce(p.status,'')<>'archived'
 and exists(select 1 from public.property_published_media m where m.project_id=p.id and m.media_type='photo')));
create table public.property_search_alerts(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 100),country text not null check(length(country) between 1 and 80),city text check(length(city)<=80),
 currency text not null check(currency in ('INR','AED','USD','GBP','EUR','SGD')),listing_type text not null check(listing_type in ('buy','rent')),
 event_type text not null check(event_type in ('all','price_drop','new_listing')),min_price numeric check(min_price>0),max_price numeric check(max_price>0),
 property_type text check(length(property_type)<=80),min_bedrooms smallint check(min_bedrooms between 0 and 20),
 inventory_id uuid references public.property_inventory(id) on delete cascade,active boolean not null default true,created_at timestamptz not null default now(),
 check(min_price is null or max_price is null or min_price<=max_price)
);
create index estate_alerts_owner on public.property_search_alerts(owner_id);
create index estate_alerts_match on public.property_search_alerts(country,city,currency) where active;
create table public.property_notifications(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 price_event_id uuid references public.property_price_events(id) on delete cascade,
 title text not null check(length(title)<=200),href text not null check(href like '/real-estate/%' and length(href)<=400),
 created_at timestamptz not null default now(),read_at timestamptz,unique(owner_id,price_event_id)
);
create index estate_inbox_owner on public.property_notifications(owner_id,created_at desc);
create table public.property_offers(
 id uuid primary key default gen_random_uuid(),inventory_id uuid not null references public.property_inventory(id) on delete cascade,
 project_id bigint not null references public.properties(id) on delete cascade,project_title text not null,project_slug text not null,
 buyer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,seller_id uuid not null references auth.users(id) on delete cascade,
 amount numeric(14,2) not null check(amount>0),currency text not null check(currency~'^[A-Z]{3}$'),message text not null check(length(message) between 10 and 2000),
 status text not null default 'submitted' check(status in ('submitted','under_review','countered','discussion_agreed','withdrawn','declined')),
 counter_amount numeric(14,2) check(counter_amount>0),version integer not null default 1 check(version>0),expires_at timestamptz not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(buyer_id<>seller_id)
);
create index estate_offers_buyer on public.property_offers(buyer_id,created_at desc);
create index estate_offers_seller on public.property_offers(seller_id,created_at desc);
create table public.property_offer_messages(
 id uuid primary key default gen_random_uuid(),offer_id uuid not null references public.property_offers(id) on delete cascade,
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,body text not null check(length(body) between 1 and 2000),created_at timestamptz not null default now()
);
create index estate_messages_offer on public.property_offer_messages(offer_id,created_at);
create index estate_messages_author on public.property_offer_messages(author_id,created_at desc);
create table public.property_saved_items(
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,project_id bigint not null references public.properties(id) on delete cascade,
 created_at timestamptz not null default now(),primary key(owner_id,project_id)
);
create table public.property_service_requests(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 project_id bigint references public.properties(id) on delete set null,kind text not null check(kind in ('valuation','legal','moving','interiors','crm_feed','virtual_tour','translation','registry','open_house','loan_consultation')),
 brief text not null check(length(brief) between 20 and 3000),status text not null default 'submitted' check(status in ('submitted','reviewing','information_needed','completed','declined')),
 response text check(length(response)<=3000),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index estate_service_owner on public.property_service_requests(owner_id,created_at desc);
create table public.property_crm_tasks(
 id uuid primary key default gen_random_uuid(),lead_id bigint not null references public.property_leads(id) on delete cascade,
 created_by uuid not null default auth.uid() references auth.users(id),note text not null check(length(note) between 1 and 2000),due_at timestamptz,
 status text not null default 'open' check(status in ('open','done')),created_at timestamptz not null default now()
);
create index estate_crm_lead on public.property_crm_tasks(lead_id);
create index estate_crm_due on public.property_crm_tasks(status,due_at);
create table public.property_market_reports(
 id uuid primary key default gen_random_uuid(),project_id bigint not null references public.properties(id) on delete cascade,
 kind text not null check(kind in ('valuation','transaction','virtual_tour','floor_plan')),title text not null check(length(title) between 3 and 180),
 source_url text not null check(source_url~'^https://' and length(source_url)<=2048),provider_name text not null check(length(provider_name) between 2 and 150),
 credential_reference text not null check(length(credential_reference) between 3 and 500),observed_on date not null check(observed_on<=current_date),expires_on date,
 amount numeric(14,2) check(amount>0),currency text not null check(currency~'^[A-Z]{3}$'),area_sqft numeric check(area_sqft>0),
 area_basis text check(area_basis in ('carpet','built_up','plot')),property_type text,
 rights_verified boolean not null default false,status text not null default 'approved' check(status in ('approved','rejected')),
 reviewed_by uuid not null default auth.uid() references auth.users(id),reviewed_at timestamptz not null default now(),
 check(kind not in ('valuation','transaction') or amount is not null),check(kind<>'transaction' or property_type in ('Apartment','Villa','Penthouse','Commercial','Plot')),
 check(expires_on is null or expires_on>=observed_on),unique(project_id,kind,source_url,observed_on)
);
create index estate_reports_project on public.property_market_reports(project_id,observed_on desc);
create table public.property_resident_reviews(
 id uuid primary key default gen_random_uuid(),project_id bigint not null references public.properties(id) on delete cascade,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,display_name text not null check(length(display_name) between 2 and 80),
 rating smallint not null check(rating between 1 and 5),review_text text not null check(length(review_text) between 30 and 2000),
 residency_reference text not null check(length(residency_reference) between 5 and 500),status text not null default 'pending' check(status in ('pending','approved','rejected')),
 residency_verified boolean not null default false,reviewed_by uuid references auth.users(id),reviewed_at timestamptz,created_at timestamptz not null default now(),
 unique(owner_id,project_id),check(status<>'approved' or (residency_verified and reviewed_by is not null and reviewed_by<>owner_id and reviewed_at is not null))
);
create index estate_reviews_project on public.property_resident_reviews(project_id,status);
create table public.property_review_publications(
 id uuid primary key references public.property_resident_reviews(id) on delete cascade,project_id bigint not null references public.properties(id) on delete cascade,
 display_name text not null,rating smallint not null,review_text text not null,published_at timestamptz not null
);
create index estate_published_reviews_project on public.property_review_publications(project_id,published_at desc);
create table public.property_listing_events(
 id uuid primary key,inventory_id uuid not null references public.property_inventory(id) on delete cascade,event_kind text not null check(event_kind='view'),created_at timestamptz not null default now()
);
create index estate_listing_event_unit on public.property_listing_events(inventory_id,created_at desc);
revoke all on public.property_listing_events from anon,authenticated;
grant insert,select on public.property_listing_events to service_role;
alter table public.property_listing_events enable row level security;
alter table public.property_search_alerts enable row level security;
revoke all on public.property_search_alerts from anon,authenticated;
alter table public.property_notifications enable row level security;
revoke all on public.property_notifications from anon,authenticated;
alter table public.property_offers enable row level security;
revoke all on public.property_offers from anon,authenticated;
alter table public.property_offer_messages enable row level security;
revoke all on public.property_offer_messages from anon,authenticated;
alter table public.property_saved_items enable row level security;
revoke all on public.property_saved_items from anon,authenticated;
alter table public.property_service_requests enable row level security;
revoke all on public.property_service_requests from anon,authenticated;
alter table public.property_crm_tasks enable row level security;
revoke all on public.property_crm_tasks from anon,authenticated;
alter table public.property_market_reports enable row level security;
revoke all on public.property_market_reports from anon,authenticated;
alter table public.property_resident_reviews enable row level security;
revoke all on public.property_resident_reviews from anon,authenticated;
alter table public.property_review_publications enable row level security;
revoke all on public.property_review_publications from anon,authenticated;
grant select,insert,delete on public.property_search_alerts to authenticated;
create policy estate_own_read on public.property_search_alerts for select to authenticated using(owner_id=(select auth.uid()));
create policy estate_own_insert on public.property_search_alerts for insert to authenticated with check(owner_id=(select auth.uid()));
create policy estate_own_delete on public.property_search_alerts for delete to authenticated using(owner_id=(select auth.uid()));
grant select,insert,delete on public.property_saved_items to authenticated;
create policy estate_own_read on public.property_saved_items for select to authenticated using(owner_id=(select auth.uid()));
create policy estate_own_insert on public.property_saved_items for insert to authenticated with check(owner_id=(select auth.uid()));
create policy estate_own_delete on public.property_saved_items for delete to authenticated using(owner_id=(select auth.uid()));
grant update(active) on public.property_search_alerts to authenticated;
create policy estate_own_update on public.property_search_alerts for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
grant select,delete on public.property_notifications to authenticated;
grant update(read_at) on public.property_notifications to authenticated;
create policy estate_own_read on public.property_notifications for select to authenticated using(owner_id=(select auth.uid()));
create policy estate_own_read_state on public.property_notifications for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy estate_own_delete on public.property_notifications for delete to authenticated using(owner_id=(select auth.uid()));
grant select on public.property_offers to authenticated;
grant insert(inventory_id,amount,currency,message,expires_at) on public.property_offers to authenticated;
grant update(status,counter_amount,version) on public.property_offers to authenticated;
create policy estate_party_read on public.property_offers for select to authenticated using((select auth.uid()) in (buyer_id,seller_id));
create policy estate_buyer_insert on public.property_offers for insert to authenticated with check(buyer_id=(select auth.uid()) and seller_id<>(select auth.uid()));
create policy estate_party_update on public.property_offers for update to authenticated using((select auth.uid()) in (buyer_id,seller_id)) with check((select auth.uid()) in (buyer_id,seller_id));
grant select on public.property_offer_messages to authenticated;
grant insert(offer_id,body) on public.property_offer_messages to authenticated;
create policy estate_message_read on public.property_offer_messages for select to authenticated using(exists(select 1 from public.property_offers o where o.id=offer_id and (select auth.uid()) in (o.buyer_id,o.seller_id)));
create policy estate_message_send on public.property_offer_messages for insert to authenticated with check(author_id=(select auth.uid()) and exists(select 1 from public.property_offers o where o.id=offer_id and (select auth.uid()) in (o.buyer_id,o.seller_id) and o.expires_at>now() and o.status not in ('withdrawn','declined')));
grant select on public.property_service_requests to authenticated;
grant insert(project_id,kind,brief) on public.property_service_requests to authenticated;
grant update(status,response) on public.property_service_requests to authenticated;
create policy estate_service_read on public.property_service_requests for select to authenticated using(owner_id=(select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy estate_service_insert on public.property_service_requests for insert to authenticated with check(owner_id=(select auth.uid()));
create policy estate_service_admin on public.property_service_requests for update to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
grant select on public.property_resident_reviews to authenticated;
grant insert(project_id,display_name,rating,review_text,residency_reference) on public.property_resident_reviews to authenticated;
grant update(status,residency_verified,reviewed_by,reviewed_at) on public.property_resident_reviews to authenticated;
create policy estate_review_read on public.property_resident_reviews for select to authenticated using(owner_id=(select auth.uid()) or (select auth.jwt()->'app_metadata'->>'role')='admin');
create policy estate_review_insert on public.property_resident_reviews for insert to authenticated with check(owner_id=(select auth.uid()) and status='pending' and not residency_verified and reviewed_by is null);
create policy estate_review_admin on public.property_resident_reviews for update to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin' and reviewed_by=(select auth.uid()));
grant select on public.property_review_publications to anon,authenticated;
create policy estate_published_reviews on public.property_review_publications for select to anon,authenticated using(exists(select 1 from public.properties p where p.id=project_id and coalesce(p.status,'')<>'archived'));
grant select,insert,update on public.property_market_reports,public.property_crm_tasks to authenticated;
create policy estate_report_admin on public.property_market_reports for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin' and reviewed_by=(select auth.uid()));
create policy estate_crm_admin on public.property_crm_tasks for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin' and created_by=(select auth.uid()));
grant select on public.property_market_reports to anon;
create policy estate_public_reports on public.property_market_reports for select to anon,authenticated using(status='approved' and rights_verified and reviewed_at is not null and (expires_on is null or expires_on>=current_date) and exists(select 1 from public.properties p where p.id=project_id and coalesce(p.status,'')<>'archived'));
grant update(status) on public.property_leads to authenticated;
create policy estate_admin_lead_stage on public.property_leads for update to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
-- All privileged trigger functions remain in an unexposed schema with no client execution grants.
create function estate_workspace_private.offer_guard() returns trigger language plpgsql security invoker set search_path='' as $$
declare u public.property_inventory; p public.properties;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 if tg_op='INSERT' then
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,71));
  if (select count(*) from public.property_offers where buyer_id=auth.uid() and created_at>now()-interval '1 day')>=20 then raise exception 'Daily offer limit';end if;
  select owner_id,project_id,currency into u.owner_id,u.project_id,u.currency from public.property_inventory where id=new.inventory_id and status='published';
  if not found or u.owner_id is null or u.owner_id=auth.uid() or u.currency<>new.currency then raise exception 'Listing unavailable for this offer';end if;
  select id,title,slug into p.id,p.title,p.slug from public.properties where id=u.project_id and coalesce(status,'')<>'archived' and slug is not null;
  if not found or not exists(select 1 from public.property_published_media m where m.project_id=p.id and m.media_type='photo') then raise exception 'Approved listing photos required';end if;
  if new.expires_at<=now() or new.expires_at>now()+interval '31 days' then raise exception 'Invalid offer expiry';end if;
  new.buyer_id:=auth.uid();new.seller_id:=u.owner_id;new.project_id:=p.id;new.project_title:=p.title;new.project_slug:=p.slug;new.status:='submitted';new.counter_amount:=null;new.version:=1;
 else
  if old.expires_at<=now() or old.status in ('withdrawn','declined','discussion_agreed') or new.version<>old.version+1 then raise exception 'Offer changed or expired';end if;
  if auth.uid()=old.buyer_id then
   if new.status not in ('withdrawn','discussion_agreed') or (new.status='discussion_agreed' and old.status<>'countered') or new.counter_amount is distinct from old.counter_amount then raise exception 'Invalid buyer action';end if;
  elsif auth.uid()=old.seller_id then
   if new.status not in ('under_review','declined','countered','discussion_agreed') or (new.status='discussion_agreed' and old.status='countered') or (new.status='countered' and new.counter_amount is null) or (new.status<>'countered' and new.counter_amount is distinct from old.counter_amount) then raise exception 'Invalid seller action';end if;
  else raise exception 'Offer access denied';end if;
 end if;
 new.updated_at:=now();return new;
end;$$;
create trigger estate_offer_guard before insert or update on public.property_offers for each row execute function estate_workspace_private.offer_guard();
create function estate_workspace_private.bounded_write() returns trigger language plpgsql security invoker set search_path='' as $$
declare n bigint;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,72));
 if tg_table_name='property_search_alerts' then select count(*) into n from public.property_search_alerts where owner_id=auth.uid();if n>=20 then raise exception 'Twenty alert limit';end if;
 elsif tg_table_name='property_saved_items' then select count(*) into n from public.property_saved_items where owner_id=auth.uid();if n>=100 then raise exception 'One hundred saved project limit';end if;
 elsif tg_table_name='property_offer_messages' then select count(*) into n from public.property_offer_messages where author_id=auth.uid() and created_at>now()-interval '1 day';if n>=50 then raise exception 'Daily message limit';end if;
 elsif tg_table_name='property_service_requests' then select count(*) into n from public.property_service_requests where owner_id=auth.uid() and created_at>now()-interval '1 day';if n>=20 then raise exception 'Daily support request limit';end if;
 elsif tg_table_name='property_resident_reviews' then select count(*) into n from public.property_resident_reviews where owner_id=auth.uid() and created_at>now()-interval '1 day';if n>=20 then raise exception 'Daily review limit';end if;
 end if;return new;
end;$$;
create trigger estate_bounded_write before insert on public.property_search_alerts for each row execute function estate_workspace_private.bounded_write();
create trigger estate_bounded_write before insert on public.property_saved_items for each row execute function estate_workspace_private.bounded_write();
create trigger estate_bounded_write before insert on public.property_offer_messages for each row execute function estate_workspace_private.bounded_write();
create trigger estate_bounded_write before insert on public.property_service_requests for each row execute function estate_workspace_private.bounded_write();
create trigger estate_bounded_write before insert on public.property_resident_reviews for each row execute function estate_workspace_private.bounded_write();
create function estate_workspace_private.review_publication() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='approved' and new.residency_verified and new.reviewed_by is not null and new.reviewed_by<>new.owner_id and new.reviewed_at is not null then
  insert into public.property_review_publications(id,project_id,display_name,rating,review_text,published_at) values(new.id,new.project_id,new.display_name,new.rating,new.review_text,new.reviewed_at)
  on conflict(id) do update set display_name=excluded.display_name,rating=excluded.rating,review_text=excluded.review_text,published_at=excluded.published_at;
 else delete from public.property_review_publications where id=new.id;end if;return new;
end;$$;
create trigger estate_review_publication after insert or update on public.property_resident_reviews for each row execute function estate_workspace_private.review_publication();
create function estate_workspace_private.offer_notice() returns trigger language plpgsql security definer set search_path='' as $$
declare o public.property_offers; recipient uuid;
begin
 if tg_table_name='property_offer_messages' then select * into o from public.property_offers where id=new.offer_id;recipient:=case when new.author_id=o.buyer_id then o.seller_id else o.buyer_id end;
 else o:=new;recipient:=case when auth.uid()=o.buyer_id then o.seller_id else o.buyer_id end;end if;
 if auth.uid() is null or auth.uid() not in (o.buyer_id,o.seller_id) then raise exception 'Offer access denied';end if;
 insert into public.property_notifications(owner_id,title,href) values(recipient,'Property offer / discussion update','/real-estate/workspace?tab=offers');return new;
end;$$;
create trigger estate_offer_notice after insert or update on public.property_offers for each row execute function estate_workspace_private.offer_notice();
create trigger estate_message_notice after insert on public.property_offer_messages for each row execute function estate_workspace_private.offer_notice();
create function estate_workspace_private.capture_unit_price(unit uuid) returns void language plpgsql security definer set search_path='' as $$
declare u public.property_inventory; p public.properties; last_event public.property_price_events; new_event uuid; kind text;
begin
 perform pg_advisory_xact_lock(hashtextextended(unit::text,73));
 select * into u from public.property_inventory where id=unit and status='published';
 if not found or u.price_amount is null or u.price_amount<=0 or u.price_amount>999999999999 then return;end if;
 select * into p from public.properties where id=u.project_id and coalesce(status,'')<>'archived' and slug is not null;
 if not found or not exists(select 1 from public.property_published_media m where m.project_id=p.id and m.media_type='photo' and public.is_property_media_public(m.id)) then return;end if;
 select * into last_event from public.property_price_events where inventory_id=u.id order by recorded_at desc,id desc limit 1;
 if last_event.id is not null and last_event.amount=u.price_amount and last_event.currency=u.currency then return;end if;
 kind:=case when last_event.id is null then 'published' else 'price_changed' end;
 insert into public.property_price_events(inventory_id,project_id,amount,previous_amount,currency,event_type,listing_type,property_type,area_sqft,area_basis,city,country)
 values(u.id,p.id,u.price_amount,case when last_event.currency=u.currency then last_event.amount end,u.currency,kind,u.listing_type,u.property_type,u.area_sqft,u.area_basis,p.city,p.country) returning id into new_event;
 insert into public.property_notifications(owner_id,price_event_id,title,href)
 select distinct a.owner_id,new_event,case when kind='published' then 'New published listing: ' else 'Asking price updated: ' end||left(p.title,140),'/real-estate/'||p.slug
 from public.property_search_alerts a where a.active and a.currency=u.currency
 and ((a.inventory_id=u.id) or (a.inventory_id is null and lower(a.country)=lower(p.country) and (a.city is null or lower(a.city)=lower(p.city)) and a.listing_type=u.listing_type and (a.min_price is null or u.price_amount>=a.min_price) and (a.max_price is null or u.price_amount<=a.max_price) and (a.property_type is null or a.property_type=u.property_type) and (a.min_bedrooms is null or u.bedrooms>=a.min_bedrooms)))
 and (a.event_type='all' or (a.event_type='new_listing' and kind='published') or (a.event_type='price_drop' and last_event.currency=u.currency and u.price_amount<last_event.amount))
 on conflict(owner_id,price_event_id) do nothing;
end;$$;
create function estate_workspace_private.capture_price() returns trigger language plpgsql security definer set search_path='' as $$
declare unit uuid;
begin
 if tg_table_name='property_inventory' then perform estate_workspace_private.capture_unit_price(new.id);
 else for unit in select id from public.property_inventory where project_id=new.project_id and status='published' loop perform estate_workspace_private.capture_unit_price(unit);end loop;end if;return new;
end;$$;
create trigger estate_inventory_price after insert or update of price_amount,currency,status on public.property_inventory for each row execute function estate_workspace_private.capture_price();
create trigger estate_media_price after insert or update on public.property_published_media for each row execute function estate_workspace_private.capture_price();
revoke all on all functions in schema estate_workspace_private from public,anon,authenticated;
-- Public analytics retain RLS and minimum independent project samples.
create function public.property_locality_price_series(p_country text,p_city text,p_currency text,p_type text,p_basis text,p_source text default 'asking')
returns table(month date,median_price_per_sqft numeric,listing_sample bigint,project_sample bigint)
language sql stable security invoker set search_path='' as $$
 with samples as (
 select e.project_id,e.inventory_id::text sample_id,date_trunc('month',e.recorded_at)::date as month,e.amount/e.area_sqft value,e.recorded_at stamp
 from public.property_price_events e where p_source='asking' and e.listing_type='buy' and e.country=p_country and e.city=p_city and e.currency=p_currency and e.property_type=p_type and e.area_basis=p_basis and e.area_sqft>0
 union all
 select r.project_id,r.id::text,date_trunc('month',r.observed_on)::date,r.amount/r.area_sqft,r.observed_on::timestamptz
 from public.property_market_reports r join public.properties p on p.id=r.project_id
 where p_source='transaction' and r.kind='transaction' and r.status='approved' and r.rights_verified and r.reviewed_at is not null and (r.expires_on is null or r.expires_on>=current_date) and coalesce(p.status,'')<>'archived'
 and p.country=p_country and p.city=p_city and r.currency=p_currency and r.property_type=p_type and r.area_basis=p_basis and r.area_sqft>0
 ), dedup as (select distinct on(sample_id,month) * from samples order by sample_id,month,stamp desc)
 select month,percentile_cont(0.5) within group(order by value)::numeric,count(*),count(distinct project_id) from dedup group by month having count(distinct project_id)>=5 order by month desc limit 36;
$$;
revoke all on function public.property_locality_price_series(text,text,text,text,text,text) from public;
grant execute on function public.property_locality_price_series(text,text,text,text,text,text) to anon,authenticated;
-- Seller analytics execute only through the authenticated server's own owner reference.
create function public.property_seller_analytics(p_owner uuid)
returns table(inventory_id uuid,project_id bigint,asking_price numeric,currency text,view_events bigint,enquiry_records bigint,offer_records bigint)
language sql stable security invoker set search_path='' as $$
 select i.id,i.project_id,i.price_amount,i.currency,
 (select count(*) from public.property_listing_events e where e.inventory_id=i.id and e.created_at>=now()-interval '30 days'),
 (select count(*) from public.property_leads l join public.leads legacy on legacy.id=l.legacy_lead_id where legacy.inventory_id=i.id and l.created_at>=now()-interval '30 days'),
 (select count(*) from public.property_offers o where o.inventory_id=i.id and o.created_at>=now()-interval '30 days')
 from public.property_inventory i where i.owner_id=p_owner order by i.created_at desc limit 100;
$$;
revoke all on function public.property_seller_analytics(uuid) from public,anon,authenticated;
grant execute on function public.property_seller_analytics(uuid) to service_role;
do $$begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='property_notifications') then alter publication supabase_realtime add table public.property_notifications;end if;
end$$;
-- First observation is today, never a reconstructed registry or sold-price history.
do $$declare unit uuid;begin for unit in select id from public.property_inventory where status='published' loop perform estate_workspace_private.capture_unit_price(unit);end loop;end$$;
create function public.estate_unwrap(x double precision,a double precision) returns double precision language sql immutable strict parallel safe set search_path='' as $$select a+(x-a+540-floor((x-a+540)/360)*360)-180$$;
create function public.estate_cross(ax double precision,ay double precision,bx double precision,by_ double precision,cx double precision,cy double precision) returns double precision language sql immutable strict parallel safe set search_path='' as $$select (bx-ax)*(cy-ay)-(by_-ay)*(cx-ax)$$;
create function public.property_region_valid(region jsonb) returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare n int; i int;j int;k int;l int; xs double precision[]:='{}';ys double precision[]:='{}';area double precision:=0; a double precision;b double precision;c double precision;d double precision;
begin
 if region is null or jsonb_typeof(region)<>'array' then return false;end if;n:=jsonb_array_length(region);if n<3 or n>50 then return false;end if;
 for i in 0..n-1 loop
  if jsonb_typeof(region->i)<>'array' or jsonb_array_length(region->i)<>2 or jsonb_typeof(region->i->0)<>'number' or jsonb_typeof(region->i->1)<>'number' then return false;end if;
  a:=(region->i->>0)::double precision;b:=(region->i->>1)::double precision;if abs(a)>180 or abs(b)>90 then return false;end if;
  xs:=array_append(xs,public.estate_unwrap(a,(region->0->>0)::double precision));ys:=array_append(ys,b);
 end loop;
 if (select max(x)-min(x) from unnest(xs) x)>180 then return false;end if;
 for i in 1..n loop
  k:=i%n+1;area:=area+xs[i]*ys[k]-xs[k]*ys[i];
  for j in i+1..n loop
   if xs[i]=xs[j] and ys[i]=ys[j] then return false;end if;
   if j=k or (i=1 and j=n) then continue;end if;l:=j%n+1;
   a:=public.estate_cross(xs[i],ys[i],xs[k],ys[k],xs[j],ys[j]);b:=public.estate_cross(xs[i],ys[i],xs[k],ys[k],xs[l],ys[l]);
   c:=public.estate_cross(xs[j],ys[j],xs[l],ys[l],xs[i],ys[i]);d:=public.estate_cross(xs[j],ys[j],xs[l],ys[l],xs[k],ys[k]);
   if a*b<0 and c*d<0 then return false;end if;
   if abs(a)<1e-9 and xs[j] between least(xs[i],xs[k])-1e-9 and greatest(xs[i],xs[k])+1e-9 and ys[j] between least(ys[i],ys[k])-1e-9 and greatest(ys[i],ys[k])+1e-9 then return false;end if;
   if abs(b)<1e-9 and xs[l] between least(xs[i],xs[k])-1e-9 and greatest(xs[i],xs[k])+1e-9 and ys[l] between least(ys[i],ys[k])-1e-9 and greatest(ys[i],ys[k])+1e-9 then return false;end if;
   if abs(c)<1e-9 and xs[i] between least(xs[j],xs[l])-1e-9 and greatest(xs[j],xs[l])+1e-9 and ys[i] between least(ys[j],ys[l])-1e-9 and greatest(ys[j],ys[l])+1e-9 then return false;end if;
   if abs(d)<1e-9 and xs[k] between least(xs[j],xs[l])-1e-9 and greatest(xs[j],xs[l])+1e-9 and ys[k] between least(ys[j],ys[l])-1e-9 and greatest(ys[j],ys[l])+1e-9 then return false;end if;
  end loop;
 end loop;return abs(area)>1e-9;
 exception when invalid_text_representation or numeric_value_out_of_range then return false;
end;$$;
create function public.property_region_contains(region jsonb,longitude double precision,latitude double precision) returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare n int;i int;j int;x double precision;ax double precision;ay double precision;bx double precision;by_ double precision;inside boolean:=false;
begin
 if longitude is null or latitude is null or abs(longitude)>180 or abs(latitude)>90 or not public.property_region_valid(region) then return false;end if;
 n:=jsonb_array_length(region);x:=public.estate_unwrap(longitude,(region->0->>0)::double precision);j:=n-1;
 for i in 0..n-1 loop
  ax:=public.estate_unwrap((region->j->>0)::double precision,(region->0->>0)::double precision);ay:=(region->j->>1)::double precision;
  bx:=public.estate_unwrap((region->i->>0)::double precision,(region->0->>0)::double precision);by_:=(region->i->>1)::double precision;
  if abs(public.estate_cross(ax,ay,bx,by_,x,latitude))<1e-9 and x between least(ax,bx)-1e-9 and greatest(ax,bx)+1e-9 and latitude between least(ay,by_)-1e-9 and greatest(ay,by_)+1e-9 then return true;end if;
  if (ay>latitude)<>(by_>latitude) then if x<(bx-ax)*(latitude-ay)/(by_-ay)+ax then inside:=not inside;end if;end if;j:=i;
 end loop;return inside;
end;$$;
revoke all on function public.estate_unwrap(double precision,double precision),public.estate_cross(double precision,double precision,double precision,double precision,double precision,double precision),public.property_region_valid(jsonb),public.property_region_contains(jsonb,double precision,double precision) from public;
grant execute on function public.estate_unwrap(double precision,double precision),public.estate_cross(double precision,double precision,double precision,double precision,double precision,double precision),public.property_region_valid(jsonb),public.property_region_contains(jsonb,double precision,double precision) to anon,authenticated;

CREATE OR REPLACE FUNCTION public.search_hybrid_properties(filters jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
 mode text := coalesce(filters->>'mode','buy');
 page_num integer := coalesce((filters->>'page')::integer,1);
 lo numeric := (filters->>'minPrice')::numeric;
 hi numeric := (filters->>'maxPrice')::numeric;
 cur text := filters->>'currency';
 result jsonb;
begin
 if (filters->'region' is not null and filters->'region'<>'null'::jsonb and not public.property_region_valid(filters->'region')) then raise exception 'Invalid map region' using errcode='22023';end if;
 if jsonb_typeof(filters)<>'object' or mode not in ('buy','rent','new_launch','commercial','plots')
  or page_num<1 or page_num>10000
  or coalesce(filters->>'bedrooms','1') not in ('1','2','3','4+')
  or coalesce(filters->>'possession','ready_to_move') not in ('ready_to_move','under_construction','off_plan')
  or coalesce(filters->>'sort','latest') not in ('latest','ai','price_low','price_high')
  or (cur is not null and cur not in ('INR','AED','USD','GBP','EUR','SGD'))
  or ((lo is not null or hi is not null) and cur is null)
  or lo<=0 or hi<=0 or lo>999999999999 or hi>999999999999 or lo>hi
  or length(coalesce(filters->>'query',''))>120
  or length(coalesce(filters->>'city',''))>80 or length(coalesce(filters->>'country',''))>80 then
  raise exception 'Invalid property search' using errcode='22023';
 end if;
 with matched as (
  select i.* from public.property_inventory i
  where i.status='published'
   and (mode<>'buy' or i.listing_type='buy') and (mode<>'rent' or i.listing_type='rent')
   and (mode<>'new_launch' or (i.is_new_launch and i.listing_type='buy'))
   and (mode<>'commercial' or i.property_type='Commercial')
   and (mode<>'plots' or i.property_type='Plot')
   and (filters->>'type' is null or i.property_type=filters->>'type')
   and (filters->>'bedrooms' is null or
    (filters->>'bedrooms'='4+' and i.bedrooms>=4) or i.bedrooms::text=filters->>'bedrooms')
   and (filters->>'possession' is null or i.possession_status=filters->>'possession')
   and (cur is null or i.currency=cur)
   and (lo is null or i.price_amount>=lo) and (hi is null or i.price_amount<=hi)
 ), projects as (
  select p.id,p.slug,p.title,p.location,p.city,p.country,p.district,p.rera_id,p.developer,p.builder_name,
   p.official_source_url,p.lat,p.lng,p.final_score,
   count(i.id) as active_inventory_count,min(i.price_amount) as inventory_min_price,
   max(i.price_amount) as inventory_max_price,
   case when count(distinct i.currency)=1 then min(i.currency) end as inventory_currency,
   min(i.bedrooms) as beds,min(i.area_sqft) as sqft,
   case when count(distinct i.property_type)=1 then min(i.property_type) else 'Multiple unit types' end as property_type,
   max(i.published_at) as published_at,
   case when count(distinct i.possession_status)=1 then min(i.possession_status) end as possession_status,
   case when count(distinct i.area_basis)=1 then min(i.area_basis) end as area_basis,
   (select jsonb_agg(jsonb_build_object('id',m.id,'project_id',m.project_id,'media_type',m.media_type,
     'attribution',m.attribution,'is_primary',m.is_primary,'published_at',m.published_at))
    from public.property_published_media m where m.project_id=p.id and m.media_type='photo') as "publishedMedia"
  from public.properties p join matched i on i.project_id=p.id
  where coalesce(p.status,'')<>'archived' and p.slug is not null
   and (filters->'region' is null or filters->'region'='null'::jsonb or public.property_region_contains(filters->'region',p.lng::double precision,p.lat::double precision))
   and exists (select 1 from public.property_published_media m where m.project_id=p.id and m.media_type='photo')
   and (filters->>'query' is null or p.title ilike '%'||(filters->>'query')||'%'
    or p.location ilike '%'||(filters->>'query')||'%' or p.city ilike '%'||(filters->>'query')||'%'
    or p.district ilike '%'||(filters->>'query')||'%' or p.rera_id ilike '%'||(filters->>'query')||'%')
   and (filters->>'city' is null or p.city ilike '%'||(filters->>'city')||'%' or p.location ilike '%'||(filters->>'city')||'%')
   and (filters->>'country' is null or p.country ilike '%'||(filters->>'country')||'%')
  group by p.id
 ), selected as (
  select * from projects
  order by
   case when filters->>'sort'='price_low' then inventory_min_price end asc nulls last,
   case when filters->>'sort'='price_high' then inventory_max_price end desc nulls last,
   case when filters->>'sort'='ai' then final_score end desc nulls last,
   published_at desc nulls last,id desc
  limit 25 offset (page_num-1)*24
 ), numbered as (select *, row_number() over (order by
  case when filters->>'sort'='price_low' then inventory_min_price end asc nulls last,
  case when filters->>'sort'='price_high' then inventory_max_price end desc nulls last,
  case when filters->>'sort'='ai' then final_score end desc nulls last,published_at desc nulls last,id desc) as row_no from selected)
 select jsonb_build_object('items',coalesce(jsonb_agg(to_jsonb(n)-'row_no' order by row_no) filter(where row_no<=24),'[]'::jsonb),
  'hasNext',count(*)>24,'page',page_num) into result from numbered n;
 return result;
end;
$function$;


notify pgrst,'reload schema';
commit;
