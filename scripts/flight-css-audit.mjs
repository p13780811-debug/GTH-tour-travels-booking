/* Audit the public Flights page under actual Chromium, without modifying production.
   Compare the same build with vendor WL loading blocked vs allowed.
   All output contains public DOM/style information only. */
import { chromium } from "playwright";

const pageUrl = "https://www.gthproglobal.com/flights";
const browser = await chromium.launch({headless:true,args:["--no-sandbox"]});

async function inspect(blockVendor,rewriteVendor=false){
  const context = await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});
  const page = await context.newPage();
  const errors=[];
  const externalCSS=[];
  page.on("pageerror",e=>errors.push(e.message.slice(0,200)));
  page.on("response",res=>{
    if(res.request().resourceType()==="stylesheet") externalCSS.push({status:res.status(),url:res.url().slice(0,240)});
  });
  if(blockVendor) await page.route(/https:\/\/(?:tpwidg|tpwgts)\.com\/wl_web\/main\.js/,route=>route.abort("blockedbyclient"));
  await page.goto(pageUrl,{waitUntil:"domcontentloaded",timeout:55000});
  await page.waitForTimeout(3000);
  const snap=async(label)=>page.evaluate((label)=>{
    const $=s=>document.querySelector(s);
    const nav=$('nav[aria-label="GTH PRO mobile app navigation"]');
    const search=$('#tpwl-search');
    const hero=$('main[data-gth-flight-page="true"] h1');
    const category=$('nav[aria-label="Flight travel categories"]');
    const header=$('nav.sticky') || $('nav[aria-label="GTH PRO mobile app navigation"]');
    const styleInfo=[...document.head.querySelectorAll("style,link[rel=stylesheet]")].map(n=>({
      type:n.tagName, href:n.getAttribute("href")?.slice(0,150)||null,
      id:n.id||null, data:n.getAttribute("data-gth-white-label")||null,
      length:n.tagName==="STYLE"?(n.textContent||"").length:null,
      excerpt:n.tagName==="STYLE"?(n.textContent||"").slice(0,130).replace(/\s+/g," "):null,
    }));
    const format=n=>n?{display:getComputedStyle(n).display,
      font:getComputedStyle(n).fontFamily,
      width:Math.round(n.getBoundingClientRect().width),
      left:Math.round(n.getBoundingClientRect().left),
      height:Math.round(n.getBoundingClientRect().height)}:null;
    return {
      label,route:location.href,
      mobileNav:format(nav),hero:format(hero),categories:format(category),header:format(header),
      searchChildren:search?.childElementCount||0,
      searchControls:search?.querySelectorAll('input,button,select,[role="combobox"]').length||0,
      searchText:(search?.textContent||"").trim().slice(0,135),
      errorVisible:document.body.innerText.includes("Flight search is unavailable right now"),
      styles:styleInfo,
    };
  },label);
  let before=await snap("3s");
  let after=before;
  let rewrite = null;
  if(rewriteVendor) {
    rewrite = await page.evaluate(() => {
      const node = [...document.head.querySelectorAll("style")].find(s=>(s.textContent||"").length>100000);
      if(!node) return {found:false};
      const raw=node.textContent||"";
      const sample={starts:raw.slice(0,180),hasImportant:raw.includes("!important"),hasLayer:raw.includes("@layer"),hasImport:raw.includes("@import"),hasCharset:raw.includes("@charset")};
      node.textContent = "@layer base {" + raw + "}";
      return {found:true,length:raw.length,sample,parsedRules:node.sheet?.cssRules.length||0};
    });
    await page.waitForTimeout(1500);
  }
  if(!blockVendor){await page.waitForTimeout(rewriteVendor?3500:22000);after=await snap(rewriteVendor?"layered-vendor":"25s");}
  await page.screenshot({path:blockVendor?"flights-no-widget.png":rewriteVendor?"flights-layered-widget.png":"flights-widget.png",fullPage:false});
  await context.close();
  return {blocked:blockVendor,rewriteVendor,first:before,last:after,rewrite,errors:errors.slice(0,12),stylesheets:externalCSS.slice(0,16)};
}
try{
 const clean=await inspect(true);
 const widget=await inspect(false);
 const layered=await inspect(false,true);
 function slim(v){return {blocked:v.blocked,
    first:{...v.first,styles:v.first.styles.length},rewrite:v.rewrite,
    last:{...v.last,styles:v.last.styles.length},
    added:widget.blocked?[]:v.last.styles.filter(s=>!clean.first.styles.some(b=>b.href===s.href && b.excerpt===s.excerpt)).slice(0,20),
    errors:v.errors,stylesheets:v.stylesheets};}
 console.log("FLIGHT_CSS_AUDIT_START");
 console.log(JSON.stringify({withoutVendor:slim(clean),withVendor:slim(widget),layeredVendor:slim(layered)},null,2));
 console.log("FLIGHT_CSS_AUDIT_END");
}finally{await browser.close();}
