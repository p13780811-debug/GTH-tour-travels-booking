/**
 * GTH PRO — conservative procurement preparation intelligence.
 *
 * Never guess qualification thresholds, compulsory registration, fees, EMD,
 * scheduled pre-bid meetings, or final eligibility from titles/AI keywords.
 * Only a source-reviewed requirement is labelled "official requirement".
 * Industry classification is a search/navigation hint, not an authority claim.
 */
import type { TenderRequirements } from "./eligibility";

export type TenderBriefInput = {
  title:string; summary:string|null; sector:string; country_code:string;
  buyer:string; deadline_at:string; source_name:string;
  requirements_verified:boolean; eligibility_requirements:TenderRequirements|null;
};
export type IndustrySignal = { id:string; label:string; keywords:string[]; basis:"title"|"summary" };
export type DocumentTask = { id:string; title:string; purpose:string; source:"reviewed"|"suggested"; required:boolean };
export type ReviewStage = { id:string; title:string; description:string; status:"confirm-at-source" };
export type TenderIntelligence = {
  signals:IndustrySignal[];
  tasks:DocumentTask[];
  attendance:ReviewStage[];
  bidSteps:ReviewStage[];
  criteriaStatus:"officially-reviewed"|"not-published";
  noticeStatus:"accepting-notices"|"deadline-passed";
};
const INDUSTRIES:ReadonlyArray<{id:string;label:string;patterns:ReadonlyArray<RegExp>}>= [
 {id:"construction",label:"Construction & civil works",patterns:[/\bconstruction\b/i,/\b(building|renovation|civil works|contractor|masonry|housing)\b/i]},
 {id:"roads",label:"Roads & transport infrastructure",patterns:[/\b(road|bridge|highway|railway|tunnel|airport|metro|port infrastructure)\b/i]},
 {id:"software",label:"IT, software & cybersecurity",patterns:[/\b(software|cybersecurity|information technology|cloud hosting|digital platform|erp|data center|web application|ict)\b/i]},
 {id:"equipment",label:"Electronics & equipment",patterns:[/\b(equipment|machinery|hardware|instrument|device|electrical parts|sensor|generator)\b/i]},
 {id:"health",label:"Healthcare & pharmaceuticals",patterns:[/\b(hospital|medical|pharmaceutical|vaccine|diagnostic|laboratory|healthcare|clinical)\b/i]},
 {id:"energy",label:"Energy & power",patterns:[/\b(solar|renewable energy|electricity|power plant|substation|grid|wind farm|battery storage)\b/i]},
 {id:"water",label:"Water, sanitation & environment",patterns:[/\b(water supply|sewage|wastewater|sanitation|waste management|solid waste|drainage|pollution)\b/i]},
 {id:"education",label:"Education & training",patterns:[/\b(education|school|university|teacher training|classroom|learning management|curriculum)\b/i]},
 {id:"agriculture",label:"Agriculture & food",patterns:[/\b(agriculture|agricultural|seed|crop|irrigation|livestock|food supply|fertilizer)\b/i]},
 {id:"professional",label:"Professional & consulting services",patterns:[/\b(consultancy|consulting|audit|legal advisory|professional services|feasibility study|engineering design)\b/i]},
 {id:"security",label:"Security & safety",patterns:[/\b(security guard|surveillance|fire safety|protective equipment|emergency response|public safety)\b/i]},
 {id:"logistics",label:"Logistics & transportation",patterns:[/\b(logistics|transport service|fleet|freight|shipping|vehicle hire|warehouse|distribution)\b/i]},
 {id:"telecom",label:"Telecommunications",patterns:[/\b(telecommunication|broadband|fiber optic|mobile network|telecom)\b/i]},
 {id:"cleaning",label:"Facilities & maintenance",patterns:[/\b(cleaning|facility management|housekeeping|maintenance service|groundskeeping)\b/i]}
];
const BASE_TASKS:ReadonlyArray<Pick<DocumentTask,"id"|"title"|"purpose">>=[
 {id:"incorporation",title:"Business registration evidence",purpose:"Confirm the authority accepts your registration form and country."},
 {id:"authorisation",title:"Authorized signatory proof",purpose:"Check signature format, authorization and portal requirements."},
 {id:"tax",title:"Applicable tax registrations",purpose:"Do not assume tax registrations are mandatory in every country."},
 {id:"experience",title:"Relevant work and references",purpose:"Verify project scope, dates, buyer references and thresholds."},
 {id:"financial",title:"Financial statements and turnover",purpose:"Check the official financial year, audited status and currency."},
 {id:"technical",title:"Technical response and specifications",purpose:"Confirm all lots, performance tests, drawings and formats."},
 {id:"declaration",title:"Declarations and compliance forms",purpose:"Use only the latest official templates and sign where required."},
 {id:"security",title:"Bid security / guarantee check",purpose:"Check if any EMD/bond or exemption is actually required."},
 {id:"pricing",title:"BOQ / price schedule check",purpose:"Use the original prescribed price sheet; do not enter bid prices into GTH PRO."}
];
function safeText(v:unknown,max=700):string {return typeof v==="string"?v.slice(0,max):"";}
function compact(v:string):string {return v.replace(/\s+/g," ").trim().slice(0,120);}
export function industrySignals(title:string,summary:string|null):IndustrySignal[]{
 const titleText=safeText(title,500),summaryText=safeText(summary,1800);
 const found:IndustrySignal[]=[];
 for(const industry of INDUSTRIES){
   const titleTokens=industry.patterns.filter(p=>p.test(titleText));
   const summaryTokens=industry.patterns.filter(p=>p.test(summaryText));
   if(titleTokens.length||summaryTokens.length){
     const basis=titleTokens.length?"title":"summary";
     const selected=titleTokens.length?titleTokens:summaryTokens;
     found.push({id:industry.id,label:industry.label,basis,keywords:selected
       .slice(0,3).map(p=>p.source.replaceAll("\\b","").replace(/[()|]/g," ").slice(0,40))});
   }
 }
 return found.sort((a,b)=>Number(b.basis==="title")-Number(a.basis==="title"))
   .slice(0,4);
}
function cleanedReviewedDocuments(req:TenderRequirements|null):string[] {
 if(!req || !Array.isArray(req.required_documents))return [];
 return [...new Set(req.required_documents.filter(
   v=>typeof v==="string"&&v.trim().length>=3&&v.length<=160
 ).map(v=>compact(v)))].slice(0,30);
}
export function prepareTenderIntelligence(notice:TenderBriefInput, now=new Date()):TenderIntelligence{
 const reviewed=notice.requirements_verified===true;
 const mandatory=reviewed?cleanedReviewedDocuments(notice.eligibility_requirements):[];
 const signals=industrySignals(notice.title,notice.summary);
 const tasks:DocumentTask[]=mandatory.map((name,i)=>({
   id:"official-"+i,title:name,purpose:"Verify format, validity, date and issuing-authority amendment.",
   source:"reviewed",required:true
 }));
 for(const suggestion of BASE_TASKS) {
   if(tasks.some(task=>task.title.toLowerCase()===suggestion.title.toLowerCase()))continue;
   tasks.push({...suggestion,source:"suggested",required:false});
 }
 const attendance:ReviewStage[]=[
   {id:"meeting",title:"Pre-bid meeting / clarification session",description:"Check whether attendance is scheduled, compulsory, online or onsite in the latest notice.",status:"confirm-at-source"},
   {id:"visit",title:"Site inspection / demonstration",description:"Check whether an onsite visit, sample, demo or attendance certificate is specified.",status:"confirm-at-source"},
   {id:"queries",title:"Questions and clarification deadline",description:"Check the enquiry window, communication channel and published responses.",status:"confirm-at-source"}
 ];
 const bidSteps:ReviewStage[]=[
   {id:"eligibility",title:"Eligibility and qualification",description:"Verify turnover, experience, licenses, JV rules and exclusion criteria against official documents.",status:"confirm-at-source"},
   {id:"technical",title:"Technical schedules & lots",description:"Confirm quantity, specifications, supporting annexures and mandatory forms.",status:"confirm-at-source"},
   {id:"financial",title:"Commercial bid & currency",description:"Check exact BOQ, bid currency, taxes and security terms on the official portal.",status:"confirm-at-source"},
   {id:"submission",title:"Portal registration & submission",description:"Confirm portal account, signature/DSC, format, time zone and receipt requirements.",status:"confirm-at-source"}
 ];
 const deadline=Date.parse(notice.deadline_at);
 return {signals,tasks,attendance,bidSteps,
   criteriaStatus:reviewed?"officially-reviewed":"not-published",
   noticeStatus:Number.isFinite(deadline)&&deadline>now.getTime()?"accepting-notices":"deadline-passed"
 };
}
