import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";
const base="http://127.0.0.1:3000";
const dir="/tmp/gth-package-qa";
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const [slug,city,code,hub] of [["mumbai","Mumbai","IN","destination-ecosystem"],["tokyo","Tokyo","JP","destination-ecosystem"],["melbourne","Melbourne","AU","city-spine-hub"]]){
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   // Browser QA never submits supplier searches or bookings. Local illustrative assets
   // must render even when external photo/widget requests are unavailable.
   await context.route("**/*",route=>{const u=new URL(route.request().url());return u.hostname==="127.0.0.1"?route.continue():route.abort();});
   const page=await context.newPage();const errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("console",m=>{if(m.type()==="error"&&/hydration|hydrated|server rendered html|Minified React error #(?:418|423|425)/i.test(m.text()))errors.push(m.text());});
   try{
    const response=await page.goto(base+"/destinations/"+slug,{waitUntil:"domcontentloaded",timeout:90000});
    assert.ok(response?.ok(),slug+" route");
    await page.getByRole("heading",{name:"Discover "+city,exact:true}).waitFor({timeout:60000});
    await page.locator("#destination-supplier-picks").waitFor({timeout:60000});
    const section=page.locator("#"+hub);await section.waitFor({timeout:60000});
    const category=page.getByRole("link",{name:"Explore categories",exact:true});
    assert.equal(await category.getAttribute("href"),"#"+hub);
    const plan=page.getByRole("link",{name:"Build your "+city+" travel plan",exact:true});
    const target=new URL(await plan.getAttribute("href"),base);
    assert.equal(target.pathname,"/travel/packages");assert.equal(target.searchParams.get("city"),city);assert.equal(target.searchParams.get("country"),code);
    const tabs=page.getByRole("group",{name:"Travel search type"});
    // Click and assert the client-side state, not just the server-rendered markup.
    await tabs.getByRole("button",{name:"Tours & activities",exact:true}).click();
    await page.waitForFunction(()=>document.querySelector("#destination-experiences-tab")?.getAttribute("aria-pressed")==="true",{},{timeout:30000});
    for(const id of ["tours","activities","attractions"])assert.ok(await page.locator("#destination-"+id).count(),id);
    await tabs.getByRole("button",{name:"Hotels",exact:true}).click();
    await page.waitForFunction(()=>document.querySelector("#destination-hotels-tab")?.getAttribute("aria-pressed")==="true");
    assert.equal(await page.locator('form[aria-label="Destination hotel search"] input[name="country"]').inputValue(),code);
    const photos=page.locator('section[data-travel-hero="true"] img, #'+hub+' img, #destination-supplier-picks img');
    assert.ok(await photos.count()>=8,"Expected photo-led shared sections");
    for(const img of await photos.all()){
     await img.scrollIntoViewIfNeeded();
     await img.evaluate(async i=>{await i.decode();if(!i.naturalWidth)throw Error("Image failed to decode");});
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Horizontal overflow at "+width+" in "+slug);
    assert.deepEqual(errors,[],"Client rendering errors");
    if(width===390)await page.screenshot({path:dir+"/city-"+slug+"-390.png",fullPage:true});
    console.log("CITY_MOBILE_TEMPLATE_PASSED",JSON.stringify({slug,width,hub,photos:await photos.count()}));
   }catch(e){await page.screenshot({path:dir+"/city-"+slug+"-"+width+"-failure.png",fullPage:true}).catch(()=>{});throw e;}
   finally{await context.close();}
  }
 }
 console.log("SHARED_CITY_MOBILE_HYDRATION_IMAGES_PASSED");
}finally{await browser.close();}
