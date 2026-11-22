/**
 * Real Next.js route + responsive layout QA for the simplified Maldives page.
 * External supplier-hosted portal and bookings are explicitly stubbed.
 */
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
const {chromium}=createRequire(import.meta.url)("playwright");

const origin=process.env.GTH_MALDIVES_QA_ORIGIN||"http://127.0.0.1:4286";
assert.equal(new URL(origin).hostname,"127.0.0.1");
const root="/tmp/gth-maldives-elite-qa";
await mkdir(root,{recursive:true});
const browser=await chromium.launch({
  headless:true,executablePath:process.env.GTH_CHROMIUM_PATH||undefined,args:["--no-sandbox"],
});
const report=[];
try {
  for(const path of ["/maldives-elite-escape","/maldives","/destinations/maldives"]){
    const response=await fetch(origin+path+"?currency=USD&adults=3",{redirect:"manual"});
    if(path==="/maldives-elite-escape") assert.equal(response.status,200);
    else {
      assert.equal(response.status,301);
      const url=new URL(response.headers.get("location")||"");
      assert.equal(url.pathname,"/maldives-elite-escape");
      assert.equal(url.searchParams.get("currency"),"USD");
      assert.equal(url.searchParams.get("adults"),"3");
    }
    report.push({path,status:response.status});
  }
  for(const [width,height] of [[390,844],[1440,900]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.context().route("**/*",async route=>{
      const url=new URL(route.request().url());
      if(url.origin===origin)return route.continue();
      if(url.hostname==="hotel.gthproglobal.com") return route.fulfill({
        status:200,contentType:"text/html",
        body:"<!doctype html><title>External supplier portal QA stub</title><body>External booking portal not tested in fixture</body>",
      });
      return route.abort();
    });
    const response=await page.goto(origin+"/maldives-elite-escape",{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(response?.status(),200);
    await page.getByRole("heading",{name:"Maldives Elite Escape"}).waitFor();
    const heroPhoto=page.locator('img[alt^="Maldives lagoon with aerial overwater villas"]');
    assert.equal(await heroPhoto.count(),1,"Missing Maldives Pexels hero image");
    assert.match(await heroPhoto.getAttribute("src")||"",/pexels/i,
      "Hero must render Pexels rather than Unsplash");
    assert.equal(await page.getByText("Original GTH PRO booking portal, including its own hotel and flight tabs.").count(),0);

    assert.equal(await page.locator("iframe").count(),0,
      "Embedded booking portal creates nested mobile scrolling and exposes its footer");
    const direct=page.getByRole("link",{name:/Open Hotels & Flights/i});
    assert.equal(new URL(await direct.getAttribute("href")).origin,
      "https://hotel.gthproglobal.com");
    assert.equal(await direct.getAttribute("target"),"_blank");
    assert.equal(await page.locator('form#maldives-elite-stay-search').count(),0,
      "Old nonworking custom form must not exist");
    assert.equal(await page.locator("[data-maldives-hotel-id]").count(),12,
      "Must retain exactly 12 real hotel cards");
    assert.equal(await page.locator('a[href^="/destinations?country="]').count(),35,
      "Country destination carousel missing");
    assert.equal(await page.locator('a[href^="/guides/"]').count(),3,
      "Existing country guide cards missing");
    assert.equal(await page.locator('section[aria-labelledby="maldives-explore-transport"] a[href="/transfers"]').count(),1,
      "Explore Transport must link to the real transfer hub");
    const first=page.locator('[data-maldives-hotel-id="lp39ce1"]');
    const href=new URL(await first.getAttribute("href"));
    assert.equal(href.origin,"https://hotel.gthproglobal.com");
    assert.equal(href.pathname,"/hotels/lp39ce1");
    assert.match(href.searchParams.get("checkin")||"",/^\d{4}-\d{2}-\d{2}$/);
    assert.match(href.searchParams.get("checkout")||"",/^\d{4}-\d{2}-\d{2}$/);
    assert.equal(await first.getAttribute("target"),"_blank");
    const {layout}=await page.evaluate(()=>{
      const hero=document.querySelector('section[aria-labelledby="maldives-elite-title"]');
      const booking=[...document.querySelectorAll("a[href]")].find(link=>{
        try { return new URL(link.getAttribute("href")||"").origin==="https://hotel.gthproglobal.com" &&
          link.textContent?.includes("Open Hotels"); } catch { return false; }
      });
      const rect=e=>{const r=e.getBoundingClientRect();return{
        left:r.left,right:r.right,width:r.width,top:r.top,bottom:r.bottom,
      }};
      return {layout:{
        width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        hero:hero?rect(hero):null,booking:booking?rect(booking):null,
      }};
    });
    assert.ok(layout.scrollWidth<=width+1,
      "Unexpected horizontal overflow at "+width+": "+layout.scrollWidth);
    assert.ok(layout.hero?.left>=-1 && layout.hero?.right<=width+1);
    assert.ok(layout.booking?.left>=-1 && layout.booking?.right<=width+1);
    assert.equal(errors.length,0,errors.join("; ").slice(0,400));
    await page.screenshot({path:root+"/maldives-"+width+"x"+height+".png",
      fullPage:true,animations:"disabled"});
    const [bookingPopup]=await Promise.all([
      page.waitForEvent("popup",{timeout:10000}),
      direct.click(),
    ]);
    await bookingPopup.waitForURL(url=>url.hostname==="hotel.gthproglobal.com",
      {waitUntil:"domcontentloaded",timeout:15000});
    assert.equal(new URL(bookingPopup.url()).pathname,"/",
      "Full booking page, not embedded footer");
    await bookingPopup.close();
    const [popup]=await Promise.all([
      page.waitForEvent("popup",{timeout:10000}),
      first.click(),
    ]);
    await popup.waitForURL(url=>url.hostname==="hotel.gthproglobal.com" &&
      url.pathname==="/hotels/lp39ce1",{waitUntil:"domcontentloaded",timeout:15000});
    assert.equal(new URL(popup.url()).pathname,"/hotels/lp39ce1");
    await popup.close();
    // Test the actual country click destination on the isolated Next app,
    // not merely that the href string looks plausible.
    const japanHref=await page.locator('a[href^="/destinations?country=Japan"]').getAttribute("href");
    assert.ok(japanHref,"Japan country card missing");
    // Follow the actual client-side country card; a direct page.goto can hide
    // broken link transitions and leave new results below the visible viewport.
    await Promise.all([
      page.waitForURL(url=>url.pathname==="/destinations" &&
        url.searchParams.get("country")==="Japan",{timeout:60000}),
      page.locator('a[href^="/destinations?country=Japan"]').click(),
    ]);
    const countryHeading=page.getByRole("heading",{name:"Explore Japan destinations"});
    await countryHeading.waitFor({timeout:20000});
    await page.waitForFunction(()=>{
      const target=document.querySelector("#discover");
      if(!target)return false;
      const box=target.getBoundingClientRect();
      return box.top<innerHeight&&box.bottom>0;
    },null,{timeout:12000});
    const countrySelect=page.locator('select[name="country"]').first();
    assert.equal(await countrySelect.inputValue(),"Japan",
      "Country selection was dropped on destination arrival");
    report.push({viewport:width+"x"+height,status:"PASS",overflow:layout.scrollWidth,
      directHotelPopup:"/hotels/lp39ce1",fullPortalPopup:"/",supplierPortal:"stubbed"});
    await page.close();
  }
  await writeFile(root+"/results.json",JSON.stringify({report,externalSupplierVerified:false},null,2));
  console.log(JSON.stringify({status:"PASS",externalSupplierVerified:false,report}));
}finally {await browser.close();}
