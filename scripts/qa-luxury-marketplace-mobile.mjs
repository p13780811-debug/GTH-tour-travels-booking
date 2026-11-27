import assert from "node:assert/strict";
import {mkdir,readdir} from "node:fs/promises";
import {chromium} from "playwright";
const base="http://127.0.0.1:3000",folder="/tmp/gth-package-qa";
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const modulePhotos={travel:"/maldives-bg.jpg",hotels:"/images/mega/hotels.jpg",flights:"/images/mega/flights.jpg",tours:"/images/mega/tours.jpg",packages:"/images/cities/dubai.jpg",tickets:"/images/luxury/tickets.webp",property:"/images/real-estate.jpg",tenders:"/images/tender.jpg",transport:"/images/mega/transfers.jpg",destinations:"/images/global-city.jpg"};
const expectedSlides=[["Travel","/travel","travel"],["Hotels","/app/hotels","hotels"],["Flights","/app/flights","flights"],["Tours","/tours","tours"],["Packages","/app/packages","packages"],["Sports & events","/app/services/tickets","tickets"],["Real estate","/app/property","property"],["Tenders","/app/tenders","tenders"],["Transport","/transfers","transport"],["Destinations","/app/destinations","destinations"]];
const expectedPagePhotos={"/app/hotels":modulePhotos.hotels,"/app/flights":modulePhotos.flights,"/app/property":modulePhotos.property,"/app/tenders":modulePhotos.tenders,"/app/destinations":modulePhotos.destinations,"/app/destinations/accra":"/images/cities/cape-town.jpg","/app/services/tickets":modulePhotos.tickets,"/app/services/stadiums":modulePhotos.tickets,"/app/services/transfers":modulePhotos.transport,"/app/packages":modulePhotos.packages,"/stadiums/melbourne-cricket-ground":"/images/luxury/melbourne.webp","/tickets":modulePhotos.tickets,"/travel/packages":modulePhotos.packages,"/stadiums":modulePhotos.tickets,"/tickets/sports":modulePhotos.tickets,"/travel":modulePhotos.travel,"/flights":modulePhotos.flights,"/hotels":modulePhotos.hotels,"/destinations":modulePhotos.destinations};
const imageFor=(scope,src)=>scope.locator(`img[src="${src}"],img[src*="${encodeURIComponent(src)}"]`).filter({visible:true});
const pages=["/app/hotels","/app/flights","/app/property","/app/tenders","/app/destinations","/app/destinations/accra","/app/services/tickets","/app/services/stadiums","/app/services/transfers","/app/packages","/stadiums/melbourne-cricket-ground","/tickets","/travel/packages","/stadiums","/tickets/sports","/travel","/flights","/hotels","/destinations"];
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
  const nodes=[...document.querySelectorAll('[data-marketplace-hubs] p,[data-marketplace-hubs] span,[data-marketplace-services] span,[data-marketplace-services] p,[data-marketplace-hero] p,[data-marketplace-hero] span,[data-module-home] p,[data-module-home] span')].filter(el=>el.textContent?.trim()&&el.getBoundingClientRect().width>0);
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
   const hubs=page.locator("[data-marketplace-destinations]"),services=page.locator("[data-marketplace-services]");
   await hubs.waitFor();await services.waitFor();
   assert.equal(await page.locator('form[action="/app/search"]').count(),1);
   const hero=await page.locator("[data-app-hero-shell]").boundingBox(),photo=await page.locator("[data-app-hero-image]").boundingBox(),search=await page.locator("[data-app-floating-search]").boundingBox(),shortcuts=await page.getByRole("navigation",{name:"GTH PRO Home and Research Desk shortcuts"}).boundingBox();
   assert.ok(hero&&photo&&search&&shortcuts&&search.y<=photo.y+photo.height-24&&search.y<hero.y+hero.height&&search.y+search.height>hero.y+hero.height&&shortcuts.y>=search.y+search.height,"Hero/search/shortcut order or overlap changed");
   const tabs=page.getByRole("navigation",{name:"Quick marketplace access"});for(const [name,href] of [["Travel","/travel"],["Real estate","/app/property"],["Tenders","/app/tenders"],["Tickets","/app/services/tickets"]])assert.equal(await tabs.getByRole("link",{name,exact:true}).getAttribute("href"),href);
   assert.ok(await page.getByRole("searchbox",{name:"What would you like to find?"}).isVisible());
   assert.equal(await page.locator("[data-marketplace-hubs]").count(),0,"Sports-specific rail must not dominate global Home");
   assert.equal(await hubs.locator('a[href="/app/destinations/tokyo"]').count(),1);
   assert.equal(await services.locator('a[href="/app/packages"]').count(),1);
   assert.equal(await services.locator('a[href="/go/transport"]').count(),1);
   await decode(page,hubs.locator("img"));await decode(page,services.locator("img"));
   const carousel=page.locator("[data-app-hero-image]");
   await carousel.getByRole("button",{name:"Pause automatic hero"}).click();
   for(const [name,href,key] of expectedSlides){const tab=carousel.getByRole("button",{name:"Show "+name+" image",exact:true});await tab.click();assert.equal(await tab.getAttribute("aria-pressed"),"true");assert.equal(await carousel.locator("[data-hero-module-link]").getAttribute("href"),href);const active=carousel.locator(`[data-hero-slide="${name}"][aria-hidden="false"]`);const img=imageFor(active,modulePhotos[key]);assert.equal(await img.count(),1,"Wrong carousel photo "+name);await decode(page,img);}
   await carousel.getByRole("button",{name:"Show Travel image",exact:true}).click();
   await carousel.getByRole("button",{name:"Resume automatic hero"}).click();
   if(width===390){await page.locator("[data-app-floating-search] input[name=q]").focus();await page.waitForFunction(()=>document.querySelector("[data-app-hero-image] [data-hero-slide][aria-hidden=false]")?.getAttribute("data-hero-slide")!=="Travel",null,{timeout:10000});}
   console.log("ALL_TEN_HERO_IMAGE_LINK_PAIRS_PASSED",width,mode);
   if(width===390){await page.getByRole("button",{name:mode==="night"?"Switch to day theme":"Switch to night theme"}).click();await page.waitForFunction(dark=>document.documentElement.classList.contains("dark")===dark,mode!=="night");await page.getByRole("button",{name:mode==="night"?"Switch to night theme":"Switch to day theme"}).click();await page.waitForFunction(dark=>document.documentElement.classList.contains("dark")===dark,mode==="night");}
  }
  if(["/app/services/tickets","/app/services/stadiums","/tickets","/stadiums","/tickets/sports"].includes(path)){const sports=page.locator("[data-marketplace-hubs]");await sports.waitFor();assert.equal(await sports.locator('a[href="/stadiums/melbourne-cricket-ground"]').count(),1);await decode(page,sports.locator("img"));}
  for(const module of await page.locator("[data-module-home]:visible").all()){const photo=await module.locator("[data-module-photo]").boundingBox(),floating=module.locator("[data-module-floating]");if(await floating.count()){const panel=await floating.boundingBox();assert.ok(photo&&panel&&panel.y<photo.y+photo.height&&panel.y+panel.height>photo.y+photo.height,"Module search must float on its photo "+path);}}
  if(path==="/app/destinations/accra"){await page.getByRole("heading",{name:"Accra",exact:true}).waitFor();const img=imageFor(page,expectedPagePhotos[path]);assert.ok(await img.count());await decode(page,img);const plan=page.getByRole("link",{name:"Plan flights, stays & experiences"});assert.match(await plan.getAttribute("href"),/city=Accra&country=GH/);}
  if(path==="/app/packages"){await page.locator('[data-planner-ready="true"]').waitFor({timeout:60000});assert.ok(await page.getByLabel("Planning currency").isVisible());}
  const images=path==="/app"?page.locator("[data-marketplace-services] img"):imageFor(page,expectedPagePhotos[path]);assert.ok(await images.count()>0,"Expected module photo missing: "+path+" "+expectedPagePhotos[path]);await decode(page,images);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Overflow "+path+" "+width);
  const scores=await contrast(page);for(const score of scores)assert.ok(score.ratio>=4.5,JSON.stringify({path,width,mode,...score}));
  assert.deepEqual(errors,[],"Hydration or client exception "+path);
  if(width===390)await page.screenshot({path:folder+"/luxury-"+path.replace(/[^a-z0-9]+/gi,"-")+"-"+mode+".png",fullPage:true});
  console.log("LUXURY_MOBILE_PASS",JSON.stringify({path,width,mode,images:await images.count(),contrast:scores.length?Math.min(...scores.map(x=>x.ratio)).toFixed(2):null}));
 }catch(e){await page.screenshot({path:folder+"/luxury-failure.png",fullPage:true}).catch(()=>{});throw e;}finally{await context.close();}
}
try{
 const raw=await browser.newPage();await raw.goto(base+"/images/luxury/hero.webp",{waitUntil:"domcontentloaded",timeout:90000});for(const file of (await readdir("public/images/luxury")).filter(x=>x.endsWith(".webp"))){assert.ok(await raw.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();return i.naturalWidth>0;},"/images/luxury/"+file),file);}for(const [module,src] of Object.entries(modulePhotos)){const stats=await raw.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();const c=document.createElement("canvas");c.width=c.height=64;const ctx=c.getContext("2d");ctx.drawImage(i,0,0,64,64);const d=ctx.getImageData(0,0,64,64).data;let sum=0,dark=0,bright=0;for(let n=0;n<d.length;n+=4){const l=(.2126*d[n]+.7152*d[n+1]+.0722*d[n+2])/255;sum+=l;if(l<.2)dark++;if(l>.65)bright++;}return {mean:sum/4096,dark:dark/4096,bright:bright/4096};},src);assert.ok(stats.mean>.06,"Near-black or invalid hero "+module);console.log("HERO_PHOTO_LIGHT_BALANCE",JSON.stringify({module,src,...stats}));}await raw.close();
 for(const mode of ["day","night"]){for(const width of [320,390,430])await run("/app",width,mode);for(const path of pages)await run(path,390,mode);}
 console.log("LUXURY_MARKETPLACE_IMAGES_THEMES_AND_VIEWPORTS_PASSED");
}finally{await browser.close();}
