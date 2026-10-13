import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Tender DB uses RLS and defaults to private review",()=>{
  const sql=src("supabase/migrations/20261013224500_tender_catalog_v1.sql");
  assert.match(sql,/alter table public.tenders enable row level security/i);
  assert.match(sql,/is_public boolean not null default false/i);
  assert.match(sql,/source_verified boolean not null default false/i);
  assert.match(sql,/status text not null default 'review'/i);
  assert.match(sql,/status = 'published' and deadline_at > now\(\)/i);
  assert.match(sql,/revoke all on public.tenders from public, anon, authenticated/i);
  assert.doesNotMatch(sql,/insert into public.tenders/i);
});
test("Tender public API reads verified records only, and forbids anonymous writes",()=>{
  const route=src("src/app/api/tender/route.ts");
  const catalog=src("src/lib/tender/catalog.ts");
  assert.match(route,/export async function GET/);
  assert.match(route,/export async function POST/);
  assert.match(route,/status: 405/);
  assert.match(catalog,/\.eq\("source_verified", true\)/);
  assert.match(catalog,/\.eq\("is_public", true\)/);
  assert.match(catalog,/\.gt\("deadline_at"/);
  assert.match(catalog,/PAGE_SIZE = 12/);
  assert.doesNotMatch(catalog,/SERVICE_ROLE|mockTender|faker/i);
});
