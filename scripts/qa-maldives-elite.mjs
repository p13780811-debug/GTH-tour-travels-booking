import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {mkdir,writeFile} from "node:fs/promises";
const {chromium}=createRequire(import.meta.url)("playwright");
const origin=process.env.GTH_MALDIVES_QA_ORIGIN||"http://127.0.0.1:4286";
assert.equal(new URL(origin).hostname,"127.0.0.1");
const evidence="/tmp/gth-maldives-elite-qa";
await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true,
  executablePath:process.env.GTH_CHROMIUM_PATH||undefined,args:["--no-sandbox"]});
const report=[];
try{
  for(const path of ["/maldives-elite-escape","/maldives","/destinations/maldives"]){
    const response=await fetch(origin+path+"?currency=USD&adults=3",{redirect:"manual"});
    if(path==="/maldives-elite-escape"){
      assert.equal(response.status,200,"Canonical page should return HTTP 200");
    }else{
      assert.equal(response.status,301,"Alias must redirect permanently");
      const parsed=new URL(response.headers.get("location")||"");
      assert.equal(parsed.pathname,"/maldives-elite-escape");
      assert.equal(parsed.searchParams.get("currency"),"USD");
      assert.equal(parsed.searchParams.get("adults"),"3");
    }
    report.push({path,status:response.status});
  }
  for(const [width,height] of [[390,844],[1440,900]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    // Fixture-only: outbound provider calls not made, supplier results not claimed.
    await page.route("**/*",async route=>{
      const url=new URL(route.request().url());
      if(url.origin===origin)return route.continue();
      return route.abort();
    });
    const response=await page.goto(origin+"/maldives-elite-escape",
      {waitUntil:"domcontentloaded",timeout:30000});
    assert.equal(response?.status(),200);
    await page.getByRole("heading",{name:"Maldives Elite Escape"}).waitFor();
    await page.locator("#maldives-elite-stay-search").waitFor();
    const layout=await page.evaluate(()=>{
      const form=document.querySelector("#maldives-elite-stay-search");
      const hero=document.querySelector('section[aria-label="Maldives Elite Escape hero"]');
      const nav=document.querySelector('nav[aria-label="GTH PRO mobile app navigation"]');
      if(!form||!hero)throw Error("Missing hotel form or hero");
      const rect=el=>{const r=el.getBoundingClientRect();return{
        top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height,
      }};
      const targets=Array.from(form.querySelectorAll("input,select,button"))
        .filter(x=>x instanceof HTMLElement&&x.type!=="hidden")
        .map(x=>({name:x.getAttribute("name")||x.textContent?.trim().slice(0,20),
          height:rect(x).height}));
      return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        hero:rect(hero),form:rect(form),nav:nav?rect(nav):null,targets};
    });
    assert.ok(layout.scrollWidth<=width+1,"Horizontal overflow at "+width+": "+layout.scrollWidth);
    assert.ok(layout.form.left>=0&&layout.form.right<=width+1,"Form clipped at "+width);
    assert.ok(layout.targets.every(x=>x.height>=43),
      "Undersized inputs at "+width+": "+JSON.stringify(layout.targets));
    assert.ok(errors.length===0,"Client errors at "+width+": "+errors.join("; ").slice(0,300));
    await page.getByRole("button",{name:/Find stays/i}).waitFor();
    assert.equal(await page.locator('input[name="destination"]').inputValue(),"Maldives");
    assert.match(await page.locator('input[name="checkin"]').inputValue(),/^\d{4}-\d{2}-\d{2}$/);
    await page.screenshot({path:evidence+"/maldives-"+width+"x"+height+".png",
      fullPage:true,animations:"disabled"});
    report.push({viewport:width+"x"+height,status:"PASS",layout});
    await page.close();
  }
  await writeFile(evidence+"/results.json",JSON.stringify({fixtureOnly:true,report},null,2));
  console.log(JSON.stringify({status:"PASS",fixtureOnly:true,report:report.map(x=>({
    path:x.path,status:x.status,viewport:x.viewport,overflow:x.layout?.scrollWidth,
  }))}));
}finally{await browser.close();}
