// Operator-only migration helper. No secret values are logged or committed.
// Run from a trusted local checkout with npm ci and a reviewed Wrangler installation.
// Usage: node scripts/cloudflare-env-migration.mjs /secure/production.env [/secure/recovered.env]
// Apply to an EXISTING staging Worker only: add --apply after successful review.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parse } from "dotenv";

const expected = [
  "NEXT_PUBLIC_HOPEGOO_AFFILIATE_URL",
  "ENABLE_UNIFIED_CITY_ROUTER",
  "NEXT_PUBLIC_NUITEE_WHITE_LABEL_URL",
  "CRON_SECRET",
  "ODDS_API_KEY",
  "SEATGEEK_CLIENT_ID",
  "NEXT_PUBLIC_GA_ID",
  "NUITEE_PRODUCTION_API_KEY",
  "PEXELS_API_KEY",
  "GTH_PUBLIC_LAUNCH_ENABLED",
  "SUPABASE_SERVICE_ROLE_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "GTH_LEGACY_PEXELS_KEY_DISABLED",
  "TRAVELPAYOUTS_API_TOKEN",
  "TRAVELPAYOUTS_MARKER",
  "GEMINI_PRO_KEY",
  "AVIASALES_API_TOKEN",
  "AVIASALES_PARTNER_ID",
  "GEMINI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
];
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const paths = args.filter(x => x !== "--apply");
const fail = msg => { console.error(msg); process.exit(1); };
if (paths.length < 1 || paths.length > 2 || paths.some(x => x.startsWith("-"))) {
  fail("Provide production env file and optional recovered env file; add --apply only after review.");
}
let source = Object.create(null);
try {
  for (const path of paths) Object.assign(source, parse(readFileSync(path)));
} catch {
  fail("Cannot read the secure environment source file(s).");
}
const valid = v => typeof v === "string" && !!v.trim() && !/^(undefined|null|\[redacted\]|\*+)$/i.test(v.trim());
const values = Object.fromEntries(expected.filter(k => valid(source[k])).map(k => [k, source[k]]));
const missing = expected.filter(k => !Object.hasOwn(values, k));
console.log(`Production inventory: ${Object.keys(values).length}/${expected.length} present.`);
if (missing.length) fail("Missing/empty/redacted names: " + missing.join(", "));
const anon = values.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (anon.startsWith("sb_secret_")) fail("Public Supabase key is privileged. Stop.");
if (anon.split(".").length === 3) {
  try {
    const claims = JSON.parse(Buffer.from(anon.split(".")[1], "base64url").toString());
    if (claims.role !== "anon") fail("Unexpected Supabase public JWT role. Stop.");
  } catch { fail("Invalid Supabase public JWT. Stop."); }
}
if (!apply) {
  console.log("Inventory ready. No Cloudflare write performed. Public NEXT_PUBLIC_* values also need to be available at build time.");
  process.exit(0);
}
if (process.env.CI) fail("Run this operator-only helper outside CI, on a trusted machine.");
const worker = process.env.GTH_CLOUDFLARE_STAGING_WORKER;
if (worker !== "gth-pro-migration") fail("Explicit staging target GTH_CLOUDFLARE_STAGING_WORKER=gth-pro-migration required.");
if (!/^[a-f0-9]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID || "") || !valid(process.env.CLOUDFLARE_API_TOKEN)) {
  fail("Cloudflare account ID or token missing.");
}
const cli = process.platform === "win32" ? null : "./node_modules/.bin/wrangler";
if (!cli) fail("Use a trusted Linux/macOS checkout with a reviewed local Wrangler installation.");
const childEnv = { ...process.env, WRANGLER_LOG: "none", WRANGLER_SEND_METRICS: "false" };
const check = spawnSync(cli, ["secret", "list", "--name", worker], {
  env: childEnv, stdio: "ignore", timeout: 60000
});
if (check.status !== 0) fail("Existing staging Worker or Cloudflare access could not be confirmed. No upload attempted.");
const upload = spawnSync(cli, ["secret", "bulk", "--name", worker], {
  env: childEnv, input: JSON.stringify(values), stdio: ["pipe", "ignore", "ignore"], timeout: 120000
});
if (upload.status !== 0) fail("Secret upload failed; review staging settings securely. No success claimed.");
console.log("Wrangler reported successful bulk upload. Verify build-time variables and staging smoke tests before any domain switch.");
