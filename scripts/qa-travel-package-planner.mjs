import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
await mkdir("/tmp/gth-package-qa",{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const privateCalls=[];
 // Block all direct supplier API network activity in this local UI QA.
 await page.route(/^https:\/\/(?:api\.|book\.)?liteapi\.travel\//,r=>{privateCalls.push(new URL(r.request().url()).hostname);return r.abort();});
 await page.goto("http://127.0.0.1:3000/travel/packages",{waitUntil:"domcontentloaded",timeout:90000});
 await page.getByRole("heading",{name:"Choose your next escape"}).waitFor();
 await page.getByRole("button",{name:"Plan Tokyo"}).click();
 await page.getByRole("combobox",{name:"Departure airport"}).fill("BOM");
 await page.getByRole("option").filter({hasText:"BOM"}).first().click();
 const date=n=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
 await page.getByLabel("Departure / check-in").fill(date(10));
 await page.getByLabel("Return / check-out").fill(date(15));
 await page.getByRole("button",{name:"Create my travel plan"}).click();
 try{await page.getByRole("heading",{name:"Your Tokyo travel plan"}).waitFor();}catch(e){console.log("PACKAGE_FORM_DIAGNOSTICS",await page.getByRole("alert").allTextContents());await page.screenshot({path:"/tmp/gth-package-qa/failure.png",fullPage:true});throw e;}
 assert.match(await page.getByRole("link",{name:"Find stays in Tokyo"}).getAttribute("href"),/^https:\/\/hotel\.gthproglobal\.com\/hotels\?/);
 assert.match(await page.getByRole("link",{name:"Compare return flights"}).getAttribute("href"),/return_date=/);
 assert.match(await page.getByRole("link",{name:"Find experiences"}).getAttribute("href"),/city=Tokyo/);
 assert.equal(await page.getByRole("link",{name:"Explore airport pickups"}).getAttribute("href"),"/transfers");
 for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0));}
 assert.equal(privateCalls.length,0);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await page.screenshot({path:"/tmp/gth-package-qa/mobile.png",fullPage:true});
 console.log("PACKAGE_MOBILE_IMAGES_AND_HANDOFFS_PASSED");
 await context.close();
}finally{await browser.close();}
