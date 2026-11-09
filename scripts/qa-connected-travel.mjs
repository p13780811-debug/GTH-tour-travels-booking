/** Actual Next acceptance with explicit local fixtures. No supplier search,
 * booking/payment API, production database, key or live inventory is used. */
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const {chromium}=createRequire(import.meta.url)("playwright");
const origin=process.env.GTH_CONNECTED_QA_ORIGIN||"http://127.0.0.1:4212",evidence="/tmp/gth-connected-travel-qa";
assert.equal(new URL(origin).hostname,"127.0.0.1");await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.GTH_CHROMIUM_PATH||undefined,args:["--no-sandbox"]});
const scenarios=[],errors=[],forbidden=[];let travelRsc=0,hotelDiscovery=0,experienceReads=0;
const trip="tripCountry=IN&tripCity=Mumbai&tripStart=2026-12-10&tripEnd=2026-12-14&tripRooms=2&tripAdults=2&tripChildren=4,9&tripCurrency=USD&tripFrom=LHR&tripTo=BOM";
const sdk=String.raw`window.LiteAPI={init(){},SearchBar:{async create(options){document.querySelector(options.selector).innerHTML='<p>Isolated hotel search fixture</p>';}}};`;
const avia=String.raw`document.getElementById('tpwl-search').innerHTML='<p>Existing Aviasales fixture</p>';document.getElementById('tpwl-tickets').innerHTML='<p>Existing result container</p>';`;
const route=async r=>{
 const url=new URL(r.request().url());
 if(url.hostname==="www.aviasales.com")return r.fulfill({contentType:"text/html",body:"<title>Booking handoff fixture</title><p>No search or payment is made.</p>"});
 if(url.hostname==="components.liteapi.travel")return r.fulfill({contentType:"application/javascript",body:sdk});
 if(["tpwidg.com","tpwgts.com"].includes(url.hostname))return r.fulfill({contentType:"application/javascript",headers:{"access-control-allow-origin":"*"},body:avia});
 if(url.hostname==="fixture-hotel-photos.invalid"||url.hostname==="app.wegotrip.com")return r.fulfill({contentType:"image/svg+xml",body:'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240"><rect width="480" height="240" fill="#26354c"/><text x="25" y="125" fill="white">Fixture hotel photo</text></svg>'});
 if(url.origin===origin){
  if(url.pathname==="/travel"&&r.request().headers().rsc)travelRsc++;
  if(url.pathname==="/api/hotels/discovery")hotelDiscovery++;
  if(url.pathname==="/api/travel/experiences")experienceReads++;
  if(/\/api\/(?:flights|tours|activities)|\/api\/hotels\/reference\/places/.test(url.pathname)){forbidden.push(url.pathname);return r.abort();}
  if(url.pathname==="/api/hotels/discovery")return r.continue({headers:{...r.request().headers(),"x-vercel-ip-country":"IN","x-vercel-ip-city":"Mumbai"}});
  return r.continue();
 }
 if(url.hostname==="api.liteapi.travel"){forbidden.push(url.href);}
 return r.abort();
};
try{
 assert.ok(JSON.parse(readFileSync(".next/prerender-manifest.json","utf8")).routes["/travel"],"Travel must be statically prerendered for CDN serving");
 for(const width of [320,390,768,1440])for(const theme of ["day","night"]){
  const page=await browser.newPage({viewport:{width,height:width<768?844:1000}});page.on("pageerror",error=>errors.push(error.message));
  await page.context().route("**/*",route);await page.addInitScript(t=>localStorage.setItem("theme-mode",t),theme);
  await page.goto(origin+"/travel?"+trip,{waitUntil:"networkidle"});
  await page.getByRole("heading",{name:"Around Mumbai",exact:true}).waitFor();
  const discoveryBefore=hotelDiscovery,rscBefore=travelRsc;
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
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:evidence+`/first-view-${width}-${theme}.png`});
  await page.getByRole("tab",{name:"Flights",exact:true}).click();
  await page.getByRole("link",{name:"Search flights",exact:true}).waitFor();
  const flight=new URL(await page.getByRole("link",{name:"Search flights",exact:true}).getAttribute("href"));assert.equal(flight.hostname,"www.aviasales.com");assert.equal(flight.searchParams.get("origin"),"LHR");assert.equal(flight.searchParams.get("depart_date"),"2026-12-10");
  assert.equal(await page.getByRole("link",{name:"Continue booking",exact:true}).getAttribute("href"),"https://hotel.gthproglobal.com");
  assert.equal(await page.getByRole("combobox",{name:"From",exact:true}).count(),1);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:evidence+`/flights-${width}-${theme}.png`});
  await page.getByRole("tab",{name:"Flights",exact:true}).focus();await page.keyboard.press("ArrowRight");
  await page.getByRole("tab",{name:"Experiences",exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('#travel-tab-experiences')?.getAttribute('aria-selected')==='true');
  await page.locator("[data-experience-product]").first().waitFor();assert.ok(await page.locator("[data-experience-product]").count()>=3);
  assert.equal(await page.getByRole("link",{name:/Explore collection/}).count(),4);
  const activities=await page.getByRole("link",{name:"All experiences",exact:true}).getAttribute("href");assert.match(activities,/city=Mumbai/);assert.match(activities,/currency=USD/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,"experience carousel stays inside viewport");
  await page.locator("#travel-search").screenshot({path:evidence+`/experiences-${width}-${theme}.png`});
  await page.getByRole("tab",{name:"Experiences",exact:true}).focus();await page.keyboard.press("Home");
  await page.getByRole("heading",{name:"Around Mumbai",exact:true}).waitFor();
  assert.equal(hotelDiscovery,discoveryBefore,"tab switching must not repeat hotel API reads");assert.equal(travelRsc,rscBefore,"tab switching must not request a server rerender");
  assert.equal(await page.locator('input[name="tripCity"]').inputValue(),"Mumbai");
  const selected=await page.getByRole("tab",{name:"Hotels",exact:true}).evaluate(el=>({background:getComputedStyle(el).backgroundColor,text:getComputedStyle(el).color}));
  assert.equal(selected.background,theme==="day"?"rgb(255, 255, 255)":"rgb(33, 51, 76)");
  assert.deepEqual(await page.locator("#travel-search :is(button,a)").evaluateAll(nodes=>nodes.filter(node=>/nuitee|aviasales|wegotrip|klook|tiqets|kkday|12go/i.test(node.textContent)).map(node=>node.textContent)),[]);
  await page.close();scenarios.push({width,theme,realProductCards:true,destinationCollections:4,flightForm:true,correctTabTheme:true,hotelDates:true,flightsHandoff:true,experienceCity:true,keyboard:true,opaqueOptions:true,noOverflow:true});
 }
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on("pageerror",error=>errors.push(error.message));await page.context().route("**/*",route);
 await page.goto(origin+"/travel?"+trip,{waitUntil:"networkidle"});
 const dateEditReads=hotelDiscovery;await page.locator('input[name="tripEnd"]').fill("2026-12-15");await page.getByRole("button",{name:"Find stays",exact:true}).click();await page.waitForURL(url=>url.searchParams.get("tripEnd")==="2026-12-15");assert.equal(hotelDiscovery,dateEditReads,"editing hotel dates must not repeat property metadata reads");
 await page.locator('input[name="tripCity"]').fill("London");await page.locator('select[name="tripCountry"]').selectOption("GB");
 await page.getByRole("button",{name:"Find stays"}).click();
 await page.getByRole("heading",{name:"Around London",exact:true}).waitFor();assert.match(page.url(),/tripCity=London/);
 await page.getByRole("tab",{name:"Flights",exact:true}).click();await page.getByRole("tab",{name:"Experiences",exact:true}).click();assert.match(await page.getByRole("link",{name:"All experiences",exact:true}).getAttribute("href"),/city=London/);
 await page.waitForURL(url=>url.searchParams.get("travelMode")==="experiences");
 await page.reload({waitUntil:"networkidle"});assert.equal(await page.getByRole("tab",{name:"Experiences",exact:true}).getAttribute("aria-selected"),"true");
 await page.locator('input[name="tripCity"]').fill("Tokyo");await page.getByRole("tab",{name:"Flights",exact:true}).click();await page.getByRole("tab",{name:"Experiences",exact:true}).click();assert.equal(await page.locator('input[name="tripCity"]').inputValue(),"Tokyo");assert.match(await page.getByRole("link",{name:"All experiences",exact:true}).getAttribute("href"),/city=London/);
 await page.locator('input[name="tripCity"]').fill("<script>");await page.getByRole("button",{name:"Find experiences"}).click();await page.locator('#travel-search [role="alert"]').waitFor();assert.match(page.url(),/tripCity=London/);
 await page.goto(origin+"/travel?tripCity=Dubai",{waitUntil:"networkidle"});await page.getByText("Choose a country above to find hotels in Dubai.",{exact:true}).waitFor();
 await page.getByText("Need more options? Open worldwide hotel search",{exact:true}).click();await page.frameLocator('iframe[title="Worldwide hotel destination, dates and guests"]').getByText("Isolated hotel search fixture").waitFor();
 await page.goto(origin+"/flights",{waitUntil:"networkidle"});await page.getByText("Existing Aviasales fixture",{exact:true}).waitFor();assert.equal(await page.locator("#tpwl-search").count(),1);assert.equal(await page.getByRole("link",{name:"Continue booking",exact:true}).getAttribute("href"),"https://hotel.gthproglobal.com");
 await page.goto(origin+"/travel?travelMode=flights",{waitUntil:"networkidle"});
 await page.getByRole("link",{name:"Search flights",exact:true}).click();await page.locator('#travel-search [role="alert"]').waitFor();assert.equal(await page.getByRole("link",{name:"Search flights",exact:true}).getAttribute("href"),"#travel-search");
 const from=page.getByRole("combobox",{name:"From",exact:true}),to=page.getByRole("combobox",{name:"To",exact:true});
 await from.fill("London");await page.keyboard.press("ArrowUp");assert.equal(await from.getAttribute("aria-activedescendant"),await page.getByRole("listbox",{name:"From suggestions",exact:true}).getByRole("option").last().getAttribute("id"));await page.keyboard.press("Escape");
 await from.fill("LHR");await page.keyboard.press("ArrowDown");await page.keyboard.press("Enter");assert.equal(await from.inputValue(),"London (LHR)");
 await to.fill("BOM");await page.keyboard.press("ArrowDown");await page.keyboard.press("Enter");assert.equal(await to.inputValue(),"Mumbai (BOM)");
 await page.locator('input[name="tripStart"]').fill("2026-12-10");
 let handoff=new URL(await page.getByRole("link",{name:"Search flights",exact:true}).getAttribute("href"));assert.equal(handoff.searchParams.get("origin"),"LHR");assert.equal(handoff.searchParams.has("return_date"),false);
 await page.getByRole("radio",{name:"Round trip",exact:true}).check();assert.equal(await page.getByRole("link",{name:"Search flights",exact:true}).getAttribute("href"),"#travel-search");
 await page.locator('input[name="tripEnd"]').fill("2026-12-14");await page.getByRole("button",{name:"Swap departure and arrival airports"}).click();handoff=new URL(await page.getByRole("link",{name:"Search flights",exact:true}).getAttribute("href"));assert.equal(handoff.searchParams.get("origin"),"BOM");assert.equal(handoff.searchParams.get("destination"),"LHR");assert.equal(handoff.searchParams.get("return_date"),"2026-12-14");
 await page.getByRole("button",{name:"Plan a flight to Dubai",exact:true}).click();assert.equal(await to.inputValue(),"Dubai (DXB)");
 const [bookingPage]=await Promise.all([page.waitForEvent("popup"),page.getByRole("link",{name:"Search flights",exact:true}).click()]);await bookingPage.waitForLoadState("domcontentloaded");assert.equal(new URL(bookingPage.url()).hostname,"www.aviasales.com");assert.equal(new URL(bookingPage.url()).searchParams.get("destination"),"DXB");await bookingPage.close();
 await page.goto(origin+"/travel?travelMode=experiences&"+trip,{waitUntil:"networkidle"});await page.locator("[data-experience-product]").first().waitFor();
 await page.locator('input[name="tripVisitDate"]').fill("2026-12-20");await page.getByRole("button",{name:"Find experiences",exact:true}).click();await page.waitForURL(url=>url.searchParams.get("tripVisitDate")==="2026-12-20");assert.match(page.url(),/tripEnd=2026-12-14/);
 const before=await fetch("http://127.0.0.1:4313/__fixture").then(r=>r.json());for(let i=0;i<10;i++)assert.equal((await fetch(origin+"/api/travel/experiences?city=Mumbai")).status,200);const after=await fetch("http://127.0.0.1:4313/__fixture").then(r=>r.json());assert.equal(after.requests,before.requests,"warm gallery views do not repeat public supplier calls");
 await page.close();assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);
 const results={scenarios,appliedCityAndReload:true,invalidDraftBlocked:true,airportKeyboardAndSwap:true,oneWayAndRoundTrip:true,visitDateIndependent:true,tabServerRerenders:travelRsc,experienceReads,warmCatalogueAdditionalCalls:after.requests-before.requests,missingCountryHonest:true,hotelSdkOnDemand:true,originalFlightsRetained:true,paidApiRequests:forbidden,errors,fixtureOnly:true};await writeFile(evidence+"/results.json",JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
