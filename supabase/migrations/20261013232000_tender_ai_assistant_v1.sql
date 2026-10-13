-- GTH PRO Tender Guided Workspace v1. Additive to 20261013224500_tender_catalog_v1.sql.
-- Source-derived requirements require manual review; no automatic eligibility assertion.
alter table public.tenders
  add column if not exists eligibility_requirements jsonb not null default '{}'::jsonb,
  add column if not exists requirements_verified boolean not null default false;
alter table public.tenders add constraint tenders_eligibility_object_check
  check (jsonb_typeof(eligibility_requirements) = 'object');
-- Drafts are sensitive business data. They are private to a verified authenticated owner.
create table if not exists public.tender_bid_workspaces (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 tender_id uuid references public.tenders(id) on delete set null,
 tender_title text not null default '' check(length(tender_title) <= 240),
 bidder_profile jsonb not null default '{}'::jsonb check(jsonb_typeof(bidder_profile) = 'object'),
 requirement_answers jsonb not null default '{}'::jsonb check(jsonb_typeof(requirement_answers) = 'object'),
 draft_text text not null default '' check(length(draft_text) <= 12000),
 status text not null default 'draft' check(status in ('draft','review_required')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists tender_bid_workspaces_owner_idx on public.tender_bid_workspaces(owner_id, updated_at desc);
alter table public.tender_bid_workspaces enable row level security;
revoke all on public.tender_bid_workspaces from public, anon, authenticated;
grant select,insert,update,delete on public.tender_bid_workspaces to authenticated;
drop policy if exists "Tender workspace owner only select" on public.tender_bid_workspaces;
drop policy if exists "Tender workspace owner only insert" on public.tender_bid_workspaces;
drop policy if exists "Tender workspace owner only update" on public.tender_bid_workspaces;
drop policy if exists "Tender workspace owner only delete" on public.tender_bid_workspaces;
create policy "Tender workspace owner only select" on public.tender_bid_workspaces
 for select to authenticated using (owner_id = (select auth.uid()));
create policy "Tender workspace owner only insert" on public.tender_bid_workspaces
 for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Tender workspace owner only update" on public.tender_bid_workspaces
 for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Tender workspace owner only delete" on public.tender_bid_workspaces
 for delete to authenticated using (owner_id = (select auth.uid()));
comment on table public.tender_bid_workspaces is
 'Owner-only tender application preparation drafts. No official submissions or payments. Do not store PAN, Aadhaar, bank credentials, passwords or secret tender prices.';
