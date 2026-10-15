import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../supabase/migrations/20261015153000_official_tender_revision_tracking.sql",import.meta.url),"utf8");
const edge=readFileSync(new URL("../supabase/functions/gth-tender-ingest/index.ts",import.meta.url),"utf8");
test("Source update RPC is a restricted invoker, never public or definer",()=>{
 assert.match(sql,/security invoker/i);
 assert.doesNotMatch(sql,/security definer/i);
 assert.match(sql,/revoke all on function public\.upsert_official_tender_batch\(text,jsonb\)[\s\S]+from public, anon, authenticated;/i);
 assert.match(sql,/grant execute on function public\.upsert_official_tender_batch\(text,jsonb\)[\s\S]+to service_role;/i);
});
test("Only changed public tender fields are overwritten, never reviewed conditions",()=>{
 assert.match(sql,/is distinct from/i);
 assert.match(sql,/updated_at=now\(\)/i);
 assert.match(sql,/on conflict \(source_name,source_reference\) do update/i);
 const updates=sql.split(/on conflict \(source_name,source_reference\) do update/i)[1].split(/\swhere public\.tenders\.status/)[0];
 assert.doesNotMatch(updates,/requirements_verified|eligibility_requirements|owner_id|bidder_profile|draft_text/i);
 assert.match(sql,/and public\.tenders\.is_public=true/);
});
test("OIDC gateway keeps trusted repo, exact workflow and cryptographic signature gates",()=>{
 assert.match(edge,/jwtVerify\(token, GH_KEYS/);
 assert.match(edge,/EXPECTED_WORKFLOW/);
 assert.match(edge,/refs\/heads\/main/);
 assert.match(edge,/upsert_official_tender_batch/);
 assert.match(edge,/service_role|SERVICE_ROLE_KEY/);
 assert.doesNotMatch(edge,/resolution=ignore-duplicates/);
 assert.match(edge,/delete.*requirements_verified|requirements_verified: _unused/);
});
