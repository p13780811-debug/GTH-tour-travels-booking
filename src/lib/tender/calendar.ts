/** Client-side calendar reminder for the source-published closing time.
 * There is NO automated booking, portal submission or calendar account access.
 */
function utcICS(date:Date):string{
 return date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
}
function icsText(raw:string,maxLength=4096):string{
 return raw.replace(/[\r\n]+/g," ").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,"").slice(0,maxLength)
   .replace(/\\/g,"\\\\").replace(/,/g,"\\,").replace(/;/g,"\\;");
}
/** RFC 5545 content lines use at most 75 UTF-8 octets, including continuation space. */
function foldLine(line:string):string{
 const encoder=new TextEncoder();
 const lines:string[]=[];
 let part="",bytes=0;
 for(const character of line){
  const length=encoder.encode(character).length;
  if(bytes+length>75){lines.push(part);part=" ";bytes=1;}
  part+=character;bytes+=length;
 }
 lines.push(part);
 return lines.join("\r\n");
}
function safeOfficialUrl(raw:string):string{
 if(raw.length>2048||/[\u0000-\u0020\u007f]/.test(raw))return "";
 try{
  const url=new URL(raw);
  return url.protocol==="https:"&&!url.username&&!url.password?url.href:"";
 }catch{return "";}
}
export function buildTenderDeadlineCalendar(
  tender:{id:string;title:string;deadline_at:string;source_name:string;source_url:string},
  now=new Date()
):string|null{
 const date=new Date(tender.deadline_at);
 if(!Number.isFinite(date.getTime())||date.getTime()<=now.getTime())return null;
 const uid=tender.id.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,64);
 if(!uid)return null;
 const officialUrl=safeOfficialUrl(tender.source_url);
 const description="GTH PRO reminder only. Confirm exact submission timezone, corrigenda and eligibility directly on the issuing authority portal. Source: "+tender.source_name.slice(0,180)+
   (officialUrl?" | "+officialUrl:"");
 const end=new Date(date.getTime()+15*60*1000);
 const lines=[
   "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GTH PRO//Tender Deadline Reminder//EN",
   "CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
   "UID:gth-tender-"+uid+"@gth-pro",
   "DTSTAMP:"+utcICS(now),"DTSTART:"+utcICS(date),"DTEND:"+utcICS(end),
   "SUMMARY:"+icsText("Tender deadline — "+tender.title,240),
   "DESCRIPTION:"+icsText(description),
   ...(officialUrl?["URL:"+officialUrl]:[]),
   "BEGIN:VALARM","ACTION:DISPLAY","TRIGGER:-P1D",
   "DESCRIPTION:Review official tender deadline and submission documents",
   "END:VALARM","END:VEVENT","END:VCALENDAR"
 ];
 return lines.map(foldLine).join("\r\n")+"\r\n";
}
