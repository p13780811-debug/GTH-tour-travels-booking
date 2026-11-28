import assert from "node:assert/strict";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try {
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const base="http://127.0.0.1:3000";
 // Deliberately simulate old cached API data; never trust it for booking URLs.
 await page.route("**/api/stadiums/concierge?*",route=>route.fulfill({json:{venue:"Melbourne Cricket Ground",transit:"Check gate notices",bookingUrl:"https://gthproglobal.nuitee.link/",hotels:[]}}));
 await page.goto(base+"/stadiums/melbourne-cricket-ground",{waitUntil:"domcontentloaded",timeout:90000});
 const expected="/api/hotels/booking?city=Melbourne&country=AU";
 for(const label of ["Check hotel dates & availability","Find hotels for match day"]){
  const link=page.getByRole("link",{name:label,exact:true});
  await link.waitFor({state:"visible",timeout:45000});
  assert.equal(await link.getAttribute("href"),expected,label);
 }
 const res=await context.request.get(base+expected,{maxRedirects:0});
 assert.equal(res.status(),307);
 const target=new URL(res.headers().location);
 assert.equal(target.origin,"https://hotel.gthproglobal.com");
 assert.equal(target.pathname,"/hotels");
 assert.equal(target.searchParams.get("placeId"),"ChIJ90260rVG1moRkM2MIXVWBAQ");
 assert.ok(target.searchParams.get("checkin") && target.searchParams.get("checkout") && target.searchParams.get("occupancies"));
 console.log("MELBOURNE_LOCAL_CTA_AND_REDIRECT_PASSED");
 // Public white-label rendering only. No clicks, checkout, or customer details.
 const supplier=await context.newPage();
 const response=await supplier.goto(target.toString(),{waitUntil:"domcontentloaded",timeout:60000});
 assert.ok(response&&response.ok(),"Hotel results did not return successful HTTP");
 assert.equal(new URL(supplier.url()).origin,target.origin,"Hotel redirected away from branded booking host");
 await supplier.getByText(/Melbourne/i).first().waitFor({state:"visible",timeout:45000});
 const text=await supplier.locator("body").innerText();
 assert.doesNotMatch(text,/The API infrastructure powering travel/i);
 console.log("MELBOURNE_SUPPLIER_CITY_RENDERED",JSON.stringify({origin:new URL(supplier.url()).origin,cityVisible:true}));
 // City display alone does not establish hotel inventory or successful payment.
 await context.close();
}finally{await browser.close();}
