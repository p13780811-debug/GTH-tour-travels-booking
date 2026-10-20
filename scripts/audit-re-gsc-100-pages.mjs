#!/usr/bin/env node
// READ-ONLY production Real Estate SEO inspection. No browser auth, writes or deployments.
// Sampling source: public consolidated sitemap index -> property XML shards -> 100 URLs.
// Keep requests low-concurrency and slow enough for a Hobby-tier deployment.
import { writeFile, mkdir } from "node:fs/promises";

const DOMAIN = "https://www.gthproglobal.com";
const COUNT = 100;
const TIMEOUT = 24000;
const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
const decode = s => s.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">");
function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1]));
}
async function get(url, attempts=2) {
  const u = new URL(url);
  if (u.origin !== DOMAIN) throw new Error("Cross-origin URL blocked");
  for(let i=0;i<attempts;i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(u,{redirect:"follow",signal:controller.signal,headers:{"User-Agent":"GTHPRO-Internal-RE-SEO-Audit/1.0"}});
      const target=new URL(response.url);
      if(target.origin!==DOMAIN) throw new Error("Cross-origin redirect");
      if(!response.ok) throw new Error("HTTP "+response.status);
      const body=await response.text();
      return {body,headers:response.headers,finalUrl:response.url};
    } catch(e) {
      if(i+1>=attempts) throw e;
      await delay(750*(i+1));
    } finally {clearTimeout(timer);}
  }
}
const headTag = html => html.split("</head>")[0]||html.slice(0,250000);
function meta(head,name) {
 const tags=[...head.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
 const t=tags.find(v=>new RegExp("(?:name|property)=[\"']"+name+"[\"']","i").test(v));
 return t?.match(/\bcontent=["']([^"']*)["']/i)?.[1]||"";
}
function canonical(head) {
 const tags=[...head.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]);
 const link=tags.find(v=>/rel=["']canonical["']/i.test(v));
 return link?.match(/href=["']([^"']+)["']/i)?.[1]||null;
}
const {body:idx}=await get(DOMAIN+"/sitemap-index.xml");
const shards=locs(idx).filter(x=>/^https:\/\/www\.gthproglobal\.com\/seo-sitemaps\/properties\/\d+\.xml$/.test(x));
if(!shards.length) throw new Error("Property sitemap shards absent from live index");
const pools=[];
for(const shard of shards) {
 const {body:xml}=await get(shard);
 const urls=locs(xml).filter(x=>/^https:\/\/www\.gthproglobal\.com\/real-estate\/[a-z0-9-]+$/.test(x));
 pools.push(urls);
 await delay(170);
}
const set=new Set();
const urls=[];
for(let i=0;urls.length<COUNT && i<COUNT;i++){
 for(let s=0;s<pools.length && urls.length<COUNT;s++){
  const pool=pools[s];
  if(!pool.length)continue;
  const at=Math.min(pool.length-1,Math.floor((i+0.5)*pool.length/Math.ceil(COUNT/shards.length)));
  const url=pool[at];
  if(!set.has(url)){set.add(url);urls.push(url);}
 }
}
if(urls.length<COUNT)throw new Error("Could not select "+COUNT+" distinct sampled project URLs: "+urls.length);
const results=[];
let cursor=0;
async function worker() {
 while(cursor<urls.length){
  const index=cursor++;
  const url=urls[index];
  try {
   const {body,headers,finalUrl}=await get(url);
   const head=headTag(body);
   const c=canonical(head);
   const robot=meta(head,"robots");
   const title=head.match(/<title>([^<]*)<\/title>/i)?.[1]||"";
   const row={
    url,ok:finalUrl===url && c===url && Boolean(title) && !/\bnoindex\b/i.test(robot),
    canonical:c,robots:robot,title,
    status:200,locationOk:finalUrl===url,
    emptyProjectPhoto:/project photo not available|No approved project-specific photographs/i.test(body),
    unsupportedCommercialTitle:/Floor Plans, Price/i.test(title),
    hasRegistryNotice:/registry record/i.test(body),
    validHtml:/<html\b/i.test(body),hasRera:/P\d{11}/.test(body),
    xRobotsTag:headers.get("x-robots-tag")||null,
   };
   row.ok=row.ok && row.validHtml && row.hasRera && !/\bnoindex\b/i.test(row.xRobotsTag||"");
   results[index]=row;
  }catch(e){results[index]={url,ok:false,error:String(e),status:0};}
  await delay(400);
 }
}
await Promise.all([worker(),worker()]);
const summary={
 scanned:results.length,
 sampledFromSitemapShards:shards.length,
 shardPoolSizes:pools.map(x=>x.length),
 technicalPass:results.filter(r=>r.ok).length,
 technicalFail:results.filter(r=>!r.ok).length,
 titlesMentionFloorPlanAndPrice:results.filter(r=>r.unsupportedCommercialTitle).length,
 photoUnavailableMessages:results.filter(r=>r.emptyProjectPhoto).length,
 registryNoticeFound:results.filter(r=>r.hasRegistryNotice).length,
 note:"A successful HTTP/canonical test does NOT establish Google indexing, useful original page content, rights, real inventory or search clicks.",
 scannedAt:new Date().toISOString(),
 results,
};
await mkdir("tmp",{recursive:true});
await writeFile("tmp/re-gsc-100-url-audit.json",JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify({...summary,results:undefined},null,2));
if(summary.technicalFail>0) {
 console.error("Failed URLs:\n"+results.filter(r=>!r.ok).map(r=>JSON.stringify(r)).join("\n"));
 process.exitCode=1;
}
