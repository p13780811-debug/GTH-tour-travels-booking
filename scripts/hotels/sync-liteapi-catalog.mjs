/**
 * GTH PRO LiteAPI static catalogue synchronizer.
 * Official workflow: /data/countries -> paginated /data/hotels -> /data/hotel.
 *
 * Usage (Node 24, trusted server only; secrets supplied via environment):
 *   node scripts/hotels/sync-liteapi-catalog.mjs --country AE --city Dubai --dry-run
 *   node scripts/hotels/sync-liteapi-catalog.mjs --countries AE,IN --write --pages 2
 *   node scripts/hotels/sync-liteapi-catalog.mjs --all-countries --write --pages 2
 *   node scripts/hotels/sync-liteapi-catalog.mjs --country IN --enrich --write --details 8
 *
 * Never a booking/price importer. No cron is activated by this script.
 * Images are provider references, not copied to GTH Storage.
 * Sandbox content stays unpublished; publishing requires a separate review.
 */
import {pathToFileURL} from "node:url";
import {createClient} from "@supabase/supabase-js";
import {normalizeLiteApiHotel,providerHotelRows,safeLiteApiImage} from "../../src/lib/travel/liteapi-view-model.ts";

const API = "https://api.liteapi.travel/v3.0";
const sleep = n => new Promise(resolve => setTimeout(resolve,n));

