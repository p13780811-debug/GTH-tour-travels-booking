import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";

const origin="http://127.0.0.1:4100";
const capture="/tmp/gth-native-pixel-qa";
await mkdir(capture,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try {
 for(const colorScheme of ["light","dark"]){
 for(const width of [320,360,390,428]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,colorScheme});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto(origin,{waitUntil:"domcontentloaded",timeout:60000});
  await page.getByText("Your world.",{exact:false}).first().waitFor({timeout:30000});
  await page.getByText("Explore your possibilities").waitFor({timeout:10000});
  await page.getByRole("tab",{name:"Home tab"}).waitFor();
  await page.getByRole("button",{name:"Search Goa hotels"}).waitFor();
  // Pixel evidence must contain loaded real editorial images, not blank cards.
  const images=await page.locator("img").evaluateAll(elements=>
   elements.filter(element=>element.complete&&element.naturalWidth>0).length);
  assert.ok(images>=3,`Expected logo and bundled real journey photos at ${width}px; loaded only ${images}`);
  const overflow=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  assert.ok(overflow.document<=overflow.viewport+3,
   `Unexpected horizontal page overflow at ${width}px: ${JSON.stringify(overflow)}`);
  assert.equal(errors.length,0,`Uncaught UI errors at ${width}px: ${errors.join("; ")}`);
  await page.screenshot({path:`${capture}/native-home-${width}-${colorScheme}.png`,fullPage:true});
  if(width===390){
   await page.getByRole("button",{name:"Search Goa hotels"}).click();
   await page.getByText("Stays & hotels").waitFor({timeout:15000});
   await page.screenshot({path:`${capture}/native-discover-390-${colorScheme}.png`,fullPage:true});
   await page.getByRole("button",{name:"Tenders",exact:true}).click();
   assert.equal(await page.getByRole("textbox",{name:"Search source records"}).inputValue(),"",
    "Switching away from hotel intent must clear stale hotel search from tenders");
   await page.getByText("Tender search region").waitFor({timeout:10000});
   await page.getByRole("button",{name:"Tender region Worldwide"}).click();
   await page.screenshot({path:`${capture}/native-tenders-worldwide-390-${colorScheme}.png`,fullPage:true});
   await page.getByRole("tab",{name:"Saved tab"}).click();
   await page.getByText("My Research Desk").waitFor({timeout:10000});
   await page.screenshot({path:`${capture}/native-saved-390-${colorScheme}.png`,fullPage:true});
   await page.getByRole("tab",{name:"Services tab"}).click();
   await page.getByText("Explore every service").waitFor({timeout:10000});
   await page.getByText("Property tools").waitFor();
   await page.getByText("Tender services").waitFor();
   await page.getByText("Bus journeys",{exact:true}).waitFor();
   await page.getByText("Train journeys",{exact:true}).waitFor();
   await page.getByText("Ferry journeys",{exact:true}).waitFor();
   await page.screenshot({path:`${capture}/native-services-390-${colorScheme}.png`,fullPage:true});
  }
  await context.close();
 }
 }
 console.log("PASS: Expo native UI rendered in light/dark at 320, 360, 390 and 428px; 4 screens, transport services and search navigation");
}finally{await browser.close();}
