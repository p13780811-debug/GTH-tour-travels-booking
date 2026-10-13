/** External, read-only route smoke monitor. Never logs cookies, credentials or personal data. */
const base=(process.env.GTH_PRO_MONITOR_URL||"https://gth-pro.vercel.app").replace(/\/$/,"");
const url=new URL(base);
if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)throw new Error("Monitor requires a clean HTTPS base URL");
const paths=["/mega-aggregator","/travel","/real-estate","/tender","/partners","/contact"];
let failed=false;
for(const path of paths){
 try{
   const response=await fetch(base+path,{method:"GET",redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(12000)});
   const passed=response.status>=200&&response.status<400;
   console.log(`${passed?"PASS":"FAIL"} · ${path} · HTTP ${response.status}`);
   if(!passed)failed=true;
 }catch{failed=true;console.error(`FAIL · ${path} · request unsuccessful`);}
}
console.log("This checks route responses only, not credentials, bookings, data accuracy or usability.");
if(failed)process.exitCode=1;
