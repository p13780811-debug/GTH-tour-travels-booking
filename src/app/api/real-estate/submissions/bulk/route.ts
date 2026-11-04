import { authenticatedStorage } from "@/lib/security/auth";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { cleanString, cleanPositiveInteger } from "@/lib/security/validators";
import { createHash } from "node:crypto";

/** One authenticated, bounded request for up to 100 independent review submissions.
 * Files are parsed locally; no raw PDF/Excel stored, no approval or publication here.
 */
const PROPERTY_TYPES = ["Apartment","Villa","Penthouse","Commercial","Plot"];
const CURRENCIES = ["INR","AED","USD","GBP","EUR","SGD"];
const MAX_ROWS = 100;

const stringField = (row:Record<string,unknown>,key:string,min:number,max:number):string => {
  const raw=row[key];
  if (typeof raw!=="string" || /[<>\u0000-\u001f\u007f]/.test(raw))
    throw new RequestError("Invalid plain-text "+key,400);
  const value=cleanString(raw,{min,max});
  if(!value)throw new RequestError("Missing or invalid "+key,400);
  return value;
};
const optionalText = (row:Record<string,unknown>,key:string,max:number):string|null => {
  if(row[key]===undefined||row[key]===null||row[key]==="")return null;
  return stringField(row,key,1,max);
};
const positiveMoney = (value:unknown):number|null => {
  if(value===undefined||value===null||value==="")return null;
  if(!/^\d{1,12}(?:\.\d{1,2})?$/.test(String(value)))throw new RequestError("Invalid asking price",400);
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)return null;
  return n;
};
const quantity = (value:unknown,min:number,max:number):number|null => {
  if(value===undefined||value===null||value==="")return null;
  const n=cleanPositiveInteger(value,{min,max});
  if(n===null)throw new RequestError("Invalid property quantity",400);
  return n;
};
type Row = Record<string,unknown>;
type Parsed = {
  title:string;country:string;city:string;location:string;description:string;
  property_type:string;listing_type:string;submitter_role:string;
  target_project_id:number|null;registry_reference:string|null;price_amount:number|null;
  currency:string;bedrooms:number|null;bathrooms:number|null;area_sqft:number|null;
  media_urls:string[];possession_status:string|null;area_basis:string|null;
  agent_registration:string|null;is_new_launch:boolean;media_rights_confirmed:boolean;
};
function validateRow(row:Row,role:string,agentId:string|null):Parsed {
  const title=stringField(row,"title",3,180);
  const country=stringField(row,"country",2,80);
  const city=stringField(row,"city",2,80);
  const location=stringField(row,"location",2,250);
  const description=stringField(row,"description",20,5000);
  const property_type=stringField(row,"property_type",1,30);
  const listing_type=stringField(row,"listing_type",1,10);
  if(!PROPERTY_TYPES.includes(property_type)||!["buy","rent"].includes(listing_type))
    throw new RequestError("Unsupported property or listing type",400);
  const currency=String(row.currency||"INR").toUpperCase();
  if(!CURRENCIES.includes(currency))throw new RequestError("Unsupported currency",400);
  if(role==="agent"&&country.toLowerCase()==="india"&&!/^A\d{11}$/.test(agentId||""))
    throw new RequestError("India channel partners must provide a valid MahaRERA agent registration",400);
  const registry_reference=optionalText(row,"registry_reference",12)?.toUpperCase()||null;
  if(registry_reference&&!/^P\d{11}$/.test(registry_reference))
    throw new RequestError("Invalid MahaRERA project registration",400);
  const area=optionalText(row,"area_value",16);
  let area_sqft:number|null=null;
  if(area){
    if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(area))throw new RequestError("Invalid property area",400);
    const unit=row.area_unit||"sqft";
    if(unit!=="sqm"&&unit!=="sqft")throw new RequestError("Invalid area unit",400);
    const sqft=Math.round(Number(area)*(unit==="sqm"?10.7639104167:1));
    if(!Number.isFinite(sqft)||sqft<1||sqft>1000000)throw new RequestError("Area out of range",400);
    area_sqft=sqft;
  }
  const possession_status=optionalText(row,"possession_status",30);
  if(possession_status&&!["ready_to_move","under_construction","off_plan"].includes(possession_status))
    throw new RequestError("Invalid possession status",400);
  const area_basis=optionalText(row,"area_basis",20);
  if(area_basis&&!["carpet","built_up","plot"].includes(area_basis))
    throw new RequestError("Invalid area basis",400);
  return {
    title,country,city,location,description,property_type,listing_type,
    submitter_role:role,target_project_id:null,registry_reference,
    price_amount:positiveMoney(row.price_amount),currency,
    bedrooms:quantity(row.bedrooms,0,20),bathrooms:quantity(row.bathrooms,0,20),
    area_sqft,media_urls:[],possession_status,area_basis,
    agent_registration:agentId,is_new_launch:false,media_rights_confirmed:false,
  };
}
function duplicateKey(row:Parsed):string {
  // Conservatively distinguish multiple apartment units in the same project.
  const values=[row.registry_reference||"",row.title,row.country,row.city,row.location,
    row.property_type,row.listing_type,String(row.bedrooms??""),
    String(row.area_sqft??""),String(row.price_amount??"")];
  return createHash("sha256").update(values.map(s=>s.trim().toLowerCase()).join("|")).digest("hex");
}
export async function POST(req:Request) {
  try {
    const {client,user}=await authenticatedStorage(req);
    await enforceRateLimit(req,"bulk_submissions",user.id);
    const body=await readJson(req,450_000);
    if(body.authority_confirmed!==true||body.details_confirmed!==true)
      throw new RequestError("Confirm your right to submit these listings and verify the details",400);
    const role=String(body.submitter_role||"");
    if(!["owner","agent","developer","other"].includes(role))
      throw new RequestError("Choose your relationship to the listed properties",400);
    const agentId=body.agent_registration?stringField(body as Row,"agent_registration",3,80).toUpperCase():null;
    if(agentId&&!/^[A-Z0-9 /-]{3,80}$/.test(agentId))
      throw new RequestError("Invalid partner registration",400);
    if(!Array.isArray(body.rows)||body.rows.length<1||body.rows.length>MAX_ROWS)
      throw new RequestError("Submit between 1 and 100 projects per batch",400);
    const parsed:Parsed[]=[];
    for(let i=0;i<body.rows.length;i++){
      const raw=body.rows[i];
      if(!raw||Array.isArray(raw)||typeof raw!=="object")throw new RequestError("Invalid row "+(i+1),400);
      try{parsed.push(validateRow(raw as Row,role,agentId));}
      catch(err){if(err instanceof RequestError)throw new RequestError("Row "+(i+1)+": "+err.message,400);throw err;}
    }
    // Enforce existing registry linkage; never create a duplicate registry identity.
    const refs=[...new Set(parsed.map(x=>x.registry_reference).filter((x):x is string=>Boolean(x)))];
    if(refs.length){
      const {data,error}=await client.from("properties")
        .select("id,rera_id,title,country,city,location").eq("source_type","registry")
        .in("rera_id",refs).limit(MAX_ROWS).abortSignal(AbortSignal.timeout(6500));
      if(error)throw new RequestError("Registry matching temporarily unavailable",503);
      const lookup=new Map((data||[]).map(record=>[String(record.rera_id),record]));
      for(const entry of parsed){
        if(!entry.registry_reference)continue;
        const record=lookup.get(entry.registry_reference);
        if(!record)throw new RequestError("MahaRERA reference not found in registry: "+entry.registry_reference,400);
        entry.target_project_id=Number(record.id);
        entry.title=String(record.title||entry.title);
        entry.country=String(record.country||entry.country);
        entry.city=String(record.city||entry.city);
        entry.location=String(record.location||entry.location);
      }
    }
    // Check duplicates within the upload AND the submitter's existing queue.
    const ownTitles=[...new Set(parsed.map(row=>row.title))];
    const {data:old,error:readError}=await client.from("listing_submissions")
      .select("id,title,country,city,location,property_type,listing_type,bedrooms,area_sqft,price_amount,registry_reference")
      .eq("owner_id",user.id).neq("status","rejected")
      .in("title",ownTitles).limit(2000).abortSignal(AbortSignal.timeout(6500));
    if(readError)throw new RequestError("Duplicate inventory check unavailable",503);
    const prior=new Set((old||[]).map(item=>duplicateKey({
      ...item,
      registry_reference:item.registry_reference||null,
    } as Parsed)));
    const incoming=new Set<string>();
    const clean:Parsed[]=[];let skipped=0;
    for(const row of parsed){
      const key=duplicateKey(row);
      if(prior.has(key)||incoming.has(key)){skipped++;continue;}
      incoming.add(key);clean.push(row);
    }
    if(!clean.length)
      return Response.json({success:true,submitted:0,duplicates:skipped,status:"review"},
        {headers:{"Cache-Control":"private, no-store"}});
    // A single insert is transactional at DB statement level. Authenticated RLS
    // supplies owner_id; no service-role key or privileged bypass.
    const {error}=await client.from("listing_submissions").insert(clean)
      .abortSignal(AbortSignal.timeout(14000));
    if(error)throw new RequestError("Batch submission could not be saved; no rows published",503);
    return Response.json(
      {success:true,submitted:clean.length,duplicates:skipped,status:"review"},
      {status:201,headers:{"Cache-Control":"private, no-store"}},
    );
  } catch(error){return requestError(error);}
}
