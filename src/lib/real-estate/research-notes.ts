export const RESEARCH_KEY="gth-property-research-v1";
export const RESEARCH_STAGES=["shortlisted","researching","visit_planned","visited","document_review","on_hold"] as const;
export const RESEARCH_CHECKS=[
 ["registration","Check current registration against the official source"],
 ["identity","Confirm the seller or developer's identity and authority"],
 ["availability","Get written availability and a complete cost sheet"],
 ["area","Confirm floor plan, carpet area and measurement basis"],
 ["site","Inspect the property or current construction progress"],
 ["documents","Arrange independent ownership and agreement review"],
] as const;
export type ResearchEntry={stage:typeof RESEARCH_STAGES[number];notes:string;checks:string[];visitDate:string;visitTime:string};
export type ResearchBook=Record<string,ResearchEntry>;
export const emptyResearch=():ResearchEntry=>({stage:"shortlisted",notes:"",checks:[],visitDate:"",visitTime:""});
const validSlug=(v:string)=>v.length<=160&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
export function validVisitDate(v:string){if(!/^20\d{2}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+"T12:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;}
export function normalizeResearch(raw:unknown):ResearchBook{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {};
 const result:ResearchBook={};
 for(const [slug,value] of Object.entries(raw).slice(0,100)){
  if(!validSlug(slug)||!value||typeof value!=="object"||Array.isArray(value))continue;
  const e=value as Record<string,unknown>;
  result[slug]={stage:RESEARCH_STAGES.includes(e.stage as ResearchEntry["stage"])?e.stage as ResearchEntry["stage"]:"shortlisted",notes:typeof e.notes==="string"?e.notes.normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,"").slice(0,3000):"",checks:Array.isArray(e.checks)?[...new Set(e.checks.filter((item):item is string=>typeof item==="string"&&RESEARCH_CHECKS.some(([key])=>key===item)))]:[],visitDate:typeof e.visitDate==="string"&&validVisitDate(e.visitDate)?e.visitDate:"",visitTime:typeof e.visitTime==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(e.visitTime)?e.visitTime:""};
  if(Object.keys(result).length===50)break;
 }
 return result;
}
function fold(line:string){let output="",current="",bytes=0;const encoder=new TextEncoder();for(const char of line){const size=encoder.encode(char).length;if(bytes+size>75){output+=current+"\r\n ";current="";bytes=1;}current+=char;bytes+=size;}return output+current;}
const escapeIcs=(v:string)=>v.replace(/\\/g,"\\\\").replace(/\r\n|\r|\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");
export function personalVisitCalendar(slug:string,title:string,e:ResearchEntry):string|null{
 if(!validSlug(slug)||!validVisitDate(e.visitDate)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.visitTime))return null;
 const date=e.visitDate.replaceAll("-","")+"T"+e.visitTime.replace(":","")+"00";
 return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GTH PRO//Personal Property Research//EN","BEGIN:VEVENT",`UID:gth-${slug}-${date}@gthproglobal.com`,"DTSTAMP:"+new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z"),`DTSTART:${date}`,"DURATION:PT1H",`SUMMARY:${escapeIcs(("Personal property visit: "+title).slice(0,240))}`,"DESCRIPTION:Personal reminder only. Confirm with the property contact. No appointment has been booked through GTH PRO.","END:VEVENT","END:VCALENDAR",""].map(fold).join("\r\n");
}
