import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";

const base="http://127.0.0.1:3000",folder="/tmp/gth-app-journey-qa/";
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const width of [320,360,390,428]){
  const context=await browser.newContext({viewport:{width,height:820},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto(base+"/app",{waitUntil:"domcontentloaded",timeout:60000});
  await page.getByRole("heading",{name:"One world. Your next move."}).waitFor({timeout:25000});
  assert.ok(await page.getByRole("link",{name:"Open my Research Desk"}).isVisible());
  assert.ok(await page.getByRole("link",{name:"Search all GTH PRO ecosystems"}).isVisible());
  assert.ok(await page.getByRole("searchbox",{name:"Search destinations, properties and tenders"}).isVisible());
  const dimensions=await page.evaluate(()=>({screen:window.innerWidth,document:document.documentElement.scrollWidth}));
  assert.ok(dimensions.document<=dimensions.screen+2,`Root horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`);
  if(width===390)await page.screenshot({path:folder+"app-home-390.png",fullPage:true});
  await context.close();
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await ctx.newPage();
 await page.goto(base+"/app/explore",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Find the next opportunity. Anywhere."}).waitFor({timeout:25000});
 const search=page.getByRole("searchbox",{name:"Search global destinations, property and tenders"});
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
 assert.ok((await page.locator("main").innerText()).includes("0 of 24 saved"));
 await page.goto(base+"/app/services/transfers",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Airport transfers"}).waitFor();
 const external=page.getByRole("link",{name:/Continue to airport transfers on GTH PRO website/});
 assert.equal(await external.getAttribute("target"),"_blank");
 assert.equal(await external.getAttribute("href"),"/transfers");
 await ctx.close();
 console.log("PASS: four Android widths, universal Goa search, device save/revisit/delete and intentional website handoff");
}finally{await browser.close();}
