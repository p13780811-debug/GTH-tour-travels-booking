import { authenticatedStorage } from "@/lib/security/auth";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import type { BidderProfile, TenderRequirements } from "@/lib/tender/eligibility";
import { safeTenderSource } from "@/lib/tender/catalog";
import { EMPTY_PREPARATION, parsePreparation, deriveReadiness } from "@/lib/tender/workflow-state";
export const dynamic = "force-dynamic";
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const profileKeys: Array<keyof BidderProfile> = ["business_name","business_country","contact_name","years_experience","annual_turnover","turnover_currency","registrations","available_documents","capability_statement"];
const maxField: Record<string,number>={business_name:160,business_country:2,contact_name:120,years_experience:15,annual_turnover:24,turnover_currency:3,registrations:1500,available_documents:1500,capability_statement:3000};
function sanitizeProfile(value: unknown): BidderProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError("Invalid business profile",400);
  const raw = value as Record<string,unknown>;
  if(Object.keys(raw).some(k=>!profileKeys.includes(k as keyof BidderProfile))) throw new RequestError("Unsupported profile field",400);
  const profile = {} as BidderProfile;
  for(const key of profileKeys) {
    const val = raw[key] ?? "";
    if(typeof val !== "string" || val.length>maxField[key] || /[\u0000-\u0008\u000b\u000e-\u001f]/.test(val)) throw new RequestError("Invalid business profile",400);
    profile[key]=val.trim();
  }
  return profile;
}
function sanitizeRequirements(value:unknown):TenderRequirements {
  if(!value || typeof value!=="object" || Array.isArray(value)) throw new RequestError("Invalid criteria",400);
  const v=value as Record<string,unknown>;
  const supported=["min_experience_years","min_annual_turnover","turnover_currency","eligible_countries","required_registrations","required_documents","notes"];
  if(Object.keys(v).some(k=>!supported.includes(k)))throw new RequestError("Unsupported criterion",400);
  const min=(key:string,max:number)=>{
    const n=v[key];if(n===null||n===undefined||n==="")return null;
    if(typeof n!=="number"||!Number.isFinite(n)||n<0||n>max)return NaN;
    return n;
  };
  const years=min("min_experience_years",150),turnover=min("min_annual_turnover",1e15);
  if(Number.isNaN(years)||Number.isNaN(turnover))throw new RequestError("Invalid numeric criterion",400);
  const list=(key:string,max:number)=> {
    const val=v[key]??[];
    if(!Array.isArray(val)||val.length>25||val.some(x=>typeof x!=="string"||!x.trim()||x.length>max))throw new RequestError("Invalid criteria list",400);
    return val.map((x:string)=>x.trim());
  };
  const currency=v.turnover_currency??"",notes=v.notes??"";
  if(typeof currency!=="string"|| (currency && !/^[A-Z]{3}$/.test(currency))||typeof notes!=="string"||notes.length>2000)throw new RequestError("Invalid criterion metadata",400);
  const countries=list("eligible_countries",2);
  if(countries.some(x=>!/^[A-Z]{2}$/.test(x)))throw new RequestError("Invalid country restriction",400);
  return {
    min_experience_years:years,min_annual_turnover:turnover,turnover_currency:currency,
    eligible_countries:countries,required_registrations:list("required_registrations",120),
    required_documents:list("required_documents",120),notes:notes.trim()
  };
}
export async function GET(req:Request) {
  try {
    const {client,user}=await authenticatedStorage(req);
    const {data,error}=await client.from("tender_bid_workspaces")
      .select("id,tender_id,tender_title,notice_details,bidder_profile,requirement_answers,draft_text,status,created_at,updated_at")
      .eq("owner_id",user.id).order("updated_at",{ascending:false}).limit(25);
    if(error)throw new RequestError("Workspace unavailable",503);
    const ids=[...new Set((data||[]).map(row=>row.tender_id).filter((id):id is string=>typeof id==="string"&&idPattern.test(id)))];
    const catalog=ids.length?await client.from("tenders")
      .select("id,deadline_at,updated_at,requirements_verified,source_url,source_reference")
      .in("id",ids):{data:[],error:null};
    // If the catalog cannot be read, the private drafts still load, but are
    // never labelled verified or refreshed using imaginary official data.
    const byId=new Map((catalog.data||[]).map(t=>[t.id,t]));
    const items=(data||[]).map(row=>{
      let preparation;
      try{preparation=parsePreparation(row.notice_details?.preparation??EMPTY_PREPARATION);}
      catch{preparation=EMPTY_PREPARATION;}
      const live=row.tender_id?byId.get(row.tender_id):null;
      const savedDeadline=preparation.deadline_snapshot;
      const changed=Boolean(live && (Boolean(savedDeadline && savedDeadline!==new Date(live.deadline_at).toISOString()) ||
        Boolean(preparation.source_updated_snapshot && new Date(live.updated_at).getTime()>new Date(preparation.source_updated_snapshot).getTime())));
      const readiness=deriveReadiness(preparation,Boolean(live?.requirements_verified),
        live?.deadline_at??savedDeadline);
      return {...row,readiness,official_notice_changed:changed,
        current_deadline:live?.deadline_at??null,official_source_url:live?.source_url??null,
        source_accessible_in_catalog:Boolean(live)};
    });
    return Response.json({items},{headers:noStore});
  }catch(e){return requestError(e);}
}
export async function POST(req:Request) {
  try {
    const {client,user}=await authenticatedStorage(req);
    const body=await readJson(req,20000);
    const profile=sanitizeProfile(body.profile);
    const requirements=sanitizeRequirements(body.requirements);
    const title=body.title??"",draft=body.draft??"",tenderId=body.tenderId??null,id=body.id??null;
    const notice = body.notice??{};
    if(!notice||typeof notice!=="object"||Array.isArray(notice)||
      Object.keys(notice).some(k=>!["title","buyer","source_reference","source_url","preparation"].includes(k)))
      throw new RequestError("Invalid notice details",400);
    const ni=notice as Record<string,unknown>;
    const lengths:Record<string,number>={title:240,buyer:180,source_reference:160,source_url:2048};
    const noticeDetails:Record<string,string>={};
    for(const [key,max] of Object.entries(lengths)){
      const val=ni[key]??"";
      if(typeof val!=="string"||val.length>max||/[\u0000-\u001f]/.test(val))
        throw new RequestError("Invalid notice details",400);
      noticeDetails[key]=val.trim();
    }
    let preparation;
    try{preparation=parsePreparation(ni.preparation??EMPTY_PREPARATION);}
    catch{throw new RequestError("Invalid preparation progress",400);}
    if(noticeDetails.source_url && !safeTenderSource(noticeDetails.source_url))
      throw new RequestError("Invalid official source URL",400);
    if(typeof title!=="string"||title.length>240||typeof draft!=="string"||draft.length>12000)
      throw new RequestError("Invalid workspace length",400);
    if(tenderId!==null&&(typeof tenderId!=="string"||!idPattern.test(tenderId)))
      throw new RequestError("Invalid tender reference",400);
    if(id!==null&&(typeof id!=="string"||!idPattern.test(id)))
      throw new RequestError("Invalid workspace ID",400);
    await enforceRateLimit(req,"submissions",user.id);
    // Bind the saved snapshot to the real approved catalog record (when one
    // exists). Users can mark their own checks, never official verification.
    let changedOnSave=false;
    let linked:null|{id:string;title:string;buyer:string;source_reference:string;source_url:string;deadline_at:string;updated_at:string;requirements_verified:boolean}=null;
    if(tenderId){
      const {data:source,error:sourceError}=await client.from("tenders")
        .select("id,title,buyer,source_reference,source_url,deadline_at,updated_at,requirements_verified")
        .eq("id",tenderId).maybeSingle();
      if(sourceError)throw new RequestError("Cannot verify linked catalog notice",503);
      if(!source)throw new RequestError("Tender not current; refresh the official notice before saving",409);
      linked=source;
      const hasChangedSinceSaved=Boolean(
        (preparation.deadline_snapshot &&
          new Date(source.deadline_at).toISOString()!==preparation.deadline_snapshot) ||
        (preparation.source_updated_snapshot &&
          new Date(source.updated_at).getTime()>new Date(preparation.source_updated_snapshot).getTime())
      );
      if(hasChangedSinceSaved){
        changedOnSave=true;
        // An actual procurement update invalidates previous checklist assertions.
        // Retain the bidder's draft text, but require all source-linked checks again.
        preparation.notice_reviewed_at=null;
        preparation.checked_documents=[];
        preparation.checked_prebid=[];
      }
      preparation.deadline_snapshot=new Date(source.deadline_at).toISOString();
      preparation.source_updated_snapshot=new Date(source.updated_at).toISOString();
      noticeDetails.title=source.title;
      noticeDetails.buyer=source.buyer;
      noticeDetails.source_reference=source.source_reference;
      noticeDetails.source_url=source.source_url;
    }
    const readiness=deriveReadiness(preparation,Boolean(linked?.requirements_verified),
      linked?.deadline_at??preparation.deadline_snapshot);
    const workflowStatus=readiness.blockers.length?"review_required":"draft";
    const data={
      owner_id:user.id,tender_title:linked?.title??title.trim(),tender_id:tenderId,
      notice_details:{...noticeDetails,preparation},bidder_profile:profile,requirement_answers:requirements,draft_text:draft,status:workflowStatus,
      updated_at:new Date().toISOString()
    };
    const query=id
      ?client.from("tender_bid_workspaces").update(data).eq("id",id).eq("owner_id",user.id)
      :client.from("tender_bid_workspaces").insert(data);
    const {data:stored,error}=await query.select("id,updated_at").single();
    if(error)throw new RequestError("Could not save private draft",503);
    return Response.json({saved:true,id:stored.id,updated_at:stored.updated_at,readiness,source_revalidation_required:changedOnSave},{status:id?200:201,headers:noStore});
  }catch(e){return requestError(e);}
}
export async function DELETE(req:Request) {
  try {
    const {client,user}=await authenticatedStorage(req);
    const id=new URL(req.url).searchParams.get("id");
    if(!id||!idPattern.test(id))throw new RequestError("Invalid workspace ID",400);
    await enforceRateLimit(req,"submissions",user.id);
    const {error}=await client.from("tender_bid_workspaces").delete().eq("id",id).eq("owner_id",user.id);
    if(error)throw new RequestError("Could not delete private draft",503);
    return Response.json({deleted:true},{headers:noStore});
  }catch(e){return requestError(e);}
}
