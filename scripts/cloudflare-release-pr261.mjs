// Trusted release operator only. Never run this with secrets in a pull_request job.
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
const publicRelease=process.env.GTH_CF_DEPLOY_TARGET==="production-release";
const productionCandidate=publicRelease||process.env.GTH_CF_DEPLOY_TARGET==="production-candidate";
const target=productionCandidate?"gth-pro-production":"gth-pro-preview-20261126";
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
  values.GTH_PUBLIC_LAUNCH_ENABLED=productionCandidate?"true":"false";
  values.GTH_RATE_LIMIT_NAMESPACE=productionCandidate?"gth-pro-cloudflare-production":"gth-pro-cloudflare-preview";
  values.GTH_CLOUDFLARE_INGRESS="1";
  values.GTH_INGESTION_ENABLED = "false";
  values.VERCEL_ENV=productionCandidate?"production":"preview"; // Existing SEO and budget code uses this environment label, not VERCEL=1.
  if (Object.keys(values).length > 64) stop("Worker free-tier environment limit exceeded.");
  const response = await fetch("https://api.cloudflare.com/client/v4/accounts/" + account + "/workers/scripts", {
    headers: { Authorization: "Bearer " + token }, redirect: "error", signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) stop("Cannot verify staging target (HTTP " + response.status + ").");
  const data = await response.json();
  if (!data.success || !Array.isArray(data.result)) stop("Invalid Cloudflare target inventory response.");
  const existingCandidate=productionCandidate?data.result.find(w=>w.id===target):undefined;
  // Explicitly authorized isolated-candidate redeploy only. Public Workers are never overwritten by this workflow.
  if(existingCandidate&&!publicRelease&&process.env.GTH_CF_ALLOW_ISOLATED_REDEPLOY!=="1") stop("Production candidate already exists; refusing to overwrite.");
  if(publicRelease&&!existingCandidate) stop("Production Worker missing; no create or cutover.");
  if(existingCandidate&&!existingCandidate.modified_on) stop("Cannot establish existing candidate revision.");
  if(!productionCandidate&&!data.result.some(w=>w.id===target)) stop("Expected existing protected preview Worker is missing.");
  const cfRead = async path => {
    const r = await fetch("https://api.cloudflare.com/client/v4/accounts/" + account + path, {
      headers:{Authorization:"Bearer "+token}, redirect:"error", signal:AbortSignal.timeout(30000)
    });
    if(!r.ok) stop("Cannot verify preview protection: HTTP "+r.status);
    const d=await r.json(); if(!d.success) stop("Preview protection inventory rejected.");
    return d.result;
  };
  const releasePatterns=["gthproglobal.com/*","www.gthproglobal.com/*"];
  let previousVersion;
  const activeVersion=async()=>{
    const d=await cfRead("/workers/scripts/"+target+"/deployments");
    const list=d?.deployments;
    if(!Array.isArray(list)||!list.length)stop("Cannot verify active deployment.");
    const versions=list[0]?.versions;
    if(!Array.isArray(versions)||versions.length!==1||versions[0].percentage!==100||!/^[0-9a-f-]{36}$/i.test(versions[0].version_id||""))stop("Expected one active production version.");
    return versions[0].version_id;
  };
  const verifyProtection = async (afterUpload=false) => {
    if(productionCandidate){
      const scripts=await cfRead("/workers/scripts");
      const domains=await cfRead("/workers/domains");
      if(!Array.isArray(scripts)||!Array.isArray(domains)||domains.some(d=>d.service===target)) stop("Production candidate custom-domain isolation not verified.");
      const current=scripts.find(w=>w.id===target);
      if(!afterUpload&&Boolean(current)!==Boolean(existingCandidate)) stop("Production candidate inventory changed during build.");
      if(!afterUpload&&current&&current.modified_on!==existingCandidate.modified_on) stop("Production candidate revision changed during build.");
      if(current||afterUpload){
        const worker=await cfRead("/workers/workers/"+target);
        const sub=await cfRead("/workers/scripts/"+target+"/subdomain");
        if(!current||worker?.name!==target||sub?.enabled!==false||sub?.previews_enabled!==false) stop("Production candidate URL isolation not verified.");
      }
      // Verify routes in every accessible account zone, without mutating DNS.
      const zoneResponse=await fetch("https://api.cloudflare.com/client/v4/zones?account.id="+account+"&per_page=50",{
        headers:{Authorization:"Bearer "+token},redirect:"error",signal:AbortSignal.timeout(30000)
      });
      if(!zoneResponse.ok) stop("Cannot verify account zone inventory: HTTP "+zoneResponse.status);
      const zoneData=await zoneResponse.json();
      if(!zoneData.success||!Array.isArray(zoneData.result)||zoneData.result_info?.total_pages>1||!zoneData.result.some(z=>z.name==="gthproglobal.com"&&z.account?.id===account)) stop("Incomplete zone inventory; candidate isolation unverified.");
      for(const zone of zoneData.result){
        if(!/^[0-9a-f]{32}$/i.test(zone.id)||zone.account?.id!==account) stop("Unexpected zone identity.");
        const routeResponse=await fetch("https://api.cloudflare.com/client/v4/zones/"+zone.id+"/workers/routes",{
          headers:{Authorization:"Bearer "+token},redirect:"error",signal:AbortSignal.timeout(30000)
        });
        if(!routeResponse.ok) stop("Cannot verify Worker route isolation: HTTP "+routeResponse.status);
        const routeData=await routeResponse.json();
        if(!routeData.success||!Array.isArray(routeData.result)||routeData.result_info?.total_pages>1) stop("Incomplete route inventory.");
        const bound=routeData.result.filter(r=>r.script===target);
        if(publicRelease){
          const expected=zone.name==="gthproglobal.com"?releasePatterns:[];
          if(bound.length!==expected.length||expected.some(pattern=>!bound.some(r=>r.pattern===pattern)))stop("Production routes changed; release refused.");
        }else if(bound.length)stop("Public Worker route exists; no isolated redeploy.");
      }
      if(publicRelease){
        const version=await activeVersion();
        if(!previousVersion){
          previousVersion=version;
          writeFileSync(join(process.env.RUNNER_TEMP,"gth-release-previous-version"),version,{mode:0o600,flag:"wx"});
        }else if(!afterUpload&&version!==previousVersion)stop("Active production version changed during build.");
        else if(afterUpload&&version===previousVersion)stop("New version not active.");
        if(afterUpload)writeFileSync(join(process.env.RUNNER_TEMP,"gth-release-new-version"),version,{mode:0o600,flag:"wx"});
        console.log("Production route and version gates verified; public routes unchanged.");
      }else console.log("Production candidate isolation verified; no public routes or preview URLs.");
      return;
    }
    const worker=await cfRead("/workers/workers/"+target);
    if(worker?.name!==target) stop("Unexpected Worker identity.");
    const sub=await cfRead("/workers/scripts/"+target+"/subdomain");
    if(sub?.enabled!==true || sub?.previews_enabled!==false) stop("Unexpected preview URL settings.");
    const domains=await cfRead("/workers/domains");
    if(!Array.isArray(domains) || domains.some(d=>d.service===target)) stop("Unexpected custom-domain association.");
    const apps=await cfRead("/access/apps?per_page=100");
    const matches=Array.isArray(apps)?apps.filter(a=>a.name==="GTH PRO private preview 20261126"&&a.destinations?.some(d=>d.type==="worker"&&d.worker_id===worker.id)):[];
    if(matches.length!==1) stop("Expected isolated Access application missing.");
    const policies=await cfRead("/access/apps/"+matches[0].id+"/policies");
    if(!Array.isArray(policies)||policies.length!==1||policies[0].decision!=="allow"||policies[0].include?.length!==1||!policies[0].include[0].email?.email) stop("Unexpected preview policy; no overwrite.");
    const challenge=await fetch("https://gth-pro-preview-20261126.p13780811.workers.dev/",{redirect:"manual",signal:AbortSignal.timeout(20000)});
    const location=new URL(challenge.headers.get("location")||"https://invalid.invalid");
    if(challenge.status!==302||!location.hostname.endsWith(".cloudflareaccess.com")) stop("Anonymous Access challenge not verified.");
    await challenge.body?.cancel();
    console.log("Existing owner-only preview and URL verified; no custom domain attached.");
  };
  await verifyProtection();
  if (!existsSync("wrangler.jsonc") || !existsSync("open-next.config.ts")) stop("Missing tested Worker config.");
  const config = JSON.parse((await import("node:fs")).readFileSync("wrangler.jsonc", "utf8"));
  if (config.name !== target || (publicRelease?("routes" in config||"route" in config):config.routes?.length) || config.workers_dev !== !productionCandidate || config.preview_urls !== false) stop("Unexpected staging Worker configuration.");
  const pub = Object.fromEntries(Object.entries(values).filter(([k])=>k.startsWith("NEXT_PUBLIC_")));
  console.log("Staging inventory validated. Running real-config build with public variables only.");
  // Adapt only the original Edge runtime declarations in this disposable checkout.
  // Keep every route, component, API and original rendering implementation intact.
  const { readFileSync: readSource } = await import("node:fs");
  const adaptations = [
    ["src/app/app-icon/[size]/route.ts", 'export const runtime="edge";', 'export const runtime="nodejs";', "11a6cce4e49dda95070dd8250759a48a92ffa671"],
    ["src/app/intelligence/page.tsx", 'export const runtime = "edge";', 'export const runtime = "nodejs";', "101e0bc46d7ae0438082d5821177a58fac770fbf"],
  ];
  const originals = new Map();
  for (const [path, before, after, hash] of adaptations) {
    const check = spawnSync("git", ["hash-object", path], {encoding:"utf8"});
    if (check.status !== 0 || check.stdout.trim() !== hash) stop("Unexpected original route revision: " + path);
    const source = readSource(path, "utf8");
    if (source.split(before).length !== 2) stop("Unexpected runtime declaration: " + path);
    originals.set(path, source);
  }
  let build;
  try {
    for (const [path,before,after] of adaptations) writeFileSync(path, originals.get(path).replace(before,after));
    build = spawnSync("./node_modules/.bin/opennextjs-cloudflare", ["build"], {
      env: {...base, ...pub, GTH_CLOUDFLARE_EXTERNALS_PROBE:"1", GTH_PUBLIC_LAUNCH_ENABLED:values.GTH_PUBLIC_LAUNCH_ENABLED, VERCEL_ENV:values.VERCEL_ENV},
      stdio: "inherit", timeout: 1200000
    });
  } finally {
    for (const [path,source] of originals) writeFileSync(path,source);
  }
  const integrity = spawnSync("git", ["diff","--exit-code","--","src","tests"], {stdio:"ignore"});
  if (integrity.status !== 0) stop("Application source integrity check failed.");
  if (build.status !== 0 || !existsSync(".open-next/worker.js")) stop("Real-config build failed. No deployment attempted.");
  const shells=spawnSync(process.execPath,["scripts/cloudflare-prepare-static-shells.mjs"],{env:base,stdio:"inherit"});
  if(shells.status!==0)stop("Static shell preparation failed. No deployment attempted.");
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
  const { readdirSync, statSync, readFileSync } = await import("node:fs");
  const { gzipSync } = await import("node:zlib");
  const { relative } = await import("node:path");
  const auditRoot = ".open-next/server-functions/default";
  if (!existsSync(auditRoot)) stop("Missing OpenNext default server function for audit.");
  const files = [];
  function scan(root) {
    for (const entry of readdirSync(root, {withFileTypes:true})) {
      const p = join(root, entry.name);
      if (entry.isDirectory()) scan(p);
      else if (entry.isFile()) files.push({path:p, bytes:statSync(p).size});
    }
  }
  scan(auditRoot);
  console.log("Top 15 OpenNext server files by raw bytes (individual gzip is not additive):");
  for (const f of files.sort((a,b)=>b.bytes-a.bytes || a.path.localeCompare(b.path)).slice(0,15)) {
    console.log(JSON.stringify({file:relative(auditRoot,f.path), rawBytes:f.bytes, standaloneGzipBytes:gzipSync(readFileSync(f.path)).length}));
  }
  const metafile = join(dir,"worker-metafile.json");
  const dryRun = spawnSync("./node_modules/.bin/wrangler", ["deploy","--dry-run","--metafile",metafile], {
    env:base, encoding:"utf8", stdio:["ignore","pipe","pipe"], timeout:300000, maxBuffer:8*1024*1024
  });
  diagnostics(dryRun, "Wrangler dry run");
  if (dryRun.status !== 0) stop("Dry run failed. No remote upload attempted.");
  if (!existsSync(metafile)) stop("Wrangler metafile missing; no upload attempted.");
  const meta = JSON.parse(readFileSync(metafile,"utf8"));
  const contributions = new Map();
  for (const output of Object.values(meta.outputs || {})) {
    for (const [name, input] of Object.entries(output.inputs || {})) {
      contributions.set(name,(contributions.get(name)||0)+input.bytesInOutput);
    }
  }
  if (!contributions.size) stop("No module contributions in Wrangler metafile.");
  console.log("Top 15 Wrangler inputs by emitted raw bytes (not individual compressed contributions):");
  for (const [name,bytes] of [...contributions].sort((a,b)=>b[1]-a[1]).slice(0,15)) {
    console.log(JSON.stringify({file:name.replaceAll(process.cwd()+"/",""), bytesInOutput:bytes}));
  }
  // Cloudflare removed the gzip platform limit on 2026-09-04. The current platform
  // cap is 64 MiB uncompressed for both staging and production. Gzip is diagnostic only.
  // https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/
  const sizeMatch = (String(dryRun.stdout || "") + "\n" + String(dryRun.stderr || "")).match(/Total Upload:\s*([\d.]+)\s*KiB\s*\/\s*gzip:\s*([\d.]+)\s*KiB/i);
  if (!sizeMatch) stop("Cannot confirm compressed and uncompressed bundle sizes. No upload attempted.");
  const rawKiB = Number(sizeMatch[1]), gzipKiB = Number(sizeMatch[2]);
  if (!Number.isFinite(rawKiB) || !Number.isFinite(gzipKiB)) stop("Invalid Worker size measurement.");
  console.log("Worker size: " + rawKiB + " KiB uncompressed; " + gzipKiB + " KiB gzip.");
  if ((rawKiB + 0.005) * 1024 > 64 * 1024 * 1024) stop("Worker exceeds Cloudflare platform limit of 64 MiB uncompressed.");
  console.log("Worker bundle passed current platform size limit.");
  // Existing protected workers.dev endpoint only; no version preview URLs or custom domains.
  await verifyProtection();
  if(publicRelease)writeFileSync(join(process.env.RUNNER_TEMP,"gth-release-upload-attempted"),"1",{mode:0o600,flag:"wx"});
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
  await verifyProtection(true);
  console.log((publicRelease?"PUBLIC_PRODUCTION_RELEASE_DEPLOYED":productionCandidate?"Isolated production candidate deployed; no public URL.":"Protected preview redeployed; Access challenge retained.")+" Source commit: "+process.env.GITHUB_SHA);
  console.log("DNS unchanged. Production rollout requires smoke tests and explicit release.");
}
try { await main(); } catch { if(!process.exitCode) { console.error("Staging operation failed; no success assumed."); process.exitCode=1; } } finally { if(dir) rmSync(dir,{recursive:true,force:true}); }
