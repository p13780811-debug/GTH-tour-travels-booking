import Image from "next/image";
import {ArrowUpRight,Check,MapPin,Waves} from "lucide-react";
import {buildCruiseProviderSearch} from "@/lib/travel/cruise-provider-search";

type Photo={file:string;author:string;license:string;licenseUrl:string;caption:string;alt:string};
type IndianWaterOption={
 slug:string;city:string;region:string;title:string;description:string;
 highlights:readonly string[];label:string;photo:Photo;sourceUrl?:string;affiliateUrl?:string;
};
// Fixed editorial photograph sources from Wikimedia Commons. They represent the
// destination/boat type; they do NOT certify the vessel in any supplier package.
const photos={
 goa:{file:"Touristboat on mandovi.JPG",author:"KalervoK",license:"CC BY 3.0",licenseUrl:"https://creativecommons.org/licenses/by/3.0/",caption:"Tourist boat on the Mandovi River · representative vessel",alt:"Tourist boat on the Mandovi River in Goa"},
 kerala:{file:"Houseboat on Alleppey backwaters (Kerala, India 2023) (52704323376).jpg",author:"Paul Arps",license:"CC BY 2.0",licenseUrl:"https://creativecommons.org/licenses/by/2.0/",caption:"Alleppey houseboat · representative vessel",alt:"Houseboat floating on Kerala's Alleppey backwaters"},
 mumbai:{file:"Boats in GOI.JPG",author:"Wikimedia Commons contributor",license:"See source",licenseUrl:"https://commons.wikimedia.org/wiki/File:Boats_in_GOI.JPG",caption:"Boats near Gateway of India · representative harbour view",alt:"Passenger boats near the Gateway of India, Mumbai"},
 lakshadweep:{file:"MV Kavaratti.jpg",author:"Aswin Krishna Poyil",license:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",caption:"MV Kavaratti · historical vessel image, not a current schedule",alt:"Passenger cruise vessel MV Kavaratti in Kochi"},
 kolkata:{file:"Ganges Voyger Cruise Ship at Utarpara 1.jpg",author:"Rangan Datta",license:"See Commons license",licenseUrl:"https://commons.wikimedia.org/wiki/File:Ganges_Voyger_Cruise_Ship_at_Utarpara_1.jpg",caption:"Ganges Voyager near Kolkata · editorial vessel image",alt:"Ganges Voyager river cruise ship near Uttarpara on the Hooghly River"},
 andaman:{file:"Havelock jetty Andaman vrvbaan042k24 (3).jpg",author:"Vinayaraj",license:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",caption:"Havelock jetty · representative island waterfront",alt:"Jetty on Havelock island in the Andaman Islands"}
} as const satisfies Record<string,Photo>;

const options:readonly IndianWaterOption[]=[
 {slug:"goa-mandovi-dinner",city:"Goa",region:"Mandovi River",title:"Goa Mandovi Dinner Cruise",description:"Explore the published Goa Lexicon dinner cruise, with onboard dining and entertainment. Select dates and package directly with Klook.",highlights:["Mandovi river experience","Confirm meeting point and inclusions"],label:"Check dates & packages",sourceUrl:"https://www.klook.com/en-IN/activity/185166-goa-lexicon-dinner-cruise/",photo:photos.goa},
 {slug:"kerala-alleppey-houseboat",city:"Kerala",region:"Alleppey / Kochi",title:"Alleppey Backwater Houseboat",description:"Klook lists a houseboat day excursion departing from Kochi with time on Kerala's backwaters and a traditional boat.",highlights:["Houseboat and backwater scenery","Review transfer and meal details"],label:"Check dates & packages",sourceUrl:"https://www.klook.com/en-IN/activity/6620-alleppey-backwater-cruise-by-houseboat-cochin/",photo:photos.kerala},
 {slug:"mumbai-harbour",city:"Mumbai",region:"Mumbai Harbour",title:"Mumbai Private Sailing Yacht Cruise",description:"A published private yacht sailing experience along Mumbai’s coastline, departing near the Gateway of India. Confirm current dates with GetYourGuide.",highlights:["Mumbai coastline sailing","Operator confirms timing and inclusions"],label:"Check cruise on GetYourGuide",sourceUrl:"https://www.getyourguide.com/mumbai-l201/mumbai-private-sailing-yacht-cruise-with-snacks-t1142848/",affiliateUrl:"https://gyg.me/ZzIrHzQ9",photo:photos.mumbai},
 {slug:"lakshadweep-cruises",city:"Lakshadweep",region:"Island cruise holidays",title:"Lakshadweep Cruise Discovery",description:"Explore cruise and island-related options. Sailing schedules, visitor permits and boarding rules must be checked with the operator.",highlights:["Island cruise discovery","Verify permits and itineraries"],label:"Search cruises on GetYourGuide",photo:photos.lakshadweep},
 {slug:"kolkata-river-cruises",city:"Kolkata",region:"Hooghly River",title:"Hooghly River Sunset Cruise",description:"A published Kolkata sunset cruise with refreshments on the Hooghly River. Verify the boarding point carefully before booking.",highlights:["Hooghly riverside experience","Verify meeting point and operator details"],label:"Check cruise on GetYourGuide",sourceUrl:"https://www.getyourguide.com/kolkata-l275/kolkata-hooghly-river-sunset-cruise-with-snacks-drinks-t1250175/",affiliateUrl:"https://www.getyourguide.com/kolkata-l275/kolkata-hooghly-river-sunset-cruise-with-snacks-drinks-t1250175/?partner_id=DF3NBKA&utm_medium=online_publisher&cmp=gthpro_cruises_kolkata",photo:photos.kolkata},
 {slug:"andaman-cruises",city:"Andaman",region:"Port Blair / Havelock",title:"Andaman Island Cruises",description:"Discover coastal and island sailing experiences; use current provider results to check routes and timings.",highlights:["Island waters and coastal excursions","Check routes and operator rules"],label:"Search cruises on GetYourGuide",photo:photos.andaman}
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
// Affiliate URL is generated by the owner's GetYourGuide Link Builder.
// Match it to the reviewed product and restrict the approved public tracking fields.
function reviewedGuideUrl(sourceUrl:string,affiliateUrl?:string):string|null{
 try{
  const source=new URL(sourceUrl);
  if(source.protocol!=="https:"||source.hostname!=="www.getyourguide.com"||source.port||source.username||source.password||source.search||source.hash||!/^\/[a-z0-9-]+-l[1-9]\d*\/[a-z0-9-]+-t[1-9]\d*\/$/.test(source.pathname))return null;
  if(!affiliateUrl)return source.href;
  // Owner confirmed this short URL was generated for the Mumbai cruise.
  // Accept only this exact short link for the exact reviewed Mumbai product.
  if(affiliateUrl==="https://gyg.me/ZzIrHzQ9"&&source.pathname==="/mumbai-l201/mumbai-private-sailing-yacht-cruise-with-snacks-t1142848/")return affiliateUrl;
  const tracked=new URL(affiliateUrl);
  const keys=[...tracked.searchParams.keys()];
  if(tracked.origin!==source.origin||tracked.pathname!==source.pathname||tracked.username||tracked.password||tracked.hash||keys.length!==3||new Set(keys).size!==3)return null;
  if(tracked.searchParams.get("partner_id")!=="DF3NBKA"||tracked.searchParams.get("utm_medium")!=="online_publisher"||tracked.searchParams.get("cmp")!=="gthpro_cruises_kolkata")return null;
  return tracked.href;
 }catch{return null;}
}
function commonsPhotoUrl(file:string):string{return "https://commons.wikimedia.org/wiki/Special:FilePath/"+encodeURIComponent(file)+"?width=800";}
function commonsSourceUrl(file:string):string{return "https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(file).replace(/%20/g,"_");}
export default function IndianWaters(){
 return <section id="indian-waters" aria-labelledby="indian-waters-title" className="mt-10 scroll-mt-24">
  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]"><Waves size={16} aria-hidden="true"/>GTH PRO · India cruise discovery</p>
  <h2 id="indian-waters-title" className="mt-2 text-2xl font-bold">Explore Indian Waters</h2>
  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">Cruises, harbours and houseboat experiences across India. Open an identified Klook or GetYourGuide cruise listing. Destinations without a confirmed product are shown for research only.</p>
  <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
   {options.map(option=>{
    const isGuide=Boolean(option.sourceUrl?.startsWith("https://www.getyourguide.com/"));
    const href=option.sourceUrl?(isGuide?reviewedGuideUrl(option.sourceUrl,option.affiliateUrl):reviewedKlookReferral(option.sourceUrl,option.slug)):buildCruiseProviderSearch(option.city,"gyg");
    return <article key={option.slug} data-india-cruise={option.slug} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
     <div className="relative aspect-[16/9] overflow-hidden bg-[var(--bg)]">
      <Image src={commonsPhotoUrl(option.photo.file)} alt={option.photo.alt} fill unoptimized sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover"/>
     </div>
     <div className="flex flex-1 flex-col p-5">
      <p className="text-xs leading-5 text-[var(--text-soft)]">{option.photo.caption}</p>
      <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold)]"><MapPin size={13} aria-hidden="true"/>{option.city} · {option.region}</p>
      <h3 className="mt-3 text-xl font-bold leading-snug">{option.title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{option.description}</p>
      <ul className="mt-4 space-y-2 text-sm">{option.highlights.map(text=><li key={text} className="flex items-start gap-2"><Check size={15} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true"/><span>{text}</span></li>)}</ul>
      <div className="mt-auto pt-5">
       {href?<a href={href} target="_blank" rel={isGuide&&!option.affiliateUrl?"noopener noreferrer":"noopener noreferrer sponsored"} className="gth-btn-gold flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-semibold">{option.label}<ArrowUpRight size={16} aria-hidden="true"/></a>:<p className="text-sm text-[var(--text-soft)]">Search unavailable; no confirmed cruise product.</p>}
       <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">{option.affiliateUrl?"Opens this exact GetYourGuide cruise with GTH PRO affiliate tracking; availability and commission depend on the provider.":isGuide?"Opens the exact GetYourGuide listing; partner tracking is not yet configured for this card.":option.sourceUrl?"Opens this exact Klook cruise listing. Check availability there.":"Opens GetYourGuide destination search. A matching cruise or sailing is not guaranteed."}</p>
      </div>
     </div>
    </article>;
   })}
  </div>
  <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">Editorial photos show real boats and places, not a guaranteed booked vessel. All rates, dates, itineraries and payments are confirmed by the provider; referrals may qualify for affiliate commission.</p>
  <details className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs text-[var(--text-soft)]">
   <summary className="cursor-pointer font-semibold">Indian cruise photo credits</summary>
   <ul className="mt-3 space-y-2">
    {options.map(option=><li key={option.slug}><a href={commonsSourceUrl(option.photo.file)} target="_blank" rel="noopener noreferrer" className="underline">{option.city} photograph — {option.photo.author}</a>{" · "}<a href={option.photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{option.photo.license}</a>{" · Resized for display; no image alteration."}</li>)}
   </ul>
  </details>
 </section>;
}
