import {ArrowUpRight, Compass, MapPin, Ship, Waves} from "lucide-react";
import {partnerSearchHref} from "@/lib/travel/partner-search";

type IndianWaterOption = {
  slug:string; city:string; region:string; title:string; description:string;
  label:string; sourceUrl?:string; searchTerm?:string;
};
const options:readonly IndianWaterOption[]=[
 {slug:"goa-mandovi-dinner",city:"Goa",region:"Mandovi River",title:"Mandovi River Dinner Cruise",description:"A published Goa dining cruise experience with onboard entertainment. Check the actual package and departure before paying.",label:"View Klook experience",sourceUrl:"https://www.klook.com/en-IN/activity/185166-goa-lexicon-dinner-cruise/"},
 {slug:"kerala-alleppey-houseboat",city:"Kerala",region:"Alleppey / Kochi",title:"Alleppey Backwater Houseboat",description:"Explore an existing day houseboat excursion departing from Kochi with time on the Kerala backwaters.",label:"View Klook experience",sourceUrl:"https://www.klook.com/en-IN/activity/6620-alleppey-backwater-cruise-by-houseboat-cochin/"},
 {slug:"mumbai-harbour",city:"Mumbai",region:"Mumbai Harbour",title:"Mumbai Harbour & Yacht Experiences",description:"Explore current provider search results for harbour sailing and yacht experiences. No specific sailing is guaranteed.",label:"Search available cruises",searchTerm:"Mumbai"},
 {slug:"lakshadweep-cruises",city:"Lakshadweep",region:"Island cruise holidays",title:"Lakshadweep Cruise Discovery",description:"Explore provider search results; itineraries, permits and availability must be confirmed with the operator.",label:"Explore cruise options",searchTerm:"Lakshadweep"}
];
const TRACKING={campaign_id:"137",marker:"417668",p:"4110",trs:"504342"};
function reviewedKlookReferral(sourceUrl:string,slug:string):string|null{
 try{
  const url=new URL(sourceUrl);
  if(url.protocol!=="https:"||url.hostname!=="www.klook.com"||url.username||url.password||url.port||url.search||url.hash||!/^\/en-IN\/activity\/[1-9]\d*-[a-z0-9-]+\/$/.test(url.pathname))return null;
  const link=new URL("https://tp.media/r");
  for(const [key,value] of Object.entries(TRACKING))link.searchParams.set(key,value);
  link.searchParams.set("sub_id","gth_india_cruise_"+slug);
  link.searchParams.set("u",url.href);
  return link.href;
 }catch{return null;}
}
export default function IndianWaters(){
 return <section id="indian-waters" aria-labelledby="indian-waters-title" className="mt-10 scroll-mt-24">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]"><Waves size={16} aria-hidden="true"/>India cruise discovery</p>
   <h2 id="indian-waters-title" className="mt-2 text-2xl font-bold">Explore Indian Waters</h2>
   <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">Discover river, harbour and houseboat experiences in India. Go straight to an existing supplier listing or search current options with our partner.</p></div>
   <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--text-soft)]"><Compass size={15} aria-hidden="true"/>India collections</span>
  </div>
  <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
   {options.map(option=>{
    const href=option.sourceUrl?reviewedKlookReferral(option.sourceUrl,option.slug):partnerSearchHref("cruises",option.searchTerm||option.city);
    return <article key={option.slug} data-india-cruise={option.slug} className="flex min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
     <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--gold)]"><MapPin size={14} aria-hidden="true"/>{option.city} · {option.region}</div>
     <div className="mt-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--gold)]"><Ship size={23} aria-hidden="true"/></div>
     <h3 className="mt-4 text-lg font-bold leading-snug">{option.title}</h3>
     <p className="mt-3 flex-1 text-sm leading-6 text-[var(--text-soft)]">{option.description}</p>
     {href?<a href={href} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-semibold">{option.label}<ArrowUpRight size={16} aria-hidden="true"/></a>:<p className="mt-5 text-xs text-[var(--text-soft)]">Provider link currently unavailable.</p>}
    </article>;
   })}
  </div>
  <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">Goa and Kerala link to identified Klook experiences; Mumbai and Lakshadweep use provider searches, not claimed live cruise packages. Booking, pricing, permissions, schedules, payments and support remain with the provider. Affiliate attribution depends on your Travelpayouts program eligibility.</p>
 </section>;
}
