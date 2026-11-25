// Trusted staging operator only. Never run this with secrets in a pull_request job.
import { parse } from "dotenv";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const stop = message => { console.error(message); process.exitCode = 1; throw new Error("Staging gate failed."); };
const required = [
  "NEXT_PUBLIC_HOPEGOO_AFFILIATE_URL", "ENABLE_UNIFIED_CITY_ROUTER",
  "NEXT_PUBLIC_NUITEE_WHITE_LABEL_URL", "CRON_SECRET", "ODDS_API_KEY",
  "SEATGEEK_CLIENT_ID", "NEXT_PUBLIC_GA_ID", "NUITEE_PRODUCTION_API_KEY",
  "PEXELS_API_KEY", "GTH_PUBLIC_LAUNCH_ENABLED", "SUPABASE_SERVICE_ROLE_KEY",
  "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "TRAVELPAYOUTS_API_TOKEN",
  "TRAVELPAYOUTS_MARKER", "GEMINI_PRO_KEY", "AVIASALES_API_TOKEN",
  "AVIASALES_PARTNER_ID", "GEMINI_API_KEY", "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];
const optional = [
  "OPENAI_API_KEY", "NEXT_PUBLIC_SUPPORT_EMAIL", "NEXT_PUBLIC_TICKETNETWORK_AFFILIATE_URL",
  "TRAVELPAYOUTS_TOKEN", "GTH_HOPEGOO_AFFILIATE_URL", "GTH_KLOOK_AFFILIATE_URL",
  "GTH_GETYOURGUIDE_AFFILIATE_URL", "GTH_WEGOTRIP_AFFILIATE_URL",
  "GTH_KKDAY_AFFILIATE_URL", "GTH_GOCITY_AFFILIATE_URL",
  "GTH_WELCOME_PICKUPS_AFFILIATE_URL", "GTH_GETTRANSFER_AFFILIATE_URL",
  "GTH_BUSINESS_WHATSAPP_NUMBER", "NEXT_PUBLIC_HOME_LOAN_AFFILIATE_URL",
  "GOOGLE_PLACES_API_KEY", "GTH_GOOGLE_PLACES_ON_DEMAND_ENABLED",
  "GTH_GOOGLE_PLACES_DAILY_BUDGET", "GTH_RATE_LIMIT_NAMESPACE",
  "GTH_INGESTION_ENABLED", "SUPABASE_INGESTION_KEY", "GTH_INTERNAL_KEY",
  "GTH_LEGACY_PEXELS_KEY_DISABLED",
];
const allowed = new Set([...required, ...optional]);
const recoveredNames = ["CRON_SECRET","NUITEE_PRODUCTION_API_KEY","ODDS_API_KEY","SEATGEEK_CLIENT_ID","SUPABASE_SERVICE_ROLE_KEY","UPSTASH_REDIS_REST_TOKEN","UPSTASH_REDIS_REST_URL"];
const target = "gth-pro-migration";
const valid = value => typeof value === "string" && value.trim() && !/^(undefined|null|\[redacted\]|\*+)$/i.test(value.trim());
const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const bundle = process.env.GTH_CLOUDFLARE_RUNTIME_ENV;
const base = {...process.env};
delete base.CLOUDFLARE_API_TOKEN;
delete base.CLOUDFLARE_ACCOUNT_ID;
delete base.GTH_CLOUDFLARE_RUNTIME_ENV;
delete base.VERCEL_TOKEN;
for (const name of Object.keys(base)) {
  if (allowed.has(name) || name.startsWith("NEXT_PUBLIC_")) delete base[name];
}
let dir;
async function main() {
  if (process.env.GITHUB_REPOSITORY !== "p13780811-debug/GTH-tour-travels-booking" ||
      process.env.GITHUB_REF !== "refs/heads/infra/cloudflare-preflight-20261125" ||
      !["push","workflow_dispatch"].includes(process.env.GITHUB_EVENT_NAME)) stop("Untrusted staging invocation.");
  if (!valid(bundle)) stop("GTH_CLOUDFLARE_RUNTIME_ENV is not configured. No upload attempted.");
  if (!valid(token) || !/^[a-f0-9]{32}$/i.test(account || "")) stop("Cloudflare connection settings missing.");
  let values;
  try { values = parse(bundle); } catch { stop("Cannot parse the private dotenv bundle."); }
  // Strip only the explicitly identified platform-generated export metadata.
  // Never migrate Vercel identity, deployment provenance, or build-cache controls.
  const platformGenerated = [
    "NX_DAEMON",
    "TURBO_CACHE",
    "TURBO_DOWNLOAD_LOCAL_ENABLED",
    "TURBO_REMOTE_ONLY",
    "TURBO_RUN_SUMMARY",
    "VERCEL",
    "VERCEL_ENV",
    "VERCEL_GIT_COMMIT_AUTHOR_LOGIN",
    "VERCEL_GIT_COMMIT_AUTHOR_NAME",
    "VERCEL_GIT_COMMIT_MESSAGE",
    "VERCEL_GIT_COMMIT_REF",
    "VERCEL_GIT_COMMIT_SHA",
    "VERCEL_GIT_PREVIOUS_SHA",
    "VERCEL_GIT_PROVIDER",
    "VERCEL_GIT_PULL_REQUEST_ID",
    "VERCEL_GIT_REPO_ID",
    "VERCEL_GIT_REPO_OWNER",
    "VERCEL_GIT_REPO_SLUG",
    "VERCEL_TARGET_ENV",
    "VERCEL_URL",
    "VERCEL_OIDC_TOKEN"
  ];
  for (const name of platformGenerated) delete values[name];
  // Unknown application variables still fail closed; do not broadly ignore prefixes.
  // Individually recovered repository secrets are authoritative for these names.
  for (const name of recoveredNames) {
    if (!valid(process.env[name])) stop("Missing recovered GitHub secret: " + name);
    values[name] = process.env[name];
  }
  const unknown = Object.keys(values).filter(k => !allowed.has(k));
  const missing = required.filter(k => !valid(values[k]));
  if (unknown.length) stop("Unclassified names; reconcile before deployment: " + unknown.join(", "));
  if (missing.length) stop("Missing/empty/redacted names: " + missing.join(", "));
  for (const k of Object.keys(values)) {
    if (!valid(values[k])) delete values[k];
    else if (Buffer.byteLength(values[k], "utf8") > 5120) stop("Variable exceeds Worker size limit: " + k);
  }
  const anon = values.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anon.startsWith("sb_secret_")) stop("Privileged key in public Supabase configuration.");
  if (anon.split(".").length === 3) {
    let claims;
    try { claims = JSON.parse(Buffer.from(anon.split(".")[1], "base64url").toString()); } catch { stop("Invalid public Supabase JWT."); }
    if (claims.role !== "anon") stop("Unexpected public Supabase JWT role.");
  } else if (!anon.startsWith("sb_publishable_")) stop("Expected an anon JWT or publishable Supabase key.");
  // Normalize surrounding whitespace only, never infer or rewrite provider hosts.
  const endpointIssues = [];
  for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "UPSTASH_REDIS_REST_URL"]) {
    const raw = values[name].trim();
    let url;
    try { url = new URL(raw); } catch { endpointIssues.push(name + ": expected a bare HTTPS URL, not a command, assignment or token"); continue; }
    const issues = [];
    if (url.protocol !== "https:") issues.push("HTTPS required");
    if (url.username || url.password || url.search || url.hash) issues.push("credentials, query or fragment not permitted");
    if (name === "NEXT_PUBLIC_SUPABASE_URL") {
      if (!url.hostname.endsWith(".supabase.co")) issues.push("expected Supabase project API hostname");
    } else {
      if (!url.hostname.endsWith(".upstash.io")) issues.push("expected Upstash REST hostname");
      if (url.port || url.pathname !== "/") issues.push("expected REST base URL without port or path");
    }
    if (issues.length) endpointIssues.push(name + ": " + issues.join("; "));
    else values[name] = raw;
  }
  if (endpointIssues.length) stop("Endpoint validation failed: " + endpointIssues.join(" | "));
  console.log("Supabase and Redis endpoint format checks passed.");

  // Staging-specific overrides only. Original source configuration is unchanged.
  delete values.GTH_LEGACY_PEXELS_KEY_DISABLED;
  values.GTH_PUBLIC_LAUNCH_ENABLED = "false";
  values.GTH_RATE_LIMIT_NAMESPACE = "gth-pro-cloudflare-preview";
  values.GTH_INGESTION_ENABLED = "false";
  values.VERCEL_ENV = "preview"; // Existing SEO and budget code uses this environment label, not VERCEL=1.
  if (Object.keys(values).length > 64) stop("Worker free-tier environment limit exceeded.");
  const response = await fetch("https://api.cloudflare.com/client/v4/accounts/" + account + "/workers/scripts", {
    headers: { Authorization: "Bearer " + token }, redirect: "error", signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) stop("Cannot verify staging target (HTTP " + response.status + ").");
  const data = await response.json();
  if (!data.success || !Array.isArray(data.result)) stop("Invalid Cloudflare target inventory response.");
  if (data.result.some(w => w.id === target)) stop("Staging Worker already exists. Inspect before any overwrite.");
  if (!existsSync("wrangler.jsonc") || !existsSync("open-next.config.ts")) stop("Missing tested Worker config.");
  const config = JSON.parse((await import("node:fs")).readFileSync("wrangler.jsonc", "utf8"));
  if (config.name !== target || config.routes?.length || config.workers_dev !== false || config.preview_urls !== false) stop("Unexpected staging Worker configuration.");
  const pub = Object.fromEntries(Object.entries(values).filter(([k])=>k.startsWith("NEXT_PUBLIC_")));
  console.log("Staging inventory validated. Running real-config build with public variables only.");
  const build = spawnSync("./node_modules/.bin/opennextjs-cloudflare", ["build"], {
    env: {...base, ...pub, GTH_PUBLIC_LAUNCH_ENABLED:"false", VERCEL_ENV:"preview"},
    stdio: "inherit", timeout: 1200000
  });
  if (build.status !== 0 || !existsSync(".open-next/worker.js")) stop("Real-config build failed. No deployment attempted.");
  dir = mkdtempSync(join(tmpdir(), "gth-private-stage-"));
  const file = join(dir, "secrets.json");
  writeFileSync(file, JSON.stringify(values), {mode:0o600, flag:"wx"});
  const cloudEnv = {...base, CLOUDFLARE_API_TOKEN:token, CLOUDFLARE_ACCOUNT_ID:account};
  // Report only predefined error categories and numeric Cloudflare error codes.
  // Never echo Wrangler output, because it can contain runtime binding data.
  const diagnostics = (result, label) => {
    const output = String(result.stdout || "") + "\n" + String(result.stderr || "");
    const checks = [
      [/unknown argument|unknown option|unrecognized option/i, "unsupported CLI option"],
      [/authentication error|invalid access token|not authorized|unauthorized|permission denied|insufficient permission|forbidden/i, "authentication or permission"],
      [/workers\.dev subdomain|register.*subdomain/i, "workers.dev subdomain configuration"],
      [/service binding|service.*not found|service.*does not exist/i, "service binding target"],
      [/startup|script startup|initialization time/i, "Worker startup validation"],
      [/size limit|too large|exceeds.*size|script too large/i, "bundle or asset size"],
      [/asset.*limit|too many assets/i, "asset limit"],
      [/billing|paid plan|upgrade.*plan/i, "plan restriction"],
      [/network|fetch failed|ETIMEDOUT|ECONNRESET/i, "network failure"],
      [/invalid binding|secret.*invalid|binding.*already/i, "binding validation"],
    ];
    const matches = checks.filter(([pattern]) => pattern.test(output)).map(([, category]) => category);
    const codes = [...new Set([...output.matchAll(/\[code:\s*(\d{3,7})\]/gi)].map(m => m[1]))];
    console.log(label + ": exit=" + (Number.isInteger(result.status) ? result.status : "unavailable") +
      "; categories=" + (matches.join(", ") || "unclassified") + "; Cloudflare codes=" + (codes.join(", ") || "none"));
  };
  const dryRun = spawnSync("./node_modules/.bin/wrangler", ["deploy","--dry-run"], {
    env:base, encoding:"utf8", stdio:["ignore","pipe","pipe"], timeout:300000, maxBuffer:8*1024*1024
  });
  diagnostics(dryRun, "Wrangler dry run");
  if (dryRun.status !== 0) stop("Dry run failed. No remote upload attempted.");
  // Cloudflare Workers Free: both compressed and uncompressed limits apply.
  // Use conservative decimal MB thresholds, converting Wrangler's KiB output to bytes.
  const sizeMatch = (String(dryRun.stdout || "") + "\n" + String(dryRun.stderr || "")).match(/Total Upload:\s*([\d.]+)\s*KiB\s*\/\s*gzip:\s*([\d.]+)\s*KiB/i);
  if (!sizeMatch) stop("Cannot confirm compressed and uncompressed bundle sizes. No upload attempted.");
  const rawKiB = Number(sizeMatch[1]), gzipKiB = Number(sizeMatch[2]);
  if (!Number.isFinite(rawKiB) || !Number.isFinite(gzipKiB)) stop("Invalid Worker size measurement.");
  console.log("Worker size: " + rawKiB + " KiB uncompressed; " + gzipKiB + " KiB gzip.");
  if (rawKiB * 1024 > 64000000 || gzipKiB * 1024 > 3000000) stop("Worker exceeds conservative Free-plan size budget (64 MB raw / 3 MB gzip). Optimize before upload.");
  console.log("Worker bundle passed both Free-plan size budgets.");
  // Private staging only: no workers.dev or preview URLs, custom domains or routes.
  const deploy = spawnSync("./node_modules/.bin/wrangler", ["deploy","--secrets-file",file], {
    env:cloudEnv, encoding:"utf8", stdio:["ignore","pipe","pipe"], timeout:300000, maxBuffer:8*1024*1024
  });
  diagnostics(deploy, "Wrangler private deployment");
  const verify = await fetch("https://api.cloudflare.com/client/v4/accounts/" + account + "/workers/scripts", {
    headers: { Authorization: "Bearer " + token }, redirect:"error", signal:AbortSignal.timeout(30000)
  });
  if (!verify.ok) stop("Cannot verify post-deployment Worker inventory (HTTP " + verify.status + ").");
  const inventory = await verify.json();
  if (!inventory.success || !Array.isArray(inventory.result)) stop("Invalid post-deployment inventory.");
  const exists = inventory.result.some(w => w.id === target);
  console.log("Private staging Worker exists: " + (exists ? "yes" : "no"));
  if (deploy.status !== 0 || !exists) stop("Private deployment not verified; do not overwrite any existing resource.");
  console.log("Private staging Worker deployed. Public preview requires separate access protection review.");
  console.log("DNS unchanged. Production rollout requires smoke tests and explicit release.");
}
try { await main(); } catch { if(!process.exitCode) { console.error("Staging operation failed; no success assumed."); process.exitCode=1; } } finally { if(dir) rmSync(dir,{recursive:true,force:true}); }
