import assert from "node:assert/strict";
import {mkdir,readdir} from "node:fs/promises";
import {chromium} from "playwright";
const base="http://127.0.0.1:3000",folder="/tmp/gth-package-qa";
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const pages=["/app/hotels","/app/flights","/app/property","/app/tenders","/app/destinations","/app/destinations/accra","/app/services/tickets","/app/services/stadiums","/app/services/transfers","/app/packages","/stadiums/melbourne-cricket-ground","/tickets","/travel/packages"];
async function decode(page,locator){
 for(const img of await locator.all()){
  await img.scrollIntoViewIfNeeded();
  await img.evaluate(async i=>{const until=Date.now()+15000;do{try{await i.decode();if(i.naturalWidth>0)return;}catch{}await new Promise(r=>setTimeout(r,200));}while(Date.now()<until);throw Error("Image decoding failed "+i.currentSrc);});
 }
}
async function contrast(page){
 return page.evaluate(()=>{
  const canvas=document.createElement("canvas");canvas.width=canvas.height=1;const ctx=canvas.getContext("2d",{willReadFrequently:true});
  const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map(x=>x/255);};
  const over=(fg,bg)=>fg.slice(0,3).map((x,i)=>x*fg[3]+bg[i]*(1-fg[3])).concat(1);
  const lum=c=>c.slice(0,3).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
  const nodes=[...document.querySelectorAll('[data-marketplace-hubs] p,[data-marketplace-hubs] span,[data-marketplace-services] span,[data-marketplace-services] p,[data-marketplace-hero] p,[data-marketplace-hero] span')].filter(el=>el.textContent?.trim()&&el.getBoundingClientRect().width>0);
  const root=rgba(getComputedStyle(document.documentElement).getPropertyValue("--bg").trim());
  return nodes.map(el=>{let bg=root;const ancestors=[];for(let n=el;n&&n!==document.documentElement;n=n.parentElement)ancestors.unshift(n);for(const n of ancestors){const css=getComputedStyle(n);bg=over(rgba(css.backgroundColor),bg);}const fg=over(rgba(getComputedStyle(el).color),bg);const a=lum(fg),b=lum(bg);return {text:el.textContent.trim().slice(0,45),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
 });
}
async function run(path,width,mode){
 const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,colorScheme:mode==="night"?"dark":"light"});
 await context.addInitScript(value=>{try{localStorage.setItem("theme-mode",value);}catch{}},mode);
 await context.route("**/*",r=>{const u=new URL(r.request().url());return u.hostname==="127.0.0.1"?r.continue():r.abort();});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("console",m=>{if(m.type()==="error"&&/hydration|hydrated|server rendered html|Minified React error #(?:418|423|425)/i.test(m.text()))errors.push(m.text());});
 try{
  const response=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:90000});assert.ok(response?.ok(),path);
  if(path.startsWith("/app")){
   await page.getByRole("button",{name:mode==="night"?"Switch to day theme":"Switch to night theme"}).waitFor({timeout:60000});
   await page.waitForFunction(dark=>document.documentElement.classList.contains("dark")===dark,mode==="night");
  }
  if(path==="/app"){
   const hubs=page.locator("[data-marketplace-hubs]"),services=page.locator("[data-marketplace-services]");
   await hubs.waitFor();await services.waitFor();
   assert.equal(await page.locator('form[action="/app/search"]').count(),1);
   const hero=await page.locator("[data-app-hero-shell]").boundingBox(),search=await page.locator("[data-app-floating-search]").boundingBox(),shortcuts=await page.getByRole("navigation",{name:"GTH PRO Home and Research Desk shortcuts"}).boundingBox();
   assert.ok(hero&&search&&shortcuts&&search.y<hero.y+hero.height&&search.y+search.height>hero.y+hero.height&&shortcuts.y>=search.y+search.height,"Hero/search/shortcut order or overlap changed");
   const tabs=page.getByRole("navigation",{name:"Quick travel booking"});for(const [name,href] of [["Find stays","/app/hotels"],["Match tickets","/app/services/tickets"],["Flights","/app/flights"],["Packages","/app/packages"]])assert.equal(await tabs.getByRole("link",{name,exact:true}).getAttribute("href"),href);
   assert.ok(await page.getByRole("searchbox",{name:"What would you like to find?"}).isVisible());
   assert.equal(await hubs.locator('a[href="/stadiums/melbourne-cricket-ground"]').count(),1);
   assert.equal(await services.locator('a[href="/app/packages"]').count(),1);
   assert.equal(await services.locator('a[href="/go/transport"]').count(),1);
   await decode(page,hubs.locator("img"));await decode(page,services.locator("img"));
   if(width===390){await page.getByRole("button",{name:mode==="night"?"Switch to day theme":"Switch to night theme"}).click();await page.waitForFunction(dark=>document.documentElement.classList.contains("dark")===dark,mode!=="night");await page.getByRole("button",{name:mode==="night"?"Switch to night theme":"Switch to day theme"}).click();await page.waitForFunction(dark=>document.documentElement.classList.contains("dark")===dark,mode==="night");}
  }
  if(path==="/app/destinations/accra"){await page.getByRole("heading",{name:"Accra",exact:true}).waitFor();const img=page.locator('img[src="/images/luxury/africa.webp"]');assert.ok(await img.count());await decode(page,img);const plan=page.getByRole("link",{name:"Plan flights, stays & experiences"});assert.match(await plan.getAttribute("href"),/city=Accra&country=GH/);}
  if(path==="/app/packages"){await page.locator('[data-planner-ready="true"]').waitFor({timeout:60000});assert.ok(await page.getByLabel("Planning currency").isVisible());}
  const images=path==="/app/services/transfers"?page.locator('[data-marketplace-hero] img'):page.locator('img[src*="/images/luxury/"],img[src*="%2Fimages%2Fluxury%2F"]');assert.ok(await images.count()>0,"No appropriate visuals on "+path);if(path==="/app/services/transfers")assert.ok((await images.first().getAttribute("src")).includes("transfers.jpg"),"Transfer-specific imagery required");await decode(page,images);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Overflow "+path+" "+width);
  const scores=await contrast(page);for(const score of scores)assert.ok(score.ratio>=4.5,JSON.stringify({path,width,mode,...score}));
  assert.deepEqual(errors,[],"Hydration or client exception "+path);
  if(width===390)await page.screenshot({path:folder+"/luxury-"+path.replace(/[^a-z0-9]+/gi,"-")+"-"+mode+".png",fullPage:true});
  console.log("LUXURY_MOBILE_PASS",JSON.stringify({path,width,mode,images:await images.count(),contrast:scores.length?Math.min(...scores.map(x=>x.ratio)).toFixed(2):null}));
 }catch(e){await page.screenshot({path:folder+"/luxury-failure.png",fullPage:true}).catch(()=>{});throw e;}finally{await context.close();}
}
try{
 const raw=await browser.newPage();await raw.goto(base+"/images/luxury/hero.webp",{waitUntil:"domcontentloaded",timeout:90000});for(const file of (await readdir("public/images/luxury")).filter(x=>x.endsWith(".webp"))){assert.ok(await raw.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();return i.naturalWidth>0;},"/images/luxury/"+file),file);}await raw.close();
 for(const mode of ["day","night"]){for(const width of [320,390,430])await run("/app",width,mode);for(const path of pages)await run(path,390,mode);}
 console.log("LUXURY_MARKETPLACE_IMAGES_THEMES_AND_VIEWPORTS_PASSED");
}finally{await browser.close();}
