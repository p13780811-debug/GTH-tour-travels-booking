/* Public read-only GTH PRO pre-traffic audit. No credentials, submissions, account actions, or mutations.
 * Crawls submitted public sitemap pages plus key journeys in a real Chromium browser.
 * Production may lag the latest GitHub main: keep this distinction in every report.
 */
import { chromium, devices } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const ORIGIN = (process.env.GTH_AUDIT_ORIGIN || "https://www.gthproglobal.com").replace(/\/$/, "");
if (new URL(ORIGIN).protocol !== "https:" || !/^https:\/\/(?:www\.)?gthproglobal\.com$/.test(ORIGIN)) {
  throw new Error("Audit must target approved GTH PRO public HTTPS domain");
}
const timeout = 22000;
const outdir = "audit-results";
mkdirSync(outdir, {recursive:true});
const candidates = [
  "/", "/mega-aggregator", "/travel", "/flights", "/hotels", "/hotels/results",
  "/tours", "/destinations", "/guides", "/blog", "/tender", "/real-estate",
  "/transfers", "/cars", "/insurance", "/train", "/bus", "/contact", "/about",
  "/partners", "/activities", "/affiliate-disclosure", "/terms-and-conditions",
  "/privacy-policy", "/refund-policy"
];
const clean = s => (s||"").replace(/\s+/g," ").trim().slice(0,180);
async function fetchPage(path) {
  try {
    const res = await fetch(ORIGIN+path, {headers:{"User-Agent":"GTH-Public-ReadOnly-QualityAudit/1.0"},redirect:"follow",signal:AbortSignal.timeout(timeout)});
    return {status:res.status, finalUrl:res.url, body: await res.text(), headers:res.headers};
  } catch(e) {
    return {status:0, error:String(e).slice(0,180), body:""};
  }
}
function metadata(html) {
  const title=clean(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]);
  const desc=clean(html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]);
  const canonical=(html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i)?.[1]||"").replace(/&amp;/g,"&");
  const robots=html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i)?.[1]||"";
  const h1=(html.match(/<h1\\b[^>]*>([\\s\\S]*?)<\\/h1>/i)?.[1]||"").replace(/<[^>]*>/g," ");
  const lang=html.match(/<html[^>]*\slang="([^"]*)"/i)?.[1]||"";
  return {title,description:desc,canonical,robots,h1:clean(h1),lang};
}
const site=await fetchPage("/sitemap.xml");
const robots=await fetchPage("/robots.txt");
const rawUrls=[...site.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1].replace(/&amp;/g,"&"));
const submitted=[];
for(const u of rawUrls) {
  try {
    const parsed=new URL(u);
    if (parsed.origin===new URL(ORIGIN).origin && !parsed.search) submitted.push(parsed.pathname);
  } catch {}
}
const urls=[...new Set([...submitted,...candidates])];
async function mapLimit(items,limit,fn){
  const results=new Array(items.length);let next=0;
  await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
    for(;;){const i=next++;if(i>=items.length)return;results[i]=await fn(items[i],i);}
  }));
  return results;
}
const httpRows=await mapLimit(urls,6,async path=>{
  const p=await fetchPage(path);
  const meta=metadata(p.body);
  const issues=[];
  if(!p.status || p.status>=400)issues.push("HTTP_"+p.status);
  if(p.status===200 && /text\/html/.test(p.headers?.get("content-type")||"")){
    if(!meta.title)issues.push("NO_TITLE");
    if(!meta.description)issues.push("NO_DESCRIPTION");
    if(!meta.canonical)issues.push("NO_CANONICAL");
    if(/noindex|nofollow/i.test(meta.robots))issues.push("NOINDEX");
    if(!meta.h1)issues.push("NO_H1_IN_SERVER_HTML");
    if(meta.canonical && new URL(meta.canonical,ORIGIN).origin!==new URL(ORIGIN).origin)issues.push("OTHER_CANONICAL_DOMAIN");
  }
  return {path,inSitemap:submitted.includes(path),status:p.status,finalUrl:p.finalUrl,error:p.error||"",...meta,issues};
});
console.log("HTTP_AUDIT_SUMMARY",JSON.stringify({origin:ORIGIN,sitemapStatus:site.status,sitemapUrls:submitted.length,robotsStatus:robots.status,totalChecked:httpRows.length,failures:httpRows.filter(x=>x.issues.length).length}));
for(const v of httpRows)console.log("HTTP_AUDIT_ROUTE",JSON.stringify({...v,description:v.description?.slice(0,110)}));
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const pagesToAudit=[
  "/", "/mega-aggregator", "/travel", "/flights", "/flights?flightSearch=CCU2010BOM1",
  "/hotels", "/hotels/results", "/tours", "/tender", "/real-estate",
  "/destinations", "/blog", "/transfers", "/cars", "/insurance", "/train", "/bus",
  "/contact", "/partners", "/activities", "/guides"
];
async function inspect(path,mode){
  const mobile=mode==="mobile";
  const ctx=await browser.newContext({
    viewport:mobile?{width:390,height:844}:{width:1366,height:768},
    ...(mobile?{isMobile:true,hasTouch:true,deviceScaleFactor:1}:{}),
    ignoreHTTPSErrors:false
  });
  const page=await ctx.newPage();
  const errors=[];
  const consoleErrors=[];
  const resources={imagesFailed:0,requestsFailed:0};
  page.on("pageerror",e=>{if(errors.length<6)errors.push(clean(e.message))});
  page.on("console",m=>{if(m.type()==="error"&&consoleErrors.length<4)consoleErrors.push(clean(m.text()))});
  page.on("requestfailed", req=>{
    if(req.resourceType()==="image")resources.imagesFailed++;
    else if(req.resourceType()!=="font")resources.requestsFailed++;
  });
  let status=0;let fail="";
  const started=Date.now();
  try{
    const response=await page.goto(ORIGIN+path,{waitUntil:"domcontentloaded",timeout:30000});
    status=response?.status()||0;
    await page.waitForTimeout(path.startsWith("/flights")?3500:1500);
  }catch(e){fail=clean(String(e));}
  const ms=Date.now()-started;
  let data={};
  try{
    data=await page.evaluate(()=>{
      const s=q=>document.querySelector(q);
      const isVisible=e=>!!e&&e.getClientRects().length&&getComputedStyle(e).visibility!=="hidden"&&getComputedStyle(e).display!=="none";
      const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {left:Math.round(r.left),right:Math.round(r.right),height:Math.round(r.height),width:Math.round(r.width)}};
      const main=s("main");
      const links=[...document.querySelectorAll("a[href]")];
      const brokenImages=[...document.images].filter(e=>e.complete && e.naturalWidth===0).map(e=>(e.getAttribute("src")||"").slice(0,110)).slice(0,8);
      const missingAlt=[...document.images].filter(e=>!e.hasAttribute("alt")).length;
      const unlabeledInputs=[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(e=>!e.getAttribute("aria-label")&&!e.getAttribute("aria-labelledby")&&!e.id&&!e.closest("label")).length;
      const unlabeledButtons=[...document.querySelectorAll("button")].filter(e=>isVisible(e)&&!e.getAttribute("aria-label")&&!e.getAttribute("title")&&!e.textContent?.trim()).length;
      const headings=[...document.querySelectorAll("h1")].filter(isVisible).map(e=>e.textContent?.trim().slice(0,120));
      const nav=s('[data-gth-shared-nav]');
      const fullScroll=document.documentElement.scrollWidth;
      const vw=window.innerWidth;
      const smallTap=[...document.querySelectorAll('button,a[href]')].filter(isVisible).filter(e=>{
        const r=e.getBoundingClientRect();
        return r.width>0&&r.height>0&&r.height<32&&r.width<32&&r.top>=0&&r.top<window.innerHeight;
      }).length;
      const linksBlank=links.filter(a=>['#','javascript:void(0)',''].includes(a.getAttribute("href")||"")).length;
      const thirdPartyUnsafe=links.filter(a=>a.target==="_blank"&&!/\bnoopener\b/.test(a.rel)).length;
      const navLogo=s('nav img[alt*="GTH"]');
      const navRect=rect(nav);
      return {
        title:document.title.slice(0,130),
        canonical:s('link[rel="canonical"]')?.getAttribute("href")||"",
        robots:s('meta[name="robots"]')?.getAttribute("content")||"",
        h1:headings.slice(0,3),h1Count:headings.length,
        bodyTextLength:(main?.innerText||document.body.innerText||"").length,
        viewport:vw,scrollWidth:fullScroll,overflowPx:Math.max(0,fullScroll-vw),
        sharedNav:navRect,navRightOverflow:navRect?Math.max(0,navRect.right-vw):0,
        navLogo:!!navLogo,brokenImages,missingAlt,unlabeledInputs,unlabeledButtons,
        smallTap,linksBlank,thirdPartyUnsafe,
        mainLinks:links.length,firstCtas:links.filter(isVisible).slice(0,12).map(a=>({text:(a.innerText||a.getAttribute('aria-label')||"").trim().slice(0,38),href:(a.getAttribute("href")||"").slice(0,135)})),
        whiteLabel:!!s("#tpwl-search"),
        wlControls:s("#tpwl-search")?.querySelectorAll('input,button,select').length||0,
        hostFlightLoading:document.body.innerText.includes("Loading flight search"),
        hotelCount:document.body.innerText.match(/(?:\d{1,3}(?:,\d{3})* hotels)/i)?.[0]||""
      };
    });
  }catch(e){fail+= " JS_"+clean(String(e));}
  const entry={path,mode,status,elapsedMs:ms,error:fail,...data,pageErrors:errors,consoleErrors,requestFailures:resources};
  if(["/","/flights","/hotels","/tours","/tender","/real-estate","/mega-aggregator","/transfers"].includes(path)){
    try{const name=(path==="/ "?"home":path.replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"")||"home");
      await page.screenshot({path:outdir+"/"+name+"-"+mode+".jpg",type:"jpeg",quality:72,fullPage:false,timeout:15000});
    }catch{}
  }
  await ctx.close();
  console.log("BROWSER_AUDIT_ROUTE",JSON.stringify(entry));
  return entry;
}
const tasks=pagesToAudit.flatMap(path=>["desktop","mobile"].map(mode=>({path,mode})));
const browserRows=await mapLimit(tasks,3,async task=>inspect(task.path,task.mode));
await browser.close();
const issues=[];
for(const row of httpRows){for(const issue of row.issues)issues.push({source:"http",path:row.path,issue});}
for(const row of browserRows){
  if(row.error||row.status>=400||row.status===0)issues.push({source:"browser",path:row.path,mode:row.mode,issue:"LOAD_"+row.status,details:row.error});
  if(row.overflowPx>8)issues.push({source:"browser",path:row.path,mode:row.mode,issue:"HORIZONTAL_OVERFLOW",pixels:row.overflowPx});
  if(row.navRightOverflow>5)issues.push({source:"browser",path:row.path,mode:row.mode,issue:"NAV_CLIPPED",pixels:row.navRightOverflow});
  if(row.h1Count===0)issues.push({source:"browser",path:row.path,mode:row.mode,issue:"NO_VISIBLE_H1"});
  if(row.brokenImages?.length)issues.push({source:"browser",path:row.path,mode:row.mode,issue:"BROKEN_IMAGES",sample:row.brokenImages});
  if(row.hostFlightLoading)issues.push({source:"browser",path:row.path,mode:row.mode,issue:"FLIGHT_CUSTOM_LOADING"});
  if(row.unlabeledButtons>0)issues.push({source:"browser",path:row.path,mode:row.mode,issue:"UNLABELED_BUTTONS",count:row.unlabeledButtons});
}
const summary={origin:ORIGIN,at:new Date().toISOString(),sitemapStatus:site.status,sitemapUrls:submitted.length,
  checkedHttp:httpRows.length,browserJourneys:browserRows.length,issues:issues.length,issuesByType:issues.reduce((o,x)=>(o[x.issue]=(o[x.issue]||0)+1,o),{})};
