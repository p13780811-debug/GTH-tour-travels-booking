import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const base="http://127.0.0.1:3000",folder="/tmp/gth-app-journey-qa";
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();
  await page.goto(base+"/app",{waitUntil:"domcontentloaded",timeout:90000});
  const section=page.getByRole("region",{name:"GTH PRO marketplace collection"});
  await section.waitFor();
  assert.equal(await section.getByRole("heading",{name:"Featured global hubs"}).count(),1);
  assert.equal(await section.locator("img").count(),12);
  for(const img of await section.locator("img").all()){
   await img.scrollIntoViewIfNeeded();
   await img.evaluate(i=>i.decode());
   assert.ok(await img.evaluate(i=>i.naturalWidth>0));
  }
  assert.equal(await section.getByRole("link",{name:/Melbourne \(MCG\)/}).getAttribute("href"),"/stadiums/melbourne-cricket-ground");
  assert.equal(await section.getByRole("link",{name:/Mumbai \(Wankhede\)/}).getAttribute("href"),"/stadiums/wankhede-stadium");
  assert.ok(await page.getByRole("heading",{name:"Ask GTH AI"}).isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  if(width===390)await page.screenshot({path:folder+"/luxury-marketplace-390.png",fullPage:true});
  await section.getByRole("link",{name:/Travel packages.*Build your itinerary/}).click();
  await page.waitForURL(base+"/app/packages");
  await page.locator('[data-planner-ready="true"]').waitFor({timeout:60000});
  assert.ok(await page.getByRole("navigation",{name:"GTH PRO app navigation"}).isVisible());
  await page.getByRole("button",{name:"Plan Tokyo"}).click();
  await page.getByRole("combobox",{name:"Departure airport"}).fill("BOM");
  await page.getByRole("combobox",{name:"Departure airport"}).press("Tab");
  const date=n=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
  await page.getByLabel("Departure / check-in").fill(date(10));
  await page.getByLabel("Return / check-out").fill(date(15));
  await page.getByRole("button",{name:"Create my travel plan"}).click();
  await page.getByRole("heading",{name:"Your Tokyo travel plan"}).waitFor();
  assert.match(await page.getByRole("link",{name:"Find stays in Tokyo"}).getAttribute("href"),/^https:\/\/hotel\.gthproglobal\.com\/hotels\?/);
  console.log("MOBILE_MARKETPLACE_PASSED",width);
  await context.close();
 }
}finally{await browser.close();}
