-- Additive original supplier inventory: no legacy demo rows promoted.
-- Apply at the consolidated release gate before enabling GitHub cloud upserts.
create table if not exists public.tour_supplier_products (
  provider text not null check(provider = 'wegotrip'),
  provider_product_id text not null check(provider_product_id ~ '^[1-9][0-9]{0,17}$'),
  title text not null check(length(title) between 3 and 240),
  country_code text not null check(country_code ~ '^[A-Z]{2}$'),
  country_name text not null check(length(country_name) between 2 and 120),
  city_id bigint not null check(city_id > 0),
  city_name text not null check(length(city_name) between 2 and 120),
  city_slug text not null check(city_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  product_slug text not null check(product_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  product_type smallint not null check(product_type in (1,2,3)),
  source_url text not null check(source_url ~ '^https://(www[.])?wegotrip[.]com/'),
  image_url text not null check(image_url ~ '^https://(wgt-prod-storage[.]s3[.]amazonaws[.]com|app[.]wegotrip[.]com)/media/'),
  price_numeric numeric(12,2) check(price_numeric is null or price_numeric > 0),
  currency text not null check(currency ~ '^[A-Z]{3}$'),
  source_verified boolean not null default false,
  image_verified boolean not null default false,
  available boolean not null default false,
  last_verified_at timestamptz not null,
  inserted_at timestamptz not null default now(),
  primary key(provider,provider_product_id)
);
create index if not exists tour_supplier_by_city
  on public.tour_supplier_products (lower(city_name),last_verified_at desc);
create index if not exists tour_supplier_by_country
  on public.tour_supplier_products (country_code,last_verified_at desc);
alter table public.tour_supplier_products enable row level security;
revoke all on public.tour_supplier_products from public, anon, authenticated;
grant select on public.tour_supplier_products to anon, authenticated;
drop policy if exists "Public reads recent validated supplier products" on public.tour_supplier_products;
create policy "Public reads recent validated supplier products"
  on public.tour_supplier_products for select to anon,authenticated
  using(source_verified and image_verified and available
    and last_verified_at > now() - interval '14 days');
comment on table public.tour_supplier_products is
  'Provider-supplied affiliate preview products, not GTH-owned photos or confirmed date-specific availability. Original supplier controls prices and fulfillment. Strict RLS read-only public; cloud writer uses service role.';
