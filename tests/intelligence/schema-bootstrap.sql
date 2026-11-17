-- Synthetic disposable test database only, never production data.
create role anon;
create role authenticated;
create role service_role bypassrls;
create table public.properties(id bigint primary key,country text,state text,district text,city text,source_type text,status text,visible boolean default true);
create table public.tenders(id uuid primary key,country_code text,region text,title text,buyer text,deadline_at timestamptz,status text,is_public boolean,source_verified boolean,sector text);
alter table public.properties enable row level security;
alter table public.tenders enable row level security;
grant usage on schema public to anon,authenticated,service_role;
grant select on public.properties,public.tenders to anon,authenticated,service_role;
create policy readable_property on public.properties for select to anon,authenticated using(visible);
create policy readable_tender on public.tenders for select to anon,authenticated using(is_public);
insert into public.properties values(1,'India','Maharashtra','Thane','Mumbai','rera','active',true),(2,'India','Maharashtra','Mumbai','Mumbai','inventory','active',true),(3,'India','Maharashtra','Thane','Mumbai','rera','active',false);
insert into public.tenders values
 ('11111111-1111-4111-8111-111111111111','IN','Maharashtra','Synthetic public works','Test authority',now()+interval '1 day','published',true,true,'works'),
 ('22222222-2222-4222-8222-222222222222','IN','Thane','Synthetic district works','Test authority',now()+interval '2 days','published',true,true,'works'),
 ('33333333-3333-4333-8333-333333333333','IN','Mumbai','Synthetic city works','Test authority',now()+interval '2 days','published',true,true,'works'),
 ('44444444-4444-4444-8444-444444444444','IN','Maharashtra','Synthetic expired','Test authority',now()-interval '1 day','published',true,true,'works'),
 ('55555555-5555-4555-8555-555555555555','AE','Maharashtra','Synthetic foreign','Test authority',now()+interval '2 days','published',true,true,'works'),
 ('66666666-6666-4666-8666-666666666666','IN','Maharashtra','Synthetic private','Test authority',now()+interval '2 days','draft',false,false,'works'),
 ('77777777-7777-4777-8777-777777777777','IN','Maharashtra','Synthetic goods','Test authority',now()+interval '2 days','published',true,true,'goods');
