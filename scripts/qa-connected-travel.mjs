/** Actual Next acceptance with explicit local fixtures. No supplier search,
 * booking/payment API, production database, key or live inventory is used. */
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
const {chromium}=createRequire(import.meta.url)("playwright");
const origin=process.env.GTH_CONNECTED_QA_ORIGIN||"http://127.0.0.1:4212",evidence="/tmp/gth-connected-travel-qa";
assert.equal(new URL(origin).hostname,"127.0.0.1");await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.GTH_CHROMIUM_PATH||undefined,args:["--no-sandbox"]});
const scenarios=[],errors=[],forbidden=[];
const trip="tripCountry=IN&tripCity=Mumbai&tripStart=2026-12-10&tripEnd=2026-12-14&tripRooms=2&tripAdults=2&tripChildren=4,9&tripCurrency=USD&tripFrom=LHR&tripTo=BOM";
const sdk=String.raw`window.LiteAPI={init(){},SearchBar:{async create(options){document.querySelector(options.selector).innerHTML='<p>Isolated hotel search fixture</p>';}}};`;
const avia=String.raw`document.getElementById('tpwl-search').innerHTML='<p>Existing Aviasales fixture</p>';document.getElementById('tpwl-tickets').innerHTML='<p>Existing result container</p>';`;
const route=async r=>{
 const url=new URL(r.request().url());
 if(url.hostname==="components.liteapi.travel")return r.fulfill({contentType:"application/javascript",body:sdk});
 if(["tpwidg.com","tpwgts.com"].includes(url.hostname))return r.fulfill({contentType:"application/javascript",headers:{"access-control-allow-origin":"*"},body:avia});
 if(url.hostname==="fixture-hotel-photos.invalid")return r.fulfill({contentType:"image/svg+xml",body:'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240"><rect width="480" height="240" fill="#26354c"/><text x="25" y="125" fill="white">Fixture hotel photo</text></svg>'});
 if(url.origin===origin){
  if(/\/api\/(?:flights|tours|activities)|\/api\/hotels\/reference\/places/.test(url.pathname)){forbidden.push(url.pathname);return r.abort();}
  if(url.pathname==="/api/hotels/discovery")return r.continue({headers:{...r.request().headers(),"x-vercel-ip-country":"IN","x-vercel-ip-city":"Mumbai"}});
  return r.continue();
 }
 if(url.hostname==="api.liteapi.travel"){forbidden.push(url.href);}
 return r.abort();
};
try{
 for(const width of [320,390,768,1440])for(const theme of ["day","night"]){
  const page=await browser.newPage({viewport:{width,height:width<768?844:1000}});page.on("pageerror",error=>errors.push(error.message));
  await page.route("**/*",route);await page.addInitScript(t=>localStorage.setItem("theme-mode",t),theme);
  await page.goto(origin+"/travel?"+trip,{waitUntil:"networkidle"});
  await page.getByRole("heading",{name:"Around Mumbai",exact:true}).waitFor();
  assert.equal(await page.locator("#travel-search [role=tab]").count(),3);
  assert.equal(await page.locator("#travel-search [role=tab]").evaluateAll(tabs=>tabs.every(tab=>document.getElementById(tab.getAttribute('aria-controls')))),true,"all tabs control an existing panel");
  assert.equal(await page.locator("iframe").count(),0,"hotel SDK is loaded only on explicit request");
  assert.equal(await page.locator('script[data-gth-white-label]').count(),0,"hub must not duplicate the existing flight widget");
  const roomHref=await page.getByRole("link",{name:/See rooms & availability/}).first().getAttribute("href"),hotel=new URL(roomHref);
  assert.equal(hotel.hostname,"hotel.gthproglobal.com");assert.match(hotel.pathname,/lpfixtureIN/);assert.equal(hotel.searchParams.get("checkin"),"2026-12-10");assert.equal(hotel.searchParams.get("currency"),"USD");assert.equal(JSON.parse(atob(hotel.searchParams.get("occupancies"))).length,2);
  const palette=await page.locator('select[name="tripCountry"]').evaluate(el=>({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor,optionColor:getComputedStyle(el.options[1]).color,optionBackground:getComputedStyle(el.options[1]).backgroundColor}));assert.notEqual(palette.color,palette.background);assert.notEqual(palette.optionColor,palette.optionBackground);
  const contrast=await page.locator('select[name="tripCountry"]').evaluate(el=>{
   const ctx=document.createElement('canvas').getContext('2d');
   const lum=color=>{ctx.fillStyle=color;ctx.fillRect(0,0,1,1);const rgb=[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
   const s=getComputedStyle(el),a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });assert.ok(contrast>=4.5,"form text meets 4.5:1 contrast");
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,"no horizontal overflow "+width+theme);
  await page.locator("#travel-search").screenshot({path:evidence+`/hotels-${width}-${theme}.png`});
  await page.getByRole("tab",{name:"Flights",exact:true}).click();
  await page.getByRole("link",{name:"Search this route",exact:true}).waitFor();
  const flight=new URL(await page.getByRole("link",{name:"Search this route",exact:true}).getAttribute("href"));assert.equal(flight.hostname,"www.aviasales.com");assert.equal(flight.searchParams.get("origin"),"LHR");assert.equal(flight.searchParams.get("depart_date"),"2026-12-10");
  assert.equal(await page.getByRole("link",{name:"Open Nuitee Stays & Flights",exact:true}).getAttribute("href"),"https://hotel.gthproglobal.com");
  await page.getByRole("tab",{name:"Flights",exact:true}).focus();await page.keyboard.press("ArrowRight");
  await page.getByRole("tab",{name:"Experiences",exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('#travel-tab-experiences')?.getAttribute('aria-selected')==='true');
  const activities=await page.getByRole("link",{name:"All experiences",exact:true}).getAttribute("href");assert.match(activities,/city=Mumbai/);assert.match(activities,/currency=USD/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,"experience carousel stays inside viewport");
  await page.locator("#travel-search").screenshot({path:evidence+`/experiences-${width}-${theme}.png`});
  await page.getByRole("tab",{name:"Experiences",exact:true}).focus();await page.keyboard.press("Home");
  await page.getByRole("heading",{name:"Around Mumbai",exact:true}).waitFor();
  assert.equal(await page.locator('input[name="tripCity"]').inputValue(),"Mumbai");
  await page.close();scenarios.push({width,theme,hotelDates:true,flightsHandoff:true,experienceCity:true,keyboard:true,opaqueOptions:true,noOverflow:true});
 }
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on("pageerror",error=>errors.push(error.message));await page.route("**/*",route);
 await page.goto(origin+"/travel?"+trip,{waitUntil:"networkidle"});
 await page.locator('input[name="tripCity"]').fill("London");await page.locator('select[name="tripCountry"]').selectOption("GB");
 await page.getByRole("button",{name:"Apply to my trip"}).click();
 await page.getByRole("heading",{name:"Around London",exact:true}).waitFor();assert.match(page.url(),/tripCity=London/);
 await page.getByRole("tab",{name:"Flights",exact:true}).click();await page.getByRole("tab",{name:"Experiences",exact:true}).click();assert.match(await page.getByRole("link",{name:"All experiences",exact:true}).getAttribute("href"),/city=London/);
 await page.waitForURL(url=>url.searchParams.get("travelMode")==="experiences");
 await page.reload({waitUntil:"networkidle"});assert.equal(await page.getByRole("tab",{name:"Experiences",exact:true}).getAttribute("aria-selected"),"true");
 await page.locator('input[name="tripCity"]').fill("Tokyo");await page.getByRole("tab",{name:"Flights",exact:true}).click();await page.getByRole("tab",{name:"Experiences",exact:true}).click();assert.equal(await page.locator('input[name="tripCity"]').inputValue(),"Tokyo");assert.match(await page.getByRole("link",{name:"All experiences",exact:true}).getAttribute("href"),/city=London/);
 await page.locator('input[name="tripCity"]').fill("<script>");await page.getByRole("button",{name:"Apply to my trip"}).click();await page.locator('#travel-search [role="alert"]').waitFor();assert.match(page.url(),/tripCity=London/);
 await page.goto(origin+"/travel?tripCity=Dubai",{waitUntil:"networkidle"});await page.getByText("Choose a country above to find hotels in Dubai.",{exact:true}).waitFor();
 await page.getByText("Search every stay with the hotel booking search",{exact:true}).click();await page.frameLocator('iframe[title="Worldwide hotel destination, dates and guests"]').getByText("Isolated hotel search fixture").waitFor();
 await page.goto(origin+"/flights",{waitUntil:"networkidle"});await page.getByText("Existing Aviasales fixture",{exact:true}).waitFor();assert.equal(await page.locator("#tpwl-search").count(),1);assert.equal(await page.getByRole("link",{name:"Open Nuitee Stays & Flights",exact:true}).getAttribute("href"),"https://hotel.gthproglobal.com");
 await page.close();assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);
 const results={scenarios,appliedCityAndReload:true,invalidDraftBlocked:true,missingCountryHonest:true,hotelSdkOnDemand:true,originalFlightsRetained:true,paidApiRequests:forbidden,errors,fixtureOnly:true};await writeFile(evidence+"/results.json",JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
