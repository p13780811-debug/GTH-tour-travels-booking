/**
 * Read-only health check against the real public GTH PRO domain.
 * Covers the three pillars and highest-intent travel journeys.
 * Does not log cookies, queries, booking details or user data.
 * HTTP 200 confirms route availability, NOT that booking works.
 */
const base=(process.env.GTH_PRO_MONITOR_URL||"https://www.gthproglobal.com").replace(/\/$/,"");
const url=new URL(base);
if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)
  throw new Error("Monitor requires a clean HTTPS base URL");
const paths=[
  "/", "/mega-aggregator", "/travel", "/flights", "/hotels", "/tours",
  "/destinations", "/guides", "/blog", "/transfers", "/cars",
  "/insurance", "/train", "/bus", "/real-estate", "/tender",
  "/partners", "/contact", "/about", "/affiliate-disclosure"
];
const timeoutMs=30000,slowMs=8000,concurrency=4;
let failures=0,slow=0;
for(let i=0;i<paths.length;i+=concurrency){
  const batch=paths.slice(i,i+concurrency);
  await Promise.all(batch.map(async path=>{
    const start=Date.now();
    try{
      const response=await fetch(base+path,{method:"GET",redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(timeoutMs)});
      const ms=Date.now()-start;
      // Do not accept redirects to the homepage as evidence of a working route.
      const isHtml=(response.headers.get("content-type")||"").toLowerCase().includes("text/html");
      const passed=response.status===200&&isHtml;
      const delay=ms>slowMs;
      if(!passed)failures++;
      if(delay)slow++;
      console.log((!passed?"FAIL":delay?"SLOW":"PASS")+" · "+path+" · HTTP "+response.status+" · "+ms+"ms"+(!isHtml?" · unexpected response type":""));
      await response.body?.cancel().catch(()=>{});
    }catch{
      failures++;
      console.error("FAIL · "+path+" · timeout/network error after "+(Date.now()-start)+"ms");
    }
  }));
}
console.log("PUBLIC_ROUTE_HEALTH · "+paths.length+" paths · "+failures+" failures · "+slow+" slow first responses (> "+slowMs+"ms)");
console.log("This checks public HTML route availability and first-response latency, not Core Web Vitals, form submissions, tickets, room inventory or confirmed provider bookings.");
if(failures)process.exitCode=1;
