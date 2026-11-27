import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";
const base="http://127.0.0.1:3000",folder="/tmp/gth-luxury-app-qa";
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const routes=["/app","/app/travel","/app/hotels","/app/flights","/app/packages","/app/destinations","/app/destinations/tokyo","/app/property","/app/tenders","/app/services/tickets","/app/services/stadiums","/app/services/transport","/app/venues/melbourne-cricket-ground","/app/venues/wankhede-stadium"];
try{
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{if(!localStorage.getItem("theme-mode"))localStorage.setItem("theme-mode","day");});
  // QA is local only; no third-party booking, AI or rates requests.
  await context.route("**/*",r=>{const url=new URL(r.request().url());return ["127.0.0.1","localhost"].includes(url.hostname)?r.continue():r.abort();});
  const page=await context.newPage();
  for(const path of routes){
   const errors=[];const errorHandler=e=>errors.push(String(e));page.on("pageerror",errorHandler);
   const res=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:90000});assert.equal(res.status(),200,path);
   const header=page.getByRole("link",{name:"GTH PRO Home",exact:true});await header.waitFor();
   const nav=page.getByRole("navigation",{name:"GTH PRO app navigation",exact:true});assert.equal(await nav.count(),1,path);
   const toggle=page.getByRole("button",{name:/Switch to (day|night) theme/});await toggle.waitFor();
   for(const mode of ["day","night"]){
    const desired=mode==="night";
    if(await page.evaluate(()=>document.documentElement.classList.contains("dark"))!==desired)await toggle.click();
    await page.waitForFunction(d=>document.documentElement.classList.contains("dark")===d,desired);
    const metrics=await page.evaluate(()=>{
     const canvas=document.createElement("canvas");canvas.width=canvas.height=1;const ctx=canvas.getContext("2d");
     const color=v=>{ctx.clearRect(0,0,1,1);ctx.fillStyle="#000";ctx.fillStyle=v;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data];};
     const lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
     const root=getComputedStyle(document.documentElement),fg=lum(color(root.getPropertyValue("--text").trim())),bg=lum(color(root.getPropertyValue("--bg").trim()));
     return {width:innerWidth,document:document.documentElement.scrollWidth,contrast:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)};
    });assert.ok(metrics.document<=metrics.width+2,path+" overflow "+JSON.stringify(metrics));assert.ok(metrics.contrast>=4.5,path+" text contrast "+JSON.stringify(metrics));
   }
   for(const img of await page.locator("[data-marketplace-visual] img").all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0),path+" image");}
   if(path==="/app"){const form=page.locator('form[action="/app/search"]');assert.equal(await form.count(),1);assert.ok(await page.getByRole("heading",{name:"Ask GTH AI"}).isVisible());}
   if(path.includes("/app/venues/"))assert.match(await page.getByRole("link",{name:"Find match-day stays"}).getAttribute("href"),/^\/(?:api\/hotels\/booking|hotels)/);
   assert.ok(!errors.some(e=>/hydration|did not match|Minified React error #41[0-9]/i.test(e)),path+" "+errors.join(";"));
   page.off("pageerror",errorHandler);console.log("LUXURY_APP_ROUTE_PASSED",JSON.stringify({path,width}));
   if(width===390&&["/app","/app/packages","/app/venues/melbourne-cricket-ground"].includes(path))await page.screenshot({path:folder+path.replaceAll("/","-")+".png",fullPage:true});
  }
  await context.close();
 }
 console.log("LUXURY_APP_VIEWPORT_THEME_IMAGE_CHECKS_PASSED");
}finally{await browser.close();}
