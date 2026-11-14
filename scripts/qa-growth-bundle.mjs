import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,readFile} from "node:fs/promises";

const base="http://127.0.0.1:3000";
const folder="/tmp/gth-app-journey-qa/";
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
 const page=await context.newPage();
 const clientErrors=[];
 page.on("pageerror",error=>clientErrors.push(error.message));
 const remoteQrRequests=[];
 page.on("request",req=>{if(/qrserver|quickchart|chart\.googleapis/i.test(req.url()))remoteQrRequests.push(req.url());});
 await page.goto(base+"/real-estate/broker-catalog",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Broker & partner QR toolkit"}).waitFor({timeout:25000});
 // Next.js SSR can paint controls before React has bound their events in dev.
 // Wait for the actual interactable/hydrated client component, not just the
 // server-rendered heading, before checking the consent rejection.
 await page.waitForLoadState("networkidle",{timeout:30000});
 const generate=page.getByRole("button",{name:"Generate QR on this device"});
 const consentWarning=page.getByText(/Confirm that you agree to publish/);
 for(let attempt=0;attempt<3;attempt++){
  await generate.click();
  try{await consentWarning.waitFor({timeout:4000});break;}
  catch(error){
   if(attempt===2)throw Error("QR consent control did not respond after hydration: "+JSON.stringify(clientErrors)+"; "+String(error));
   await page.waitForTimeout(1500);
  }
 }
 await page.getByLabel("Your public display name").fill("Example Agency");
 await page.getByLabel("Public business phone").fill("9876543210");
 await page.getByLabel(/Property slugs/).fill("sample-project-one, sample-project-two");
 await page.getByRole("checkbox",{name:/I understand that this link publicly displays/}).check();
 await page.getByRole("button",{name:"Generate QR on this device"}).click();
 const qr=page.getByRole("img",{name:/Locally generated QR code/});
 await qr.waitFor({timeout:25000});
 const svgUrl=await qr.getAttribute("src");
 assert.ok(svgUrl?.startsWith("data:image/svg+xml"),"QR must render entirely on device");
 assert.ok(decodeURIComponent(svgUrl).includes("<path d="),"QR module path missing");
 assert.deepEqual(remoteQrRequests,[],"QR generator must not hit third-party servers");
 const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(dims.scroll<=dims.width+3,`QR mobile overflow: ${JSON.stringify(dims)}`);
 const pending=page.waitForEvent("download",{timeout:20000});
 await page.getByRole("button",{name:"Save printable QR"}).click();
 const qrDownload=await pending;
 assert.match(qrDownload.suggestedFilename(),/\.svg$/);
 const svgFile=await readFile(await qrDownload.path(),"utf8");
 assert.match(svgFile,/Scan to view property research/);
 await page.getByRole("link",{name:"Preview catalog"}).click();
 await page.getByRole("heading",{name:"Property mini-catalog"}).waitFor({timeout:30000});
 assert.ok(await page.getByText("Example Agency").isVisible());
 assert.ok(page.url().includes("phone=9876543210"));
 assert.equal(await page.getByRole("link",{name:"View source-backed details"}).count(),2);
 await page.screenshot({path:folder+"broker-catalog-390.png",fullPage:true});

 // Read-only accommodation records are deterministic Playwright fixtures.
 // Nuitee supplier widget, Supabase DB and production APIs are never invoked.
 await page.route("**/api/hotels?*",async route=>{
  const items=[1,2].map(n=>({id:"osm:node-"+n,name:"Example Hotel "+n,city:"Mumbai",country:"IN",
   category:"hotel",source:"OpenStreetMap",image:"/placeholder.jpg",stars:null,affiliate_link:null,booking_ready:false}));
  await route.fulfill({status:200,contentType:"application/json",headers:{"X-GTH-Total":"2","X-GTH-Has-More":"false"},body:JSON.stringify(items)});
 });
 await page.goto(base+"/hotels/results?city=Mumbai",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Example Hotel 1"}).waitFor({timeout:25000});
 await page.getByRole("heading",{name:"Example Hotel 2"}).waitFor();
 const checkboxes=page.getByRole("checkbox",{name:"Compare"});
 assert.equal(await checkboxes.count(),2);
 await checkboxes.nth(0).check();
 await checkboxes.nth(1).check();
 const pdfPending=page.waitForEvent("download",{timeout:20000});
 await page.getByRole("button",{name:"Download comparison PDF"}).click();
 const pdf=await pdfPending;
 assert.match(pdf.suggestedFilename(),/\.pdf$/);
 const pdfBytes=await readFile(await pdf.path());
 assert.equal(pdfBytes.subarray(0,8).toString("ascii"),"%PDF-1.4");
 assert.ok(pdfBytes.includes(Buffer.from("/Subtype /Link")),"First-party PDF link annotations missing");
 assert.ok(pdfBytes.length>2000,"PDF appears empty");
 // WhatsApp is only opened from a direct click; we intercept it, never send.
 await page.evaluate(()=>{window.__gthShareUrl="";window.open=(url)=>{window.__gthShareUrl=String(url);return null;};});
 await page.getByRole("button",{name:"Share on WhatsApp"}).first().click();
 const wa=await page.evaluate(()=>window.__gthShareUrl);
 assert.ok(wa.startsWith("https://wa.me/?text="));
 const preview=new URL(wa).searchParams.get("text")||"";
 assert.match(preview,/GTH PRO.*Hotel source guide/);
 assert.match(preview,/http:\/\/127\.0\.0\.1:3000\/hotels\/stay/);
 await page.screenshot({path:folder+"hotel-compare-share-390.png",fullPage:true});
 await context.close();
 console.log("PASS: real Android-sized QR/consent/catalog, one-click PDF, first-party WhatsApp intent; no QR API, DB writes, or supplier calls.");
}finally{await browser.close();}
