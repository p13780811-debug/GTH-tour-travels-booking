/** Local-only source fixtures and HTTP/browser acceptance. Never targets production. */
import {createServer} from "node:http";
import {mkdir,writeFile} from "node:fs/promises";
import {createRequire} from "node:module";
import assert from "node:assert/strict";
const fixturePort=4301;
const base={category:"fort",region_scope:"india",city:"Mumbai",country_code:"IN",country_name:"India",source_license:"ODbL-1.0",latitude:19.11,longitude:72.83,updated_at:"2026-11-08T09:00:00Z",wikidata_qid:null};
const records=[
 {...base,source_id:"node/123",source_url:"https://www.openstreetmap.org/node/123",name:"Fixture Heritage Fort"},
 {...base,source_id:"node/456",source_url:"https://www.openstreetmap.org/node/456",name:"Park",category:"park"},
 {...base,source_id:"node/789",source_url:"https://www.openstreetmap.org/node/789",name:"Museum <script>alert(1)</script>",category:"museum"},
];
if(process.argv.includes("--fixtures")){
 const stats={point:0,related:0,countries:0};
 const server=createServer((req,res)=>{
  if(req.method!=="GET"&&req.method!=="HEAD"){res.writeHead(405);res.end();return;}
  const url=new URL(req.url,"http://127.0.0.1");
  if(url.pathname==="/__stats"){res.setHeader("Content-Type","application/json");res.end(JSON.stringify(stats));return;}
  const table=url.pathname.split("/").at(-1);let data=[];
  if(table==="gth_osm_attraction_country_counts"){stats.countries++;data=[{country_code:"IN",country_name:"India",records:125432},{country_code:"US",country_name:"United States",records:48799}];}
  if(table==="gth_osm_attractions"){
   const id=url.searchParams.get("source_id");
   if(id?.startsWith("eq.")){stats.point++;data=records.filter(row=>row.source_id===id.slice(3));}
   else {stats.related++;data=url.searchParams.get("country_code")==="eq.US"?[]:records;}
  }
  res.setHeader("Content-Type","application/json");res.setHeader("Content-Range",data.length?`0-${data.length-1}/${data.length}`:"*/0");
  res.setHeader("Access-Control-Allow-Origin","*");res.end(req.method==="HEAD"?undefined:JSON.stringify(data));
 });
 server.listen(fixturePort,"127.0.0.1",()=>console.log(`Local read-only fixture API on ${fixturePort}`));
 process.on("SIGTERM",()=>server.close());
}else{
 const origin=process.env.GTH_OSM_QA_ORIGIN||"http://127.0.0.1:4200";
 assert.equal(new URL(origin).hostname,"127.0.0.1","This acceptance script may only target a local test instance");
 const require=createRequire(import.meta.url),{chromium}=require("playwright");
 const evidence="/tmp/gth-osm-place-qa";await mkdir(evidence,{recursive:true});
 const path="/attractions/osm/node-123";
 const first=await fetch(origin+path);assert.equal(first.status,200);const html=await first.text();
 assert.match(html,/Fixture Heritage Fort/);assert.match(html,/https:\/\/www.gthproglobal.com\/attractions\/osm\/node-123/);
 assert.match(html,/TouristAttraction/);assert.doesNotMatch(html,/"offers"|"aggregateRating"/);
 const before=await fetch(`http://127.0.0.1:${fixturePort}/__stats`).then(r=>r.json());
 for(let i=0;i<5;i++){const r=await fetch(origin+path);assert.equal(r.status,200);await r.text();}
 const after=await fetch(`http://127.0.0.1:${fixturePort}/__stats`).then(r=>r.json());
 assert.equal(after.point,before.point,"warm page views must not query Supabase again");
 assert.equal(after.related,before.related,"warm page views must not repeat country reads");
 assert.equal((await fetch(origin+"/attractions/osm/node-0")).status,404);
 assert.equal((await fetch(origin+"/attractions/osm/node-999")).status,404);
 const generic=await fetch(origin+"/attractions/osm/node-456").then(r=>r.text());assert.match(generic,/<meta name="robots" content="noindex, follow"/);
 const index=await fetch(origin+"/attractions/sitemap.xml");assert.equal(index.status,200);assert.match(index.headers.get("cache-control"),/s-maxage=86400/);
 const indexXml=await index.text();assert.equal([...indexXml.matchAll(/<sitemap>/g)].length,175);
 const shard=await fetch(origin+"/attractions/sitemaps/IN/0.xml");assert.equal(shard.status,200);const shardXml=await shard.text();assert.match(shardXml,/node-123/);assert.doesNotMatch(shardXml,/node-456/);
 assert.equal((await fetch(origin+"/attractions/sitemaps/IN/01.xml")).status,404);
 assert.match(await fetch(origin+"/robots.txt").then(r=>r.text()),/Sitemap: https:\/\/www.gthproglobal.com\/attractions\/sitemap.xml/);
 const browser=await chromium.launch({headless:true,executablePath:process.env.GTH_CHROMIUM_PATH||undefined,args:["--no-sandbox"]});
 try{
  for(const width of [320,390,768,1440])for(const theme of ["light","dark"]){
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.route("**/*",route=>new URL(route.request().url()).hostname==="127.0.0.1"?route.continue():route.abort());
   await page.goto(origin+path,{waitUntil:"networkidle"});
   await page.evaluate(value=>{document.documentElement.classList.toggle("dark",value==="dark");document.documentElement.setAttribute("data-theme",value);},theme);
   await page.getByRole("heading",{name:"Fixture Heritage Fort",exact:true}).waitFor();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`${width}/${theme}: page overflow`);
   const klook=await page.getByRole("link").filter({hasText:"Search activities and attraction tickets"}).getAttribute("href");assert.equal(new URL(klook).hostname,"tp.media");
   const directions=page.getByRole("link",{name:"Get directions"});assert.ok((await directions.boundingBox()).height>=44);
   await page.screenshot({path:`${evidence}/osm-place-${width}-${theme}.png`,fullPage:true});await page.close();
  }
  const page=await browser.newPage();let dialog=false;page.on("dialog",async d=>{dialog=true;await d.dismiss();});
  await page.route("**/*",r=>new URL(r.request().url()).hostname==="127.0.0.1"?r.continue():r.abort());
  await page.goto(origin+"/attractions/osm/node-789",{waitUntil:"networkidle"});assert.equal(dialog,false);assert.match(await page.locator("h1").textContent(),/<script>/);
 }finally{await browser.close();}
 const result={status:"PASS",fixtureOnly:true,fontNote:"Local Next font fixtures used; final remote production build validates original Google fonts",warmViewsAdditionalPointReads:after.point-before.point,sitemapShards:175,evidence};
 await writeFile(evidence+"/result.json",JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
