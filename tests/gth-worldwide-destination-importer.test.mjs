import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");

test("free Nuitee static-only importer writes to existing destination catalog", () => {
  const script = read("scripts/pull-nuitee-destinations.ts");
  assert.match(script, /\/v3\.0\/data\/countries/);
  assert.match(script, /\/v3\.0\/data\/cities/);
  assert.doesNotMatch(script, /api\.liteapi\.travel\/v3\.0\/data\/places/);
  assert.doesNotMatch(script, /fetch\([^)]*hotels\/rates/);
  assert.match(script, /\.from\("destinations"\)/);
  assert.doesNotMatch(script, /\.from\("nuitee_destinations"\)/);
  assert.match(script, /BATCH_SIZE = 250/);
  assert.match(script, /BATCH_DELAY_MS = 500/);
  assert.match(script, /GTH_INGESTION_ENABLED/);
  assert.match(script, /ignoreDuplicates:\s*true/);
  assert.match(script, /--daily-rotation=/);
  assert.doesNotMatch(script, /nuitee_place_id: slug|placeId: slug/);
});

test("public directory is paginated and supports dynamic imported slugs", () => {
  const page = read("src/app/destinations/page.tsx");
  const detail = read("src/app/destinations/[slug]/page.tsx");
  const catalog = read("src/lib/destinations/catalog.ts");
  assert.match(page, /destinationDirectoryPage/);
  assert.doesNotMatch(page, /offset < 1200/);
  assert.match(catalog, /count: "exact"/);
  assert.match(catalog, /pageSize - 1/);
  assert.match(catalog, /\.eq\("is_active", true\)/);
  assert.match(detail, /a-z0-9/);
  assert.match(detail, /robots:\{index,follow:index\}/);
});

test("existing public destination writes are closed", () => {
  const sql = read("supabase/migrations/20261120020000_secure_worldwide_destinations.sql");
  assert.match(sql, /revoke insert, update, delete/);
  assert.match(sql, /drop policy if exists "Allow insert destinations"/);
  assert.match(sql, /on public\.destinations for select/);
  assert.doesNotMatch(sql, /drop table|truncate table/i);
});

test("automation requires explicit flag and only protected server credentials", () => {
  const workflow = read(".github/workflows/gth-nuitee-free-destination-sync.yml");
  assert.match(workflow, /GTH_NUITEE_DESTINATIONS_ENABLED/);
  assert.match(workflow, /NUITEE_PRODUCTION_API_KEY/);
  assert.match(workflow, /--daily-rotation=8 --write/);
  assert.doesNotMatch(workflow, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(workflow, /\/data\/places/);
});
