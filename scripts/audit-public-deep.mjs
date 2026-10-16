import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const origin="https://www.gthproglobal.com";
const routes=["/","/mega-aggregator","/travel","/flights","/hotels","/tours","/tender","/real-estate","/transfers","/contact"];
mkdirSync("audit-deep",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const findings=[];
for(const path of routes){
  const context=await browser.newContext({viewport:{width:1366,height:768}});
  const page=await context.newPage();
  const badResources=[];
  page.on("response",res=>{
    const status=res.status();
    if(status===403||status===404||status===429||status>=500){
      const u=new URL(res.url());
      badResources.push({status,host:u.hostname,path:u.pathname.slice(0,85),type:res.request().resourceType()});
    }
  });
  let err="",response=null;
  const started=Date.now();
  try{
    response=await page.goto(origin+path,{waitUntil:"domcontentloaded",timeout:35000});
    await page.waitForTimeout(1000);
  }catch(e){err=String(e).slice(0,120)}
  let dom={};
  try{
    dom=await page.evaluate(()=>{
      const visible=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).display!=="none";
      const badButtons=[...document.querySelectorAll("button")].filter(e=>visible(e)&&!e.getAttribute("aria-label")&&!e.getAttribute("title")&&!e.textContent.trim());
      const badInputs=[...document.querySelectorAll("input:not([type=hidden]),select,textarea")].filter(e=>visible(e)&&!e.getAttribute("aria-label")&&!e.getAttribute("aria-labelledby")&&!e.id&&!e.closest("label"));
      const samples=e=>e.map(x=>({tag:x.tagName,html:x.outerHTML.slice(0,380)})).slice(0,8);
      const main=document.querySelector("main");
      return {
        badButtons:samples(badButtons),badInputs:samples(badInputs),
        h1:[...document.querySelectorAll("h1")].map(e=>e.textContent?.trim().slice(0,95)),
        mainLength:(main?.innerText||"").length,
        primaryActionCount:[...document.querySelectorAll("button,a[href]")].filter(visible).length,
        results:[...document.querySelectorAll("article")].length
      };
    });
  }catch(e){err+=" DOM_"+String(e).slice(0,110)}
  let violations=[];
  if(["/","/mega-aggregator","/travel","/hotels","/tender","/tours","/real-estate"].includes(path)){
    try{
      const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
      violations=axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,description:v.help,examples:v.nodes.slice(0,2).map(n=>({target:n.target,summary:n.failureSummary?.slice(0,180)}))}));
    }catch(e){violations=[{id:"AXE_AUDIT_ERROR",error:String(e).slice(0,200)}]}
  }
  const row={path,status:response?.status()||0,loadMs:Date.now()-started,error:err,dom,badResources:badResources.slice(0,25),violations};
  console.log("GTH_DEEP_ROUTE",JSON.stringify(row));findings.push(row);
  await context.close();
}
await browser.close();
writeFileSync("audit-deep/details.json",JSON.stringify(findings,null,2));
console.log("GTH_DEEP_SUMMARY",JSON.stringify({routes:findings.length,brokenResources:findings.reduce((n,x)=>n+x.badResources.length,0),
  axeViolations:findings.reduce((n,x)=>n+x.violations.length,0),
  unlabeledButtons:findings.map(x=>({route:x.path,count:x.dom.badButtons?.length||0})),
  slowest:findings.map(x=>({route:x.path,loadMs:x.loadMs})).sort((a,b)=>b.loadMs-a.loadMs).slice(0,7)}));
