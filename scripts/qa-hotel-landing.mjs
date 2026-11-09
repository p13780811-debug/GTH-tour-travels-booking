/** Actual Next/browser acceptance. Supplier SDK and catalogue data are explicit
 * local fixtures: this verifies GTH layout/handoff, not supplier availability. */
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
const {chromium}=createRequire(import.meta.url)("playwright");
const origin=process.env.GTH_HOTEL_QA_ORIGIN||"http://127.0.0.1:4211";
assert.equal(new URL(origin).hostname,"127.0.0.1");
const evidence="/tmp/gth-hotel-landing-qa";await mkdir(evidence,{recursive:true});
// Only test code supplies this DOM. Production continues loading the original SDK.
const sdk=String.raw`(()=>{
 window.__hotelFixture={searches:0,lists:[]};
 window.LiteAPI={init(options){window.__hotelFixture.currency=new URLSearchParams(options.deepLinkParams).get('currency');},SearchBar:{async create(options){
  window.__hotelFixture.searches++;
  const root=document.querySelector(options.selector);
  const css=document.createElement('style');css.textContent='.search-bar{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:12px;padding:12px;border:1px solid;border-radius:16px}.search-bar label{font:12px sans-serif;display:grid;gap:8px}.search-bar input{font:14px sans-serif;min-width:0;width:100%;padding:10px}.search-button{cursor:pointer;font:600 14px sans-serif}@media(max-width:640px){.search-bar{grid-template-columns:1fr 1fr;padding:10px}.search-bar label:first-child,.search-button{grid-column:1/-1}}';document.head.append(css);
  root.innerHTML='<form class="search-bar"><label>Destination<input class="search-input" value="Mumbai, India"></label><label>Check-in<input class="date-description" type="date" value="2026-12-10"></label><label>Check-out<input type="date" value="2026-12-14"></label><button type="submit" class="search-button">Find rooms</button></form>';
  root.querySelector('form').onsubmit=e=>e.preventDefault();window.__hotelFixture.search=options.onSearchClick;
 }},HotelsList:{create(options){
  window.__hotelFixture.lists.push(options.placeId);
  const root=document.querySelector(options.selector);root.dataset.fixture='true';
  const city=options.placeId==='ChIJwe1EZjDG5zsRaYxkjY_tpF0'?'Mumbai':'London';
  const grid=document.createElement('div');grid.setAttribute('aria-label',city+' fixture supplier cards');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px';
  for(let i=1;i<=3;i++){const card=document.createElement('a');card.href='https://hotel.gthproglobal.com/hotels/fixture-'+i+'?currency='+options.currency;card.style.cssText='display:block;min-height:180px;padding:24px;border:1px solid #ddd;border-radius:16px;background:white;font-size:14px';card.innerHTML='<h3>'+city+' fixture hotel '+i+'</h3><p style="color:#999">QA data, not live inventory</p><strong style="color:black">Fixture price '+options.currency+'</strong><span data-fixture-badge style="display:block;background:rgb(76,175,80);color:white">Supplier badge</span>';grid.append(card);}root.append(grid);
 }}};
})();`;
const fixtures=[{id:"osm-12345",name:"Fixture directory hotel",city:"Mumbai",country:"India",image:"/placeholder.jpg",stars:null,affiliate_link:null,source:"OpenStreetMap",booking_ready:false,category:"hotel"}];
let blockSdk=false;let apiCalls=0;
const browser=await chromium.launch({headless:true,executablePath:process.env.GTH_CHROMIUM_PATH||undefined,args:["--no-sandbox"]});
const route=async r=>{
 const url=new URL(r.request().url());
 if(url.hostname==="components.liteapi.travel")return blockSdk?r.abort():r.fulfill({contentType:"application/javascript",body:sdk});
 if(url.hostname==="hotel.gthproglobal.com")return r.fulfill({contentType:"text/html",body:"<title>Supplier navigation fixture</title><p>QA handoff target. No booking or payment.</p>"});
 if(url.hostname==="fixture-hotel-photos.invalid")return r.fulfill({contentType:"image/svg+xml",body:'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240"><rect width="480" height="240" fill="#26354c"/><text x="25" y="125" font-family="sans-serif" font-size="22" fill="white">QA fixture photo</text></svg>'});
 if(url.origin===origin){
  if(url.pathname==="/api/hotels/discovery")return r.continue({headers:{...r.request().headers(),"x-vercel-ip-country":"IN","x-vercel-ip-city":"Mumbai","x-vercel-ip-latitude":"19.01","x-vercel-ip-longitude":"72.8"}});
  if(url.pathname==="/api/hotels"){apiCalls++;return r.fulfill({contentType:"application/json",headers:{"X-GTH-Total":"1","X-GTH-Has-More":"false"},body:JSON.stringify(fixtures)});}
  if(url.pathname==="/api/hotels/stats")return r.fulfill({contentType:"application/json",body:JSON.stringify({country:"IN",total:1,categories:{hotel:1},latest_imported_at:null})});
  return r.continue();
 }
 return r.abort();
};
const scenarios=[];
try{
 const reference=await fetch(origin+"/api/hotels/reference/currencies");assert.equal(reference.status,200);assert.equal((await reference.json()).source,"nuitee");assert.match(reference.headers.get("cache-control"),/s-maxage=86400/);
 const referenceBefore=await fetch("http://127.0.0.1:4312/__fixture").then(r=>r.json());
 for(let i=0;i<40;i++)assert.equal((await fetch(origin+"/api/hotels/reference/currencies")).status,200);
 const referenceAfter=await fetch("http://127.0.0.1:4312/__fixture").then(r=>r.json());assert.equal(referenceAfter.requests,referenceBefore.requests,"warm reference views cannot repeat upstream API calls");
 assert.equal((await fetch(origin+"/api/hotels/reference/currencies?path=places")).status,400);
 const geoHeaders={"x-vercel-ip-country":"IN","x-vercel-ip-city":"Mumbai","x-vercel-ip-latitude":"19.01","x-vercel-ip-longitude":"72.8"};
 const automatic=await fetch(origin+"/api/hotels/discovery",{headers:geoHeaders});assert.equal(automatic.status,200);assert.match(automatic.headers.get("cache-control"),/private, no-store/);const near=await automatic.json();assert.equal(near.scope.country,"IN");assert.ok(near.nearby.length);assert.ok([...near.nearby,...near.items].every(item=>item.country==="IN"));assert.equal(near.scope.point,undefined);
 const geoBefore=await fetch("http://127.0.0.1:4312/__fixture").then(r=>r.json());
 for(let i=0;i<40;i++)assert.equal((await fetch(origin+"/api/hotels/discovery",{headers:geoHeaders})).status,200);
 const geoAfter=await fetch("http://127.0.0.1:4312/__fixture").then(r=>r.json());assert.equal(geoAfter.hotels,geoBefore.hotels,"warm geo visits reuse the daily profile cache");
 const selected=await fetch(origin+"/api/hotels/discovery?country=GB&city=London",{headers:geoHeaders});assert.match(selected.headers.get("cache-control"),/public/);const selectedData=await selected.json();assert.equal(selectedData.scope.country,"GB");assert.ok([...selectedData.nearby,...selectedData.items].every(item=>item.country==="GB"));
 const countryFallback=await fetch(origin+"/api/hotels/discovery?country=IN&city=Nowhere").then(r=>r.json());assert.equal(countryFallback.nearby.length,0);assert.ok(countryFallback.items.length);
 for(const width of [320,390,430,768,1440])for(const theme of ["day","night"]){
  const page=await browser.newPage({viewport:{width,height:width<768?844:1000}});
  await page.route("**/*",route);await page.addInitScript(t=>localStorage.setItem("theme-mode",t),theme);
  const before=apiCalls;
  await page.goto(origin+"/hotels",{waitUntil:"networkidle"});
  const frame=page.frameLocator('iframe[title="Worldwide hotel destination, dates and guests"]');
  await frame.getByRole("button",{name:"Find rooms",exact:true}).waitFor();
  await page.locator('[data-gth-nuitee-supplier-hotels="true"] [data-fixture], [data-gth-nuitee-supplier-hotels="true"][data-fixture]').waitFor();
  assert.equal(apiCalls,before,"booking landing must not query Supabase hotel directory");
  assert.equal(await page.locator('iframe[title="Worldwide hotel destination, dates and guests"]').count(),1);
  assert.equal(await frame.locator("html").evaluate(()=>window.__hotelFixture.searches),1,"one SDK initialization after hydration");
  assert.equal(await page.locator('[data-gth-nuitee-supplier-hotels="true"]').count(),1,"only the selected supplier list is mounted");
  const palette=await page.locator('[data-gth-nuitee-supplier-hotels="true"] a').first().evaluate(card=>({background:getComputedStyle(card).backgroundColor,title:getComputedStyle(card.querySelector('h3')).color,price:getComputedStyle(card.querySelector('strong')).color,badge:getComputedStyle(card.querySelector('[data-fixture-badge]')).backgroundColor,expectedBackground:getComputedStyle(document.documentElement).getPropertyValue('--bg-soft').trim()}));
  assert.equal(palette.title,palette.price,"SDK black prices and inherited titles share readable theme text");
  assert.equal(palette.badge,"rgb(76, 175, 80)","keep supplier badge colours");
  assert.equal(palette.title,theme==="night"?"rgb(243, 244, 246)":"rgb(17, 24, 39)");
  assert.equal(palette.background,theme==="night"?"rgb(15, 23, 42)":"rgb(242, 245, 250)");
  const inHero=await page.locator('iframe[title="Worldwide hotel destination, dates and guests"]').evaluate(e=>!!e.closest('[data-travel-hero="true"]'));assert.equal(inHero,true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width}/${theme} overflow`);
  const buttonBox=await frame.getByRole("button",{name:"Find rooms",exact:true}).boundingBox();
  if(width<768)assert.ok(buttonBox.y+buttonBox.height<760,`${width}: primary search must be visible above bottom navigation`);
  assert.equal(await frame.locator("html").evaluate(e=>e.classList.contains("dark")),theme==="night");
  await page.getByRole("heading",{name:"Around Mumbai",exact:true}).waitFor();
  const localBox=await page.getByRole("heading",{name:"Around Mumbai",exact:true}).boundingBox(),countryBox=await page.getByRole("heading",{name:"More stays in India",exact:true}).boundingBox();assert.ok(localBox.y<countryBox.y);
  const supplierBox=await page.getByRole("heading",{name:"Find your kind of stay.",exact:true}).boundingBox(),guideBox=await page.getByRole("heading",{name:"Where will you wake up next?",exact:true}).boundingBox();assert.ok(supplierBox.y<guideBox.y,"real supplier hotels appear before destination inspiration");
  await page.screenshot({path:`${evidence}/hotel-${width}-${theme}.png`,fullPage:true});if(width===390||width===1440)await page.screenshot({path:`${evidence}/hotel-${width}-${theme}-viewport.png`});
  await page.getByRole("button",{name:"London, UK",exact:true}).click();await page.getByRole("link",{name:/London fixture hotel 1/}).waitFor();
  assert.equal(await page.locator('[data-gth-nuitee-supplier-hotels="true"]').count(),1);
  await page.getByRole("button",{name:"Mumbai, India",exact:true}).click();await page.getByRole("link",{name:/Mumbai fixture hotel 1/}).waitFor();
  if(width===390&&theme==="night"){
   await page.getByRole("combobox",{name:"Hotel discovery country",exact:true}).selectOption("GB");await page.getByRole("textbox",{name:"Hotel discovery city",exact:true}).fill("London");await page.getByRole("button",{name:"Explore area",exact:true}).click();await page.getByRole("heading",{name:"Around London",exact:true}).waitFor();await page.getByRole("heading",{name:"More stays in United Kingdom",exact:true}).waitFor();
   assert.equal(await page.getByRole("heading",{name:"Around Mumbai",exact:true}).count(),0);await page.getByRole("button",{name:"Explore more in United Kingdom",exact:true}).click();
  }
  for(const link of await page.getByRole("navigation",{name:"Featured travel destinations"}).locator("a").all())assert.match(await link.getAttribute("href"),/^\/hotels\/explore\/[a-z-]+$/);
  await page.getByText("The complete price",{exact:true}).click();await page.getByText(/Compare the total for your dates/).waitFor();
  await page.getByRole("button",{name:"Hotel directory",exact:true}).click();await page.getByText("Fixture directory hotel",{exact:true}).first().waitFor();
  const country=page.getByRole("combobox",{name:"Country",exact:true});assert.equal(await country.evaluate(s=>getComputedStyle(s).colorScheme),theme==="night"?"dark":"light");
  assert.equal(await page.locator('iframe[title="Worldwide hotel destination, dates and guests"]').count(),0);
  await page.getByRole("button",{name:"Book a stay",exact:true}).click();await frame.getByRole("button",{name:"Find rooms",exact:true}).waitFor();assert.equal(await frame.locator("html").evaluate(()=>window.__hotelFixture.searches),1);
  await page.getByRole("button",{name:theme==="night"?"Switch to day theme":"Switch to night theme",exact:true}).click();await page.waitForFunction(expected=>document.querySelector('iframe[title="Worldwide hotel destination, dates and guests"]').contentDocument.documentElement.classList.contains('dark')===expected,theme!=="night");
  scenarios.push({width,theme,searchBottom:Math.round(buttonBox.y+buttonBox.height),overflow:false});await page.close();
 }
 const start=new Date(Date.now()+30*86400000).toISOString().slice(0,10),end=new Date(Date.now()+34*86400000).toISOString().slice(0,10);
 const payload={place:{place_id:"ChIJwe1EZjDG5zsRaYxkjY_tpF0"},checkin:start,checkout:end,occupancies:Buffer.from(JSON.stringify([{adults:2,rooms:2,children:[6]}])).toString("base64")};
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});await page.route("**/*",route);await page.goto(origin+"/hotels",{waitUntil:"networkidle"});
  await page.getByRole("combobox",{name:"Hotel display currency",exact:true}).selectOption("USD");await page.waitForURL(/currency=USD/);
  await page.waitForFunction(()=>document.querySelector('iframe[title="Worldwide hotel destination, dates and guests"]')?.contentWindow?.__hotelFixture?.currency==="USD");
  const frame=page.frameLocator('iframe[title="Worldwide hotel destination, dates and guests"]');await frame.getByRole("button",{name:"Find rooms",exact:true}).waitFor();await frame.locator("html").evaluate((_,p)=>window.__hotelFixture.search(p),payload);
  if(width<1024){await page.waitForURL(/hotel\.gthproglobal\.com\/hotels/);const u=new URL(page.url());assert.equal(u.searchParams.get("currency"),"USD");assert.equal(u.searchParams.get("checkin"),start);const occupancies=JSON.parse(Buffer.from(u.searchParams.get("occupancies"),"base64").toString());assert.equal(occupancies.length,2);assert.deepEqual(occupancies[1].children,[6]);}
  else{await page.waitForURL(/view=booking/);await page.locator('iframe[title="GTH PRO hotel availability, amenities and room booking"]').waitFor();assert.match(await page.getByRole("link",{name:/Continue on secure booking site/}).getAttribute("href"),/^https:\/\/hotel\.gthproglobal\.com\/hotels\?/);}
  await page.close();
 }
 blockSdk=true;
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.route("**/*",route);await page.goto(origin+"/hotels",{waitUntil:"networkidle"});await page.getByRole("button",{name:"Retry hotel search",exact:true}).waitFor();await page.getByText(/Supplier hotel cards are unavailable/).waitFor();
 assert.match(await page.getByRole("link",{name:"Open secure booking site",exact:true}).getAttribute("href"),/^https:\/\/hotel\.gthproglobal\.com\//);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:evidence+"/supplier-unavailable.png",fullPage:true});
 blockSdk=false;await page.getByRole("button",{name:"Retry hotel search",exact:true}).click();await page.frameLocator('iframe[title="Worldwide hotel destination, dates and guests"]').getByRole("button",{name:"Find rooms",exact:true}).waitFor();
 const result={status:"PASS",fixtureOnly:true,scenarios,mobileHandoff:"PASS: USD, dates, two rooms and child ages retained",desktopResults:"PASS: existing embedded supplier results",fallbackAndRetry:"PASS",bookingLandingDirectoryReads:0,geography:"PASS: city first, country next, manual override, country fallback and private/public cache isolation",warmReferenceAdditionalCalls:referenceAfter.requests-referenceBefore.requests,warmGeoAdditionalCalls:geoAfter.hotels-geoBefore.hotels,evidence};await writeFile(evidence+"/result.json",JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){
 for(const context of browser.contexts())for(const page of context.pages()){await page.screenshot({path:evidence+"/failure.png",fullPage:true}).catch(()=>{});await writeFile(evidence+"/failure.txt",(await page.locator("body").innerText().catch(()=>"Unavailable")).slice(0,16000));}
 throw error;
}finally{await browser.close();}
