import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const base="http://127.0.0.1:3000", folder="/tmp/gth-five-upgrades-screenshots/";
await mkdir(folder,{recursive:true});
try {
 for(const width of [390,430]){
  const page=await browser.newPage({viewport:{width,height:840},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await page.goto(base+"/real-estate",{waitUntil:"domcontentloaded",timeout:45000});
  const toggle=page.getByRole("button",{name:"Filters",exact:true});
  await toggle.waitFor({state:"visible",timeout:30000});
  await toggle.click();
  const drawer=page.locator("#explorer-filter-panel");
  await drawer.waitFor({state:"visible"});
  assert.equal(await drawer.getAttribute("role"),"dialog");
  await page.screenshot({path:folder+"real-estate-filters-"+width+".png"});
  await page.keyboard.press("Escape");
  await drawer.waitFor({state:"hidden"});
  await toggle.click();
  await page.getByRole("button",{name:"Close property filters"}).click({force:true});
  await drawer.waitFor({state:"hidden"});
  await toggle.click();
  const handle=page.getByRole("button",{name:"Swipe down or tap to close filters"});
  await handle.dispatchEvent("touchstart",{touches:[{identifier:1,target:handle,clientY:60}],changedTouches:[{identifier:1,target:handle,clientY:60}]});
  await handle.dispatchEvent("touchend",{touches:[],changedTouches:[{identifier:1,target:handle,clientY:190}]});
  await drawer.waitFor({state:"hidden"});
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:840},isMobile:true,hasTouch:true});
 const response=await page.request.get(base+"/manifest.webmanifest");
 assert.equal(response.ok(),true,"Manifest route must respond");
 const manifest=await response.json();
 assert.equal(manifest.start_url,"/app");
 assert.equal(manifest.scope,"/");
 assert.ok(manifest.icons.some(i=>i.sizes==="192x192"));
 await page.goto(base+"/app",{waitUntil:"domcontentloaded",timeout:45000});
 await page.getByRole("button",{name:/Add GTH PRO to home screen|Install GTH PRO/}).waitFor({state:"visible",timeout:30000});
 await page.screenshot({path:folder+"mobile-app-home.png"});
 await page.close();
} finally {await browser.close();}
