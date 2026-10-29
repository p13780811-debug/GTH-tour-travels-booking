import {authenticatedStorage} from '@/lib/security/auth';
import {readJson,RequestError,requestError} from '@/lib/security/request';
import {enforceRateLimit} from '@/lib/security/rate-limit';
import {parseWorkspaceCreate,parseWorkspacePatch,number,uuid} from '@/lib/real-estate/workspace-contract';
import {propertyLeadWriter} from '@/lib/real-estate/lead-server';
const tables:Record<string,string>={alerts:'property_search_alerts',notifications:'property_notifications',offers:'property_offers',messages:'property_offer_messages',services:'property_service_requests',reviews:'property_resident_reviews',saved:'property_saved_items',crm_tasks:'property_crm_tasks',reports:'property_market_reports',moderation:'property_resident_reviews',service_admin:'property_service_requests',crm:'property_leads'};
const adminSections=['crm','crm_tasks','reports','moderation','service_admin'];
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'};
function adminCheck(role:unknown){if(role!=='admin')throw new RequestError('Administrator access required',403);}
const failure=()=>new RequestError('Workspace unavailable. Refresh and retry; an offer may have changed or expired.',503);
export async function GET(req:Request){try{
 const params=new URL(req.url).searchParams,resource=params.get('resource')||'notifications';if([...params.keys()].some(k=>!['resource','offer_id','inventory_id'].includes(k))||[...params.keys()].some(k=>params.getAll(k).length!==1))throw new RequestError('Invalid workspace query',400);
 const {client,user}=await authenticatedStorage(req);if(adminSections.includes(resource))adminCheck(user.app_metadata?.role);
 if(resource==='analytics'){const result=await propertyLeadWriter().rpc('property_seller_analytics',{p_owner:user.id}).abortSignal(AbortSignal.timeout(8000));if(result.error)throw failure();return Response.json({items:result.data||[]},{headers});}
 if(resource==='offer_context'){const id=uuid(params.get('inventory_id'));const result=await client.from('property_inventory').select('id,project_id,price_amount,currency,listing_type,properties(title,slug,country,city)').eq('id',id).eq('status','published').abortSignal(AbortSignal.timeout(8000)).maybeSingle();if(result.error)throw failure();return Response.json({unit:result.data},{headers});}
 const table=tables[resource];if(!table)throw new RequestError('Unknown workspace section',400);
 let query=client.from(table).select(resource==='saved'?'project_id,created_at,properties(title,slug)':resource==='crm'?'id,project_name,full_name,phone,email,preferred_unit,budget_range,intent_type,status,created_at':'*');
 if(['alerts','notifications','services','reviews','saved'].includes(resource))query=query.eq('owner_id',user.id);
 if(resource==='offers')query=query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
 if(resource==='messages')query=query.eq('offer_id',uuid(params.get('offer_id')));
 if(resource==='moderation')query=query.eq('status','pending');
 const result=await query.order(resource==='reports'?'observed_on':'created_at',{ascending:resource==='messages'}).limit(resource==='crm'?100:50).abortSignal(AbortSignal.timeout(8000));if(result.error)throw failure();return Response.json({items:result.data||[]},{headers});
}catch(e){return requestError(e);}}
export async function POST(req:Request){try{
 const body=await readJson(req,16000),resource=String(body.resource||'');const values=parseWorkspaceCreate(resource,body);const {client,user}=await authenticatedStorage(req);if(adminSections.includes(resource))adminCheck(user.app_metadata?.role);await enforceRateLimit(req,'estate_workspace',user.id);
 if(resource==='saved'){const slugs=values.slugs as string[];if(!slugs.length)return Response.json({ok:true},{headers});const projects=await client.from('properties').select('id').in('slug',slugs).or('status.is.null,status.neq.archived').limit(100).abortSignal(AbortSignal.timeout(8000));if(projects.error)throw failure();const old=await client.from('property_saved_items').select('project_id').eq('owner_id',user.id).limit(100);if(old.error)throw failure();const seen=new Set((old.data||[]).map(r=>r.project_id));const missing=(projects.data||[]).filter(r=>!seen.has(r.id)).map(r=>({project_id:r.id}));if(missing.length){const inserted=await client.from('property_saved_items').insert(missing);if(inserted.error)throw failure();}return Response.json({ok:true},{headers});}
 if(resource==='reports')Object.assign(values,{reviewed_by:user.id,reviewed_at:new Date().toISOString()});
 const result=await client.from(tables[resource]).insert(values).select('id').abortSignal(AbortSignal.timeout(8000)).single();if(result.error)throw failure();return Response.json({ok:true,id:result.data.id},{status:201,headers});
}catch(e){return requestError(e);}}
export async function PATCH(req:Request){try{
 const body=await readJson(req,10000),resource=String(body.resource||'');const {client,user}=await authenticatedStorage(req);await enforceRateLimit(req,'estate_workspace',user.id);
 if(resource==='lead_stage'){adminCheck(user.app_metadata?.role);if(Object.keys(body).some(k=>!['resource','id','status','expected_status'].includes(k))||!['new','contacted','qualified','viewing','closed_won','closed_lost','spam'].includes(String(body.status))||typeof body.expected_status!=='string')throw new RequestError('Invalid enquiry stage',400);const r=await client.from('property_leads').update({status:body.status}).eq('id',number(body.id,'enquiry reference',Number.MAX_SAFE_INTEGER)).eq('status',body.expected_status).select('id').abortSignal(AbortSignal.timeout(8000)).maybeSingle();if(r.error||!r.data)throw new RequestError('Enquiry changed. Refresh before updating.',409);return Response.json({ok:true},{headers});}
 const values=parseWorkspacePatch(resource,body),id=String(values.id);delete values.id;
 if(['reviews','reports','services','crm_tasks'].includes(resource))adminCheck(user.app_metadata?.role);
 if(resource==='reviews')Object.assign(values,{reviewed_by:user.id,reviewed_at:new Date().toISOString()});
 let q=client.from(tables[resource]).update(resource==='offers'?{...values,version:Number(values.version)+1}:values).eq('id',id);if(resource==='offers')q=q.eq('version',values.version);
 const result=await q.select('id').abortSignal(AbortSignal.timeout(8000)).maybeSingle();if(result.error||!result.data)throw new RequestError('Record changed, expired or unavailable. Refresh before retrying.',409);return Response.json({ok:true},{headers});
}catch(e){return requestError(e);}}
export async function DELETE(req:Request){try{
 const p=new URL(req.url).searchParams,resource=p.get('resource')||'';if(!['alerts','notifications','saved'].includes(resource)||[...p.keys()].some(k=>!['resource','id'].includes(k)))throw new RequestError('Invalid delete request',400);const {client,user}=await authenticatedStorage(req);await enforceRateLimit(req,'estate_workspace',user.id);
 const id=resource==='saved'?number(p.get('id'),'project reference',Number.MAX_SAFE_INTEGER):uuid(p.get('id'));const r=await client.from(tables[resource]).delete().eq('owner_id',user.id).eq(resource==='saved'?'project_id':'id',id).abortSignal(AbortSignal.timeout(8000));if(r.error)throw failure();return Response.json({ok:true},{headers});
}catch(e){return requestError(e);}}
