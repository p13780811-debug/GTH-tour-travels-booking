import assert from "node:assert/strict";
import {chromium} from "playwright";
import {readFile,mkdir} from "node:fs/promises";

const base="http://127.0.0.1:3000",folder="/tmp/gth-app-journey-qa/";
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
 const page=await context.newPage();
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));

 // Brochure is generated from a user-consented public mini-catalog, no remote image API.
 await page.goto(base+"/real-estate/broker-catalog",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Broker & partner QR toolkit"}).waitFor();
 await page.waitForLoadState("networkidle",{timeout:30000});
 await page.getByLabel("Your public display name").fill("Demo Agency");
 await page.getByLabel("Public business phone").fill("9876543210");
 await page.getByText("Advanced: enter known project slugs manually").click();
 await page.getByLabel(/Property slugs/).fill("sample-project-one, sample-project-two");
 await page.getByRole("checkbox",{name:/I understand that this link publicly displays/}).check();
 await page.getByRole("button",{name:"Generate QR on this device"}).click();
 await page.getByRole("button",{name:"Download Ready-to-Share Poster (PNG)"}).waitFor();
 const posterPending=page.waitForEvent("download",{timeout:20000});
 await page.getByRole("button",{name:"Download Ready-to-Share Poster (PNG)"}).click();
 const poster=await posterPending;
 assert.match(poster.suggestedFilename(),/visiting-poster-status\.png$/);
 const png=await readFile(await poster.path());
 assert.deepEqual(Array.from(png.subarray(0,8)),[137,80,78,71,13,10,26,10],"Must be a real PNG");
 await page.screenshot({path:folder+"broker-poster-mobile.png",fullPage:true});

 // Tender download uses browser canvas and a hyperlink annotation for quote requests.
 await page.goto(base+"/tender",{waitUntil:"domcontentloaded",timeout:90000});
 await page.getByRole("heading",{name:"GTH PRO Bid Readiness Report"}).waitFor({timeout:90000});
 await page.waitForLoadState("networkidle",{timeout:30000}).catch(()=>{});
 await page.getByLabel("Annual turnover (INR lakh)").fill("150");
 await page.getByLabel("Experience (years)").fill("5");
 await page.getByLabel("Similar completed projects").fill("3");
 await page.getByLabel("MSME registration status").selectOption("registered");
 await page.getByLabel("GST / business documents ready").check();
 await page.getByLabel("Audited financial statements ready").check();
 await page.getByLabel("Exact tender eligibility read").check();
 const pdfPending=page.waitForEvent("download",{timeout:20000});
 await page.getByRole("button",{name:"Download 1-page Readiness PDF"}).click();
 const pdf=await pdfPending;
 assert.match(pdf.suggestedFilename(),/bid-readiness-report\.pdf$/);
 const pdfContent=await readFile(await pdf.path());
 assert.match(pdfContent.subarray(0,8).toString(),/^%PDF-1\./);
 assert.ok(pdfContent.includes(Buffer.from("/Subtype /Link")),"Clickable PDF CTA annotation missing");
 assert.ok(pdfContent.includes(Buffer.from("https://gthproglobal.com/tender/services")),"B2B quote link missing");
 await page.getByText(/Indicative preparation:/).waitFor({timeout:20000});

 // Group share is an explicit button, opens a WhatsApp draft with GTH links.
 await page.goto(base+"/travel",{waitUntil:"domcontentloaded",timeout:60000});
 await page.getByRole("heading",{name:"Plan a trip with friends"}).waitFor({timeout:20000});
 // A Next.js dev SSR form can paint before event handlers hydrate.
 await page.waitForLoadState("networkidle",{timeout:30000}).catch(()=>{});
 await page.getByLabel("Destination city").fill("Kolkata");
 await page.evaluate(()=>{window.__shared="";window.open=(url)=>{window.__shared=String(url);return null;};});
 const send=page.getByRole("button",{name:"Share Match / Trip Plan with Friends"});
 let share="";
 for(let i=0;i<3;i++){
  await send.click();
  share=await page.evaluate(()=>window.__shared||"");
  if(share.startsWith("https://wa.me/?text="))break;
  await page.waitForTimeout(1200);
 }
 const note=await page.locator('[aria-label="Group trip invitation"] [role="status"]').allTextContents();
 assert.ok(share.startsWith("https://wa.me/?text="),"Group WhatsApp draft was not created: "+JSON.stringify({note,errors}));
 const message=new URL(share).searchParams.get("text")||"";
 assert.match(message,/Kolkata/);
 assert.match(message,/\/hotels\?view=booking&city=Kolkata/);
 assert.match(message,/\/flights\?destinationCity=Kolkata/);
 assert.match(message,/Nothing has been sent automatically|Verify official event dates/);
 assert.equal(errors.length,0,"Unexpected client runtime exceptions: "+errors.join(" | "));
 console.log("PASS: real 390px Chromium poster PNG, tender 1-page PDF CTA, trip group WhatsApp composition");
}finally{await browser.close();}