const report={summary,issues,http:httpRows,browser:browserRows};
writeFileSync(outdir+"/report.json",JSON.stringify(report,null,2));
writeFileSync(outdir+"/summary.md",[
"# GTH PRO Public UX/SEO Pre-traffic Audit",
"Audit date: "+summary.at,"Target: "+ORIGIN,
"Read-only: no form submissions, bookings, or login actions.",
"Production may lag GitHub main. These are observations of the public domain only.",
"",
"## Coverage",
"Sitemap URLs: "+summary.sitemapUrls+", HTTP checked: "+summary.checkedHttp+", Chromium desktop+mobile: "+summary.browserJourneys,
"",
"## Issue counts",
...Object.entries(summary.issuesByType).map(([k,v])=>"- "+k+": "+v),
"",
"## HTTP and SEO issues",
...issues.filter(x=>x.source==="http").map(x=>"- "+x.path+" — "+x.issue),
"",
"## Browser/layout issues",
...issues.filter(x=>x.source==="browser").map(x=>"- "+x.path+" ("+x.mode+") — "+x.issue+(x.pixels?" "+x.pixels+"px":"")),
"","## Notes",
"- A sitemap submission count is not equivalent to Google's indexed-page count.",
"- Vendor-provided hotel/ticket prices and partner checkout cannot be validated without authorized provider transactions.",
"- Accessibility heuristics here are incomplete; perform full axe and human keyboard/screen-reader checks before a formal WCAG compliance claim."
].join("\n"));
console.log("PUBLIC_SITE_AUDIT_FINAL",JSON.stringify(summary));
console.log("PUBLIC_SITE_AUDIT_ISSUES",JSON.stringify(issues.slice(0,160)));
