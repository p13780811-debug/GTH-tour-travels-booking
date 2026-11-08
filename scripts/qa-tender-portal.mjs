/** Local-only actual Next.js acceptance with explicit source/auth/payment fixtures. */
import {createServer} from "node:http";
import {mkdir,writeFile} from "node:fs/promises";
import {createRequire} from "node:module";
import assert from "node:assert/strict";
export const TENDER_FIXTURE_PORT=4311;
const ID="edb636b8-1c11-4e70-b0aa-ff38d965c777",ADMIN="edb636b8-1c11-4e70-b0aa-ff38d965c888";
const jwt=role=>Buffer.from(JSON.stringify({alg:"HS256",typ:"JWT"})).toString("base64url")+"."+Buffer.from(JSON.stringify({sub:ADMIN,exp:Math.floor(Date.now()/1000)+86400,role:"authenticated",app_metadata:{role}})).toString("base64url")+".fixture";
if(process.argv.includes("--fixture-server")){
 const token=jwt("admin"),member=jwt("member"),requests=new Map(),stats={reads:0,point:0,batch:0,facets:0,writes:0,budget:0};
 const base={buyer:"Fixture Public Authority",country_code:"IN",region:"Fixture region",sector:"works",summary:"Explicit test notice for procurement of community road maintenance and civil construction. Verify the actual official schedules before preparing a bid.",deadline_at:new Date(Date.now()+14*86400000).toISOString(),published_at:new Date(Date.now()-86400000).toISOString(),imported_at:new Date().toISOString(),estimated_value:120000,currency:"INR",source_name:"World Bank",source_reference:"OP00999999",source_url:"https://projects.worldbank.org/en/projects-operations/procurement-detail/OP00999999",eligibility_requirements:{required_documents:[]},requirements_verified:false};
 const records=Array.from({length:4},(_,i)=>({...base,id:ID.slice(0,-1)+String(7+i),title:["Fixture road works opportunity","Fixture school equipment procurement","Fixture engineering consultancy","Fixture global technology notice"][i],country_code:i===3?"GB":"IN",sector:["works","goods","consultancy","services"][i]}));
 const match=(rows,p)=>rows.filter(row=>[...p].every(([key,value])=>{
  if(["select","order","limit","offset"].includes(key))return true;
  if(["is_public","source_verified"].includes(key))return value==="eq.true";
  if(key==="status")return value==="eq.published";
  if(value.startsWith("eq."))return String(row[key])===value.slice(3);
  if(value.startsWith("in.("))return value.slice(4,-1).split(",").includes(String(row[key]));
  if(value.startsWith("gt."))return String(row[key])>value.slice(3);
  if(value.startsWith("lte."))return String(row[key])<=value.slice(4);
  if(value.startsWith("ilike."))return String(row[key]).toLowerCase().includes(value.slice(6).replace(/[%\\]/g,"").toLowerCase());
  return true;
 }));
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url,"http://127.0.0.1"),p=url.searchParams;
  const send=(body,status=200,headers={})=>{res.writeHead(status,{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",...headers});res.end(req.method==="HEAD"?undefined:JSON.stringify(body));};
  if(req.method==="OPTIONS"){send({});return;}
  if(url.pathname==="/__fixture"){send({token,member,admin:ADMIN,id:ID,records,stats});return;}
  let body={};if(["POST","PATCH"].includes(req.method)){let text="";for await(const part of req)text+=part;try{body=JSON.parse(text);}catch{send({error:"Bad fixture JSON"},400);return;}}
  if(url.pathname==="/redis"){stats.budget++;send({result:[1,0]});return;}
  if(url.pathname==="/auth/v1/user"){
   const bearer=req.headers.authorization;if(bearer!==`Bearer ${token}`&&bearer!==`Bearer ${member}`){send({message:"Invalid fixture token"},401);return;}
   send({id:ADMIN,email:"admin@example.invalid",aud:"authenticated",role:"authenticated",app_metadata:{role:bearer===`Bearer ${token}`?"admin":"member"},user_metadata:{role:"admin"}});return;
  }
  if(url.pathname==="/__reset"){requests.clear();for(const key of Object.keys(stats))stats[key]=0;send({reset:true});return;}
  const table=url.pathname.split("/").at(-1);
  if(table==="partner_applications"){
   const privileged=req.headers.authorization===`Bearer ${token}`||req.headers.authorization==="Bearer fixture-private-writer";
   if(!privileged){send({message:"Fixture RLS denial"},403);return;}
   const id=p.get("id")?.slice(3);
   if(req.method==="POST"){if(requests.has(body.id)){send({code:"23505"},409);return;}stats.writes++;requests.set(body.id,{...body,submitted_at:new Date().toISOString()});send(null,201);return;}
   if(req.method==="PATCH"){
    const row=requests.get(id),expected=p.get("message");
    if(!row||expected&&expected!=="eq."+row.message){send(null);return;}
    stats.writes++;requests.set(id,{...row,...body});send({id,status:body.status??row.status});return;
   }
   stats.reads++;let rows=[...requests.values()];if(id)rows=rows.filter(row=>row.id===id);
   if(p.get("status"))rows=rows.filter(row=>p.get("status")==="eq."+row.status);
   const single=!!id;
   send(single?rows[0]??null:rows,200,{"Content-Range":rows.length?`0-${rows.length-1}/${rows.length}`:"*/0"});return;
  }
  if(req.method!=="GET"&&req.method!=="HEAD"){send({message:"Only fixture intake and admin writes allowed"},405);return;}
  let rows=[];
  if(table==="tenders"){
   stats.reads++;if(p.has("id")&&p.get("id").startsWith("eq."))stats.point++;else if(p.has("id"))stats.batch++;else stats.facets++;
   if(p.get("status")!=="eq.published"||p.get("source_verified")!=="eq.true"||p.get("is_public")!=="eq.true"){send({message:"Fixture requires exact public source gates"},400);return;}
   rows=match(records,p);
  }
  const total=rows.length,offset=Number(p.get("offset")||0),limit=Number(p.get("limit")||1000);rows=rows.slice(offset,offset+limit);
  send(rows,200,{"Content-Range":total?`${offset}-${Math.max(offset,offset+rows.length-1)}/${total}`:"*/0"});
 });
 const preload=`const baseFetch=globalThis.fetch;globalThis.fetch=async function(input,init){const request=new Request(input,init);const url=new URL(request.url);if(url.hostname==='tender-qa.supabase.co')return baseFetch(new Request('http://127.0.0.1:${TENDER_FIXTURE_PORT}'+url.pathname+url.search,request));if(url.hostname==='tender-qa.upstash.io')return baseFetch(new Request('http://127.0.0.1:${TENDER_FIXTURE_PORT}/redis',request));throw Error('External network disabled by explicit local tender fixture');};`;
 await writeFile("/tmp/gth-tender-network-fixture.cjs",preload);
 server.listen(TENDER_FIXTURE_PORT,"127.0.0.1",()=>console.log("Tender fixtures ready: local source/auth/Redis, no production writes"));
 process.on("SIGTERM",()=>server.close());
}else{
 const origin=process.env.GTH_TENDER_QA_ORIGIN||"http://127.0.0.1:4210";assert.equal(new URL(origin).hostname,"127.0.0.1");
 await fetch(`http://127.0.0.1:${TENDER_FIXTURE_PORT}/__reset`,{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
 const fixture=await fetch(`http://127.0.0.1:${TENDER_FIXTURE_PORT}/__fixture`).then(r=>r.json());
 const stats=async()=>(await fetch(`http://127.0.0.1:${TENDER_FIXTURE_PORT}/__fixture`).then(r=>r.json())).stats;
 const evidence="/tmp/gth-tender-portal-qa";await mkdir(evidence,{recursive:true});
 const first=await fetch(origin+"/api/tender?country=IN&lang=en&scope=world");assert.equal(first.status,200);assert.match(first.headers.get("cache-control"),/s-maxage=/);await first.json();
 const before=await stats();for(let i=0;i<40;i++){const r=await fetch(origin+"/api/tender?country=IN&lang=en&scope=world");assert.equal(r.status,200);await r.json();}const after=await stats();assert.equal(after.reads,before.reads,"warm visits cannot repeat DB reads");assert.equal(after.budget,before.budget,"warm visits cannot consume budget again");
 assert.match((await fetch(origin+"/api/tender?scope=world")).headers.get("cache-control"),/private/);
 const forbidden=await fetch(origin+"/api/admin/tender-services",{headers:{Authorization:`Bearer ${fixture.member}`}});assert.equal(forbidden.status,403);
 const require=createRequire(import.meta.url),{chromium}=require("playwright");
 const browser=await chromium.launch({headless:true,executablePath:process.env.GTH_CHROMIUM_PATH||undefined,args:["--no-sandbox"]});
 try{
  for(const width of [320,390,768,1440])for(const theme of ["light","dark"]){
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.route("**/*",r=>new URL(r.request().url()).hostname==="127.0.0.1"?r.continue():r.abort());
   await page.goto(origin+"/tender?country=IN&lang=en&scope=local",{waitUntil:"networkidle"});
   await page.evaluate(value=>{document.documentElement.classList.toggle("dark",value==="dark");document.documentElement.setAttribute("data-theme",value);},theme);
   await page.locator('form[role="search"] input[name="q"]').waitFor();
   const box=await page.locator('form[role="search"] input[name="q"]').boundingBox();assert.ok(box.y<900,`${width}: search must be in first phone screen`);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width}/${theme} overflow`);
   await page.screenshot({path:`${evidence}/tender-discovery-${width}-${theme}.png`,fullPage:true});if(width===390)await page.screenshot({path:`${evidence}/tender-discovery-${theme}-viewport.png`});await page.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:"Asia/Kolkata"});
  await page.route("**/*",async r=>{const url=new URL(r.request().url());if(url.hostname==="127.0.0.1")return r.continue();if(url.hostname==="tender-qa.supabase.co")return r.fulfill({response:await r.fetch({url:`http://127.0.0.1:${TENDER_FIXTURE_PORT}`+url.pathname+url.search})});return r.abort();});
  await page.goto(origin+"/tender?country=IN&lang=en&scope=world",{waitUntil:"networkidle"});
  for(const record of fixture.records.slice(0,3)){await page.getByRole("button",{name:"Save "+record.title,exact:true}).click();await page.getByRole("checkbox",{name:"Compare "+record.title,exact:true}).check();}
  const batchBefore=await stats();await page.goto(origin+"/tender/saved",{waitUntil:"networkidle"});await page.getByRole("heading",{name:fixture.records[0].title,exact:true}).waitFor();const batchAfter=await stats();assert.ok(batchAfter.batch-batchBefore.batch<=1,"one bounded batch read or a warm cache hit");assert.equal(batchAfter.point-batchBefore.point,0,"saved view must not fan out into point reads");
  await page.getByRole("button",{name:/Comparison \(3\/3\)/}).click();await page.getByRole("table").waitFor();
  await page.goto(origin+"/tender/"+ID,{waitUntil:"networkidle"});await page.getByRole("combobox",{name:/^Your decision/}).selectOption("hold");await page.getByLabel("Preparation hours needed",{exact:true}).fill("12");await page.getByLabel("Team hours available",{exact:true}).fill("8");await page.getByLabel("Private decision notes",{exact:false}).fill("Fixture private capacity note — keep on device");
  await page.reload({waitUntil:"networkidle"});assert.equal(await page.getByRole("combobox",{name:/^Your decision/}).inputValue(),"hold");assert.equal(await page.getByLabel("Private decision notes",{exact:false}).inputValue(),"Fixture private capacity note — keep on device");
  await page.getByRole("link",{name:"Optional document-review quote",exact:true}).click();await page.waitForURL(/\/tender\/services/);assert.doesNotMatch(page.url(),/private|capacity|note/);
  await page.getByLabel("Full name *",{exact:true}).fill("Fixture Buyer");await page.getByLabel("Business email *",{exact:true}).fill("qa@example.invalid");await page.getByLabel("Company / business name *",{exact:true}).fill("Fixture Business");await page.getByLabel("Phone with country code *",{exact:false}).fill("+919999999999");await page.getByLabel("Country / service market *",{exact:true}).fill("India");await page.getByLabel("What help do you need? *",{exact:false}).fill("Please review the official document checklist and qualification gaps.");await page.getByRole("checkbox",{name:/I agree to be contacted/}).check();await page.getByRole("button",{name:"Request written quote",exact:true}).click();await page.getByRole("heading",{name:"Service request received"}).waitFor();
  await page.goto(origin+"/tender/coverage?country=IN",{waitUntil:"networkidle"});await page.getByRole("heading",{name:"India CPPP",exact:true}).waitFor();assert.equal(await page.getByRole("heading",{name:"Brazil PNCP",exact:true}).count(),0);
  await page.goto(origin+"/tender?country=AE&lang=ar&scope=world",{waitUntil:"networkidle"});assert.equal(await page.locator("main").getAttribute("dir"),"rtl");assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:`${evidence}/tender-arabic-rtl.png`,fullPage:true});
  await page.addInitScript(({token,admin})=>localStorage.setItem("sb-tender-qa-auth-token",JSON.stringify({access_token:token,refresh_token:"fixture-refresh",expires_at:Math.floor(Date.now()/1000)+86400,token_type:"bearer",user:{id:admin,email:"admin@example.invalid",app_metadata:{role:"admin"}}})),fixture);
  await page.goto(origin+"/admin/tender-services",{waitUntil:"networkidle"});await page.getByRole("button",{name:"Load service queue",exact:true}).click();await page.getByRole("heading",{name:"Fixture Business",exact:true}).waitFor();
  await page.getByRole("button",{name:"Record quote / commercial event",exact:true}).click();await page.getByLabel("Written quote reference",{exact:true}).fill("FIXTURE-QUOTE-01");await page.getByLabel("Quoted service fee",{exact:true}).fill("1250.25");await page.getByRole("checkbox",{name:/I checked this event/}).check();await page.getByRole("button",{name:"Record confirmed commercial event",exact:true}).click();await page.getByText("Commercial stage: quoted",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Record quote / commercial event",exact:true}).click();await page.getByRole("checkbox",{name:/I checked this event/}).check();await page.getByRole("button",{name:"Record confirmed commercial event",exact:true}).click();await page.getByText("Commercial stage: accepted",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Record quote / commercial event",exact:true}).click();await page.getByLabel("Invoice / receipt reference",{exact:true}).fill("FIXTURE-INVOICE-01");await page.getByLabel(/^Payment date/).fill(await page.getByLabel(/^Payment date/).getAttribute("max"));await page.getByRole("checkbox",{name:/I checked this event/}).check();await page.getByRole("button",{name:"Record confirmed commercial event",exact:true}).click();await page.getByText("Commercial stage: paid",{exact:true}).waitFor();await page.getByText("Full-fee payments recorded: 1250.25",{exact:true}).waitFor();
  await page.screenshot({path:`${evidence}/tender-admin-commercial.png`,fullPage:true});
 }catch(error){for(const context of browser.contexts()){const page=context.pages().at(-1);if(page){await page.screenshot({path:`${evidence}/failure.png`,fullPage:true}).catch(()=>{});await writeFile(evidence+"/failure.txt",(await page.locator("body").innerText().catch(()=>"Unavailable")).slice(0,22000));}}throw error;}finally{await browser.close();}
 const result={status:"PASS",fixtureOnly:true,warmViewsAdditionalDbReads:after.reads-before.reads,warmViewsAdditionalBudgetCalls:after.budget-before.budget,checks:"search-first phone UI, day/night, RTL, saved batch/compare, private decision persistence, consented intake, trusted admin quote/accept/full-payment log",evidence};await writeFile(evidence+"/result.json",JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
