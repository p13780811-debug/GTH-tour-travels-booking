import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";

const base="http://127.0.0.1:3000",folder="/tmp/gth-app-journey-qa/";
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 // Regression: users arriving on the public mobile flagship or Ecosystem can
 // visibly enter the unified app and their device-local Research Desk.
 const linksContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const linksPage=await linksContext.newPage();
 await linksPage.goto(base+"/",{waitUntil:"domcontentloaded",timeout:60000});
 const flagshipLinks=linksPage.getByRole("region",{name:"Super App and Research Desk shortcuts"});
 assert.ok(await flagshipLinks.getByRole("link",{name:"Open Super App"}).isVisible());
 assert.ok(await flagshipLinks.getByRole("link",{name:"My Research Desk"}).isVisible());
 await flagshipLinks.getByRole("link",{name:"Open Super App"}).click();
 await linksPage.getByRole("heading",{name:"GTH PRO Home"}).waitFor({timeout:25000});
 const appQuick=linksPage.getByRole("navigation",{name:"Super App quick access"});
 assert.ok(await appQuick.getByRole("link",{name:"My Research Desk"}).isVisible());
 await linksPage.goto(base+"/mega-aggregator",{waitUntil:"domcontentloaded",timeout:60000});
 const ecosystemLinks=linksPage.getByRole("navigation",{name:"Super App access and Research Desk"});
 assert.ok(await ecosystemLinks.getByRole("link",{name:"Open Super App"}).isVisible());
 await ecosystemLinks.getByRole("link",{name:"My Research Desk"}).click();
 await linksPage.getByRole("heading",{name:"Everything you saved. One place."}).waitFor({timeout:25000});
 await linksPage.screenshot({path:folder+"research-desk-entry-390.png",fullPage:true});
 await linksContext.close();
 for(const width of [320,360,390,428]){
  const context=await browser.newContext({viewport:{width,height:820},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto(base+"/app",{waitUntil:"domcontentloaded",timeout:60000});
  await page.getByRole("heading",{name:"GTH PRO Home"}).waitFor({timeout:25000});
  await page.getByRole("heading",{name:/Four paths, one Home/}).waitFor({timeout:25000});
  assert.ok(await page.getByRole("link",{name:/Explore Travel/}).isVisible());
  assert.ok(await page.getByRole("link",{name:/Explore Real Estate/}).isVisible());
  assert.ok(await page.getByRole("link",{name:/Explore Tender Vision/}).isVisible());
  assert.ok(await page.getByRole("link",{name:/Explore Worldwide Tickets/}).isVisible());
  // The four visual pillars must honor native app handoffs when available.
  assert.equal(await page.getByRole("link",{name:/Explore Travel/}).getAttribute("href"),"/app/destinations");
  assert.equal(await page.getByRole("link",{name:/Explore Real Estate/}).getAttribute("href"),"/app/property");
  assert.equal(await page.getByRole("link",{name:/Explore Tender Vision/}).getAttribute("href"),"/app/tenders");
  assert.equal(await page.getByRole("link",{name:/Explore Worldwide Tickets/}).getAttribute("href"),"/tickets");
  assert.equal(await page.locator('form[action="/app/search"]').count(),1);
  assert.ok(await page.getByRole("link",{name:"Open my Research Desk"}).isVisible());
  assert.ok(await page.getByRole("link",{name:"Search all GTH PRO ecosystems"}).isVisible());
  assert.ok(await page.getByRole("searchbox",{name:"What would you like to find?"}).isVisible());
  assert.ok(await page.getByRole("heading",{name:"Tours & activities"}).isVisible());
  assert.ok(await page.getByRole("navigation",{name:"Super App quick access"}).isVisible());
  const dimensions=await page.evaluate(()=>({screen:window.innerWidth,document:document.documentElement.scrollWidth}));
  assert.ok(dimensions.document<=dimensions.screen+2,`Root horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`);
  if(width===390){
   const hero=page.getByRole("region",{name:"Featured GTH PRO journeys"});
   const rect=await hero.boundingBox();
   assert.ok(rect&&rect.height>50,"Home hero must be visible");
   await page.evaluate(()=>window.scrollTo(0,0));
   const y=Math.min(760,Math.max(170,Math.round(rect.y+rect.height*0.6)));
   const x=Math.round(rect.x+rect.width*0.5);
   const session=await context.newCDPSession(page);
   await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
   for(let step=1;step<=8;step++){
    await session.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y-step*19}]});
    await page.waitForTimeout(30);
   }
   await session.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
   await page.waitForTimeout(450);
   const moved=await page.evaluate(()=>window.scrollY);
   assert.ok(moved>15,"Finger drag on the Mumbai/Goa hero must scroll vertically; received "+moved);
   await page.getByRole("region",{name:"Nuitee supplier hotel cards"}).waitFor({state:"visible",timeout:30000});
   assert.ok((await page.getByRole("region",{name:"Hotel destination shortcuts — swipe horizontally"}).count())>0);
   await page.screenshot({path:folder+"app-home-390.png",fullPage:true});
  }
  await context.close();
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await ctx.newPage();
 // The same existing service engines must handle global search: no endless
 // Explore re-render and no non-bookable hotel directory for "Goa hotel".
 await page.goto(base+"/app/search?q=Goa+hotel",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Hotels",exact:true}).waitFor({timeout:25000});
 assert.ok(page.url().includes("/app/hotels?view=booking&city=Goa"),page.url());
 await page.goto(base+"/app/explore?q=hotels+in+Goa",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Hotels",exact:true}).waitFor({timeout:25000});
 assert.ok(page.url().includes("view=booking&city=Goa"),page.url());
 await page.goto(base+"/app/search?q=road+construction+tender",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Open tenders"}).waitFor({timeout:25000});
 assert.ok(page.url().includes("/app/tenders?q=road+construction"),page.url());
 await page.goto(base+"/app/search?q=Lodha+project&category=property",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Properties"}).waitFor({timeout:25000});
 assert.ok(page.url().includes("/app/property?q=Lodha+project"),page.url());
 await page.goto(base+"/app/search?q=cricket+stadium+tickets&category=ticket",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Worldwide Ticket Finder"}).waitFor({timeout:25000});
 assert.ok(page.url().includes("/tickets?q=cricket+stadium+tickets"),page.url());
 await page.goto(base+"/app/explore",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Find the next opportunity. Anywhere."}).waitFor({timeout:25000});
 const search=page.getByRole("searchbox",{name:"Search global destinations, property, tenders and event tickets"});
 await search.fill("Goa");
 await page.getByRole("button",{name:"Search",exact:true}).click();
 await page.getByRole("heading",{name:"Results for “Goa”"}).waitFor({timeout:60000});
 await page.getByRole("heading",{name:"Destination guides"}).waitFor();
 await page.screenshot({path:folder+"unified-goa-results.png",fullPage:true});
 const save=page.getByRole("button",{name:"Save Goa to Research Desk"});
 await save.click();
 const unsave=page.getByRole("button",{name:"Remove Goa from Research Desk"});
 await unsave.waitFor({state:"visible",timeout:10000});
 assert.equal(await unsave.getAttribute("aria-pressed"),"true");
 await page.getByRole("link",{name:"Open my Research Desk"}).click();
 await page.getByRole("heading",{name:"Everything you saved. One place."}).waitFor();
 await page.getByRole("link",{name:/Goa/}).waitFor();
 assert.ok((await page.locator("main").innerText()).includes("1 of 24 saved"));
 await page.screenshot({path:folder+"research-desk-saved.png",fullPage:true});
 await page.getByRole("link",{name:/Goa/}).click();
 await page.getByRole("heading",{name:"Goa"}).waitFor();
 assert.ok(await page.getByRole("button",{name:"Remove Goa from Research Desk"}).isVisible());
 await page.getByRole("link",{name:"My Research Desk",exact:true}).click();
 await page.getByRole("button",{name:"Remove Goa"}).click();
 await page.getByText("0 of 24 saved",{exact:true}).waitFor({state:"visible",timeout:10000});
 await page.goto(base+"/app/services/transfers",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Airport transfers"}).waitFor();
 const external=page.getByRole("link",{name:/Continue to airport transfers on GTH PRO website/});
 assert.equal(await external.getAttribute("target"),"_blank");
 assert.equal(await external.getAttribute("href"),"/transfers");
 await ctx.close();
 console.log("PASS: app search routes to Nuitee booking/tenders/property/tickets, four Android widths, federated Goa search, save/revisit/delete and safe handoff");
}finally{await browser.close();}
