alter table public.listing_submissions
  add column if not exists media_urls jsonb not null default '[]'::jsonb;

alter table public.property_inventory
  add column if not exists media_urls jsonb not null default '[]'::jsonb;

alter table public.listing_submissions
  add constraint listing_submissions_media_urls_check
  check (jsonb_typeof(media_urls) = 'array' and jsonb_array_length(media_urls) <= 8);

alter table public.property_inventory
  add constraint property_inventory_media_urls_check
  check (jsonb_typeof(media_urls) = 'array' and jsonb_array_length(media_urls) <= 8);

alter table public.leads
  add column if not exists inventory_id uuid references public.property_inventory(id) on delete set null;

create index if not exists leads_inventory_id_idx
  on public.leads(inventory_id)
  where inventory_id is not null;
