import {TENDER_ID} from "./discovery-workspace";
export const PURSUIT_KEY="gth-tender-pursuit-v1";
export type PursuitDecision="review"|"pursue"|"hold"|"decline";
export type PursuitPlan={decision:PursuitDecision;reason:string;requiredHours:string;availableHours:string;deadlineSnapshot:string;reviewedAt:string|null};
export const NEW_PURSUIT:PursuitPlan={decision:"review",reason:"",requiredHours:"",availableHours:"",deadlineSnapshot:"",reviewedAt:null};
export function parsePursuits(raw:string|null):Record<string,PursuitPlan>{
 const output:Record<string,PursuitPlan>={};if(!raw||raw.length>100000)return output;
 try{
  const value=JSON.parse(raw);if(value.version!==1||!value.plans||typeof value.plans!=="object"||Array.isArray(value.plans))return output;
  for(const [id,row] of Object.entries(value.plans).slice(0,40)){
   if(!TENDER_ID.test(id)||!row||typeof row!=="object")continue;
   const p=row as Record<string,unknown>;
   if(!["review","pursue","hold","decline"].includes(String(p.decision)))continue;
   const hours=(n:unknown)=>typeof n==="string"&&/^(?:|\d{1,4}(?:\.\d{1,2})?)$/.test(n)?n:"";
   output[id.toLowerCase()]={decision:p.decision as PursuitDecision,reason:typeof p.reason==="string"?p.reason.replace(/[\u0000-\u001f\u007f]/g," ").slice(0,600):"",
    requiredHours:hours(p.requiredHours),availableHours:hours(p.availableHours),deadlineSnapshot:typeof p.deadlineSnapshot==="string"&&Number.isFinite(Date.parse(p.deadlineSnapshot))?p.deadlineSnapshot:"",
    reviewedAt:typeof p.reviewedAt==="string"&&Number.isFinite(Date.parse(p.reviewedAt))?p.reviewedAt:null};
  }
 }catch{}return output;
}
export function pursuitCapacity(plan:PursuitPlan){
 if(!plan.requiredHours||!plan.availableHours||[plan.requiredHours,plan.availableHours].some(value=>!/^\d{1,4}(?:\.\d{1,2})?$/.test(value)||Number(value)>9999))return {known:false,gap:0};
 return {known:true,gap:Math.max(0,Number(plan.requiredHours)-Number(plan.availableHours))};
}
export function personalMilestones(deadline:string,now=Date.now()){
 const end=Date.parse(deadline);if(!Number.isFinite(end))return [];
 return [{id:"decision",label:"Make your bid / no-bid decision",hours:72},{id:"draft",label:"Target an internal draft",hours:48},{id:"review",label:"Target an internal review",hours:24},{id:"source",label:"Recheck the official deadline and portal",hours:2}]
 .map(task=>({...task,at:new Date(end-task.hours*3600000).toISOString(),upcoming:end-task.hours*3600000>now}));
}
