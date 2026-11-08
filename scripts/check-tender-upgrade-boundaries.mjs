import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const baseline="8359ec6e74245817211d90d0d90828b3c7f01063";
const git=(...args)=>execFileSync("git",args,{encoding:"utf8"});
const paths=[git("diff","--name-only",baseline,"HEAD"),git("diff","--name-only","HEAD"),git("ls-files","--others","--exclude-standard")].flatMap(s=>s.trim().split("\n").filter(Boolean));
const exact=new Set(["src/lib/security/rate-limit.ts","src/app/sitemap.ts","src/app/api/admin/tender-services/route.ts","src/components/admin/TenderServicesDashboard.tsx","src/components/admin/TenderCommercialControls.tsx","vercel.json",".github/workflows/tenders-sync.yml",".github/workflows/gth-tender-portal-upgrade.yml","scripts/check-tender-upgrade-boundaries.mjs","scripts/qa-tender-portal.mjs","tests/helpers/tender-upgrade-loader.mjs"]);
const allowed=path=>exact.has(path)||["src/app/tender/","src/app/api/tender/","src/lib/tender/","src/components/tender/","scripts/tenders/"].some(prefix=>path.startsWith(prefix))||/^tests\/(?:tender-[a-z-]+\.test\.mjs|test_tender_rotation\.py)$/.test(path)||/^docs\/(?:releases\/tender-portal-audit-20261109\.md|tender-[a-z-]+\.md|tenders-global-ingestion\.md)$/.test(path);
const outside=[...new Set(paths)].filter(path=>!allowed(path));if(outside.length)throw Error("Tender release changes protected files:\n"+outside.join("\n"));
const read=path=>readFileSync(path,"utf8"),original=path=>git("show",baseline+":"+path);
const expected=JSON.parse(original("vercel.json"));expected.git.deploymentEnabled["feat/tender-decision-revenue-global-20261109"]=false;
if(JSON.stringify(expected)!==JSON.stringify(JSON.parse(read("vercel.json"))))throw Error("Only this tender branch's disabled preview may change deployment config");
const rate=read("src/lib/security/rate-limit.ts").replace(' | "tender_reads" | "tender_operations"','')
 .replace('  tender_operations: { minute: 20, day: 500, globalMinute: 120, globalDay: 5000 },\n','')
 .replace('  tender_reads: { minute: 120, day: 5000, globalMinute: 120, globalDay: 5000 },\n','');
if(rate!==original("src/lib/security/rate-limit.ts"))throw Error("Existing rate-limit policies and implementation must remain exact");
if(read("src/app/sitemap.ts")!==original("src/app/sitemap.ts").replace('"/tender", "/tender/services"','"/tender", "/tender/services", "/tender/coverage"'))throw Error("Only the tender coverage URL may extend the main sitemap");
console.log("PASS: Tender-only changes; homepage, shared theme/navigation, hotel/flight engines, Real Estate, OSM/app, SQL/RLS and existing limiter policies preserved.");
