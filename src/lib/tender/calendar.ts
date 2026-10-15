/** Client-side calendar reminder for the source-published closing time.
 * There is NO automated booking, portal submission or calendar account access.
 */
function utcICS(date:Date):string{
 return date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
}
function icsText(raw:string):string{
 return raw.replace(/[\r\n]+/g," ").slice(0,180)
   .replace(/\\/g,"\\\\").replace(/,/g,"\\,").replace(/;/g,"\\;");
}
export function buildTenderDeadlineCalendar(
  tender:{id:string;title:string;deadline_at:string;source_name:string;source_url:string},
  now=new Date()
):string|null{
 const date=new Date(tender.deadline_at);
 if(!Number.isFinite(date.getTime())||date.getTime()<=now.getTime())return null;
 const uid=tender.id.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,64);
 if(!uid)return null;
 const officialUrl=/^https:\/\//.test(tender.source_url)?tender.source_url.slice(0,2048):"";
 const description="GTH PRO reminder only. Confirm exact submission timezone, corrigenda and eligibility directly on the issuing authority portal. Source: "+tender.source_name+
   (officialUrl?" | "+officialUrl:"");
 const end=new Date(date.getTime()+15*60*1000);
 const lines=[
   "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GTH PRO//Tender Deadline Reminder//EN",
   "CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
   "UID:gth-tender-"+uid+"@gth-pro",
   "DTSTAMP:"+utcICS(now),"DTSTART:"+utcICS(date),"DTEND:"+utcICS(end),
   "SUMMARY:"+icsText("Tender deadline — "+tender.title),
   "DESCRIPTION:"+icsText(description),
   "BEGIN:VALARM","ACTION:DISPLAY","TRIGGER:-P1D",
   "DESCRIPTION:Review official tender deadline and submission documents",
   "END:VALARM","END:VEVENT","END:VCALENDAR"
 ];
 return lines.join("\r\n")+"\r\n";
}