export function parseArgs(argv) {
  const opt={countries:[],all:false,city:"",dryRun:true,enrich:false,pages:2,pageSize:100,
    delayMs:1500,maxCountries:3,details:8};
  for(let i=0;i<argv.length;i++){
    const flag=argv[i];
    if(flag==="--country"||flag==="--countries"){
      const countries=(argv[++i]??"").toUpperCase().split(",").filter(Boolean);
      if(!countries.length||countries.some(c=>!/^[A-Z]{2}$/.test(c)))throw Error("Invalid ISO country code");
      opt.countries.push(...countries);
    }else if(flag==="--city"){
      opt.city=argv[++i]??"";
      if(!/^[\p{L}\p{M} .'-]{2,80}$/u.test(opt.city))throw Error("Invalid city");
    }else if(flag==="--all-countries")opt.all=true;
    else if(flag==="--write")opt.dryRun=false;
    else if(flag==="--dry-run")opt.dryRun=true;
    else if(flag==="--enrich")opt.enrich=true;
    else if(["--pages","--page-size","--delay-ms","--max-countries","--details"].includes(flag)){
      const num=Number(argv[++i]);
      const field={"--pages":"pages","--page-size":"pageSize","--delay-ms":"delayMs","--max-countries":"maxCountries","--details":"details"}[flag];
      const max=field==="delayMs"?60000:field==="pageSize"?500:field==="details"?100:field==="maxCountries"?250:20;
      const min=field==="delayMs"?1000:1;
      if(!Number.isSafeInteger(num)||num<min||num>max)throw Error("Invalid "+flag);
      opt[field]=num;
    }else throw Error("Unrecognized option "+flag);
  }
  opt.countries=[...new Set(opt.countries)];
  if(opt.city&&(opt.all||opt.countries.length!==1))throw Error("City requires exactly one --country");
  if(!opt.all&&!opt.countries.length)throw Error("Select --country, --countries or --all-countries");
  return opt;
}
const isoTime=v=>{
  if(typeof v!=="string"||!v||!Number.isFinite(Date.parse(v)))return null;
  return new Date(v).toISOString();
};
export function summaryRow(raw,countryCode){
  const hotel=normalizeLiteApiHotel(raw);
  if(!hotel||!/^[A-Z]{2}$/.test(countryCode))return null;
  const r=raw&&typeof raw==="object"?raw:{};
  const coord=v=>typeof v==="number"&&Number.isFinite(v)?v:null;
  const stars=hotel.stars;
  return {
    hotel_id:hotel.id,name:hotel.name,country_code:countryCode,
    city:hotel.city||null,address:hotel.address,
    latitude:coord(r.latitude),longitude:coord(r.longitude),
    stars,hotel_type_id:Number.isSafeInteger(r.hotelTypeId)?r.hotelTypeId:null,
    category:hotel.category,primary_image_url:safeLiteApiImage(hotel.image),
    provider_updated_at:isoTime(r.lastUpdatedAt)
  };
}
export function nextSync(progress,maxOffset,pageSize,rawLength,total){
  const offset=maxOffset+rawLength;
  const complete=rawLength<pageSize||(Number.isSafeInteger(total)&&total>=0&&offset>=total);
  return {next_offset:complete?0:offset,status:complete?"complete":"partial"};
}
async function provider(path,params={},apiKey){
  const url=new URL(API+path);
  for(const [key,value] of Object.entries(params))if(value!==null&&value!==undefined&&value!=="")url.searchParams.set(key,String(value));
  for(let retry=0;retry<4;retry++){
    let response;
    try{response=await fetch(url,{headers:{"X-API-Key":apiKey,Accept:"application/json"},
      redirect:"error",signal:AbortSignal.timeout(18000),cache:"no-store"});}
    catch {if(retry===3)throw Error("LiteAPI connection timed out");await sleep(1200*(retry+1));continue;}
    if(response.status===429||response.status>=500){
      if(retry===3)throw Error("LiteAPI response "+response.status);
      const retryHeader=Number(response.headers.get("retry-after"));
      await sleep(Number.isFinite(retryHeader)&&retryHeader>0&&retryHeader<60?retryHeader*1000:2000*(retry+1));
      continue;
    }
    if(!response.ok)throw Error("LiteAPI request rejected with HTTP "+response.status);
    return await response.json();
  }
  throw Error("LiteAPI retry budget exhausted");
}
async function countries(key){
  const p=await provider("/data/countries",{},key);
  if(!Array.isArray(p?.data))throw Error("Invalid LiteAPI countries response");
  return [...new Set(p.data.map(x=>x?.code).filter(x=>typeof x==="string"&&/^[A-Z]{2}$/.test(x)))].sort();
}
const assertOk = (response,label)=>{
  if(response.error)throw Error(label+" failed; verify schema migration and credentials");
  return response.data;
};
const progressKey = (country,city)=>({country_code:country,city_name:city||""});
async function runCountry(db,key,opt,country,progress){
  const p=progress||{};
  const now=new Date().toISOString();
  const completed=p.status==="complete"&&p.last_completed_at;
  const since=completed?new Date(Date.parse(p.last_completed_at)-300000).toISOString()
    :p.sync_since??null;
  let offset=completed?0:(p.next_offset??0);
  let processed=0,done=false,pages=0;
  while(pages<opt.pages){
    const payload=await provider("/data/hotels",{
      countryCode:country,cityName:opt.city||undefined,offset,limit:opt.pageSize,
      lastUpdatedAt:since
    },key);
    const rawRows=providerHotelRows(payload);
    const valid=[...new Map(rawRows.map(x=>summaryRow(x,country)).filter(Boolean)
      .map(x=>[x.hotel_id,x])).values()];
    if(!opt.dryRun&&valid.length){
      assertOk(await db.rpc("liteapi_upsert_summaries",{p_rows:valid}),"LiteAPI catalogue upsert");
    }
    const total=Number.isSafeInteger(payload?.total)?payload.total:
      Number.isSafeInteger(payload?.data?.total)?payload.data.total:null;
    const next=nextSync(p,offset,opt.pageSize,rawRows.length,total);
    processed+=valid.length;pages++;
    if(!opt.dryRun){
      const state={...progressKey(country,opt.city),next_offset:next.next_offset,
        sync_since:since,last_attempt_at:new Date().toISOString(),
        last_completed_at:next.status==="complete"?now:(p.last_completed_at??null),
        status:next.status,pages_completed:(p.pages_completed??0)+pages,
        rows_processed:(p.rows_processed??0)+processed};
      assertOk(await db.from("liteapi_hotel_sync_progress")
        .upsert(state,{onConflict:"country_code,city_name"}),"LiteAPI sync progress");
    }
    console.log(JSON.stringify({country,city:opt.city||null,offset,returned:rawRows.length,
      accepted:valid.length,complete:next.status==="complete",dryRun:opt.dryRun}));
    if(next.status==="complete"){done=true;break;}
    offset=next.next_offset;
    await sleep(opt.delayMs);
  }
  return {country,pages,accepted:processed,complete:done,dryRun:opt.dryRun};
}
async function enrichCountry(db,key,opt,country) {
  const query=db.from("liteapi_hotel_catalog").select("hotel_id")
    .eq("country_code",country).is("details_fetched_at",null)
    .order("hotel_id",{ascending:true}).limit(opt.details);
  const {data,error}=await query;assertOk({data,error},"Enrichment queue");
  let processed=0;
  for(const target of data||[]){
    const response=await provider("/data/hotel",{hotelId:target.hotel_id},key);
    const detail=normalizeLiteApiHotel(response?.data);
    // Mandatory exact-property identity check. Never attach another hotel's photo.
    if(!detail||detail.id!==target.hotel_id){console.log(JSON.stringify({country,hotelId:target.hotel_id,skipped:"provider ID mismatch"}));continue;}
    if(!opt.dryRun){
      assertOk(await db.from("liteapi_hotel_catalog").update({
        description:detail.description,amenities:detail.amenities,
        gallery_urls:detail.gallery,primary_image_url:detail.image,
        stars:detail.stars,category:detail.category,
        details_fetched_at:new Date().toISOString()
      }).eq("hotel_id",target.hotel_id),"Provider details update");
    }
    processed++;
    console.log(JSON.stringify({country,hotelId:target.hotel_id,photos:detail.gallery.length,
      amenities:detail.amenities.length,stars:detail.stars,dryRun:opt.dryRun}));
    await sleep(opt.delayMs);
  }
  return {country,details:processed,dryRun:opt.dryRun};
}
export async function main(argv=process.argv.slice(2)){
  const opt=parseArgs(argv);
  const key=process.env.LITEAPI_API_KEY;
  if(!key)throw Error("LITEAPI_API_KEY not available in this server environment");
  let db=null;
  if(!opt.dryRun||opt.all||opt.enrich){
    const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!secret)throw Error("Supabase service environment is not configured");
    db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  }
  let list=opt.all?await countries(key):opt.countries;
  if(opt.all){
    const {data,error}=await db.from("liteapi_hotel_sync_progress")
      .select("country_code,city_name,status,last_attempt_at")
      .eq("city_name","");
    assertOk({data,error},"Country planning");
    const lookup=new Map((data||[]).map(x=>[x.country_code,x]));
    list.sort((a,b)=>((lookup.get(a)?.last_attempt_at||"").localeCompare(lookup.get(b)?.last_attempt_at||"")));
  }
  list=list.slice(0,opt.maxCountries);
  const results=[];
  for(const cc of list){
    if(opt.enrich)results.push(await enrichCountry(db,key,opt,cc));
    else{
      const {data,error}=db?await db.from("liteapi_hotel_sync_progress")
        .select("*").eq("country_code",cc).eq("city_name",opt.city||"").maybeSingle():{data:null,error:null};
      if(error)throw Error("Progress read failed");
      results.push(await runCountry(db,key,opt,cc,data));
    }
    await sleep(opt.delayMs);
  }
  console.log(JSON.stringify({completedCountries:results.length,results}));
  return results;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(err=>{console.error(JSON.stringify({error:String(err.message||"Sync failed")}));process.exitCode=1;});
}
