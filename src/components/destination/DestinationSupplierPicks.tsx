import "server-only";
import Link from "next/link";
import DiscoveryCardPhoto from "./DiscoveryCardPhoto";
import {destinationServicePhoto} from "@/lib/destinations/visual-media";
import {ArrowRight, Building2, Compass, Hotel, MapPin} from "lucide-react";
import {getSupplierCatalog,getSupplierAttractions} from "@/lib/tours/supplier-catalog";
import {firstAvailableSupplierCatalog} from "@/lib/tours/catalog-selection";
import {parseTourFilters,type ExperiencePath} from "@/lib/tours/discovery";
import {loadPersistedSupplierProducts} from "@/lib/tours/persisted-inventory";
import {getFreeHotelProfiles} from "@/lib/travel/nuitee-free-hotels";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";
import {destinationHotelHref} from "@/lib/travel/klook-hotel-search";
import {destinationExperienceLinks,destinationPartnerCatalog,supplierPrice} from "@/lib/tours/destination-partner-catalog";
import {listPlaces} from "@/lib/travel/osmAttractions";
import {osmPlacePath,validOsmPlace} from "@/lib/travel/osm-place";
import {countryCodeForDestinationName} from "@/lib/travel/osmCountryCodes";
import {stadiums} from "@/lib/travel/stadiums";

type Props={city:string;country:string|null;countryCode:string|null};
type Pick=Readonly<{id:string;title:string;detail:string;href:string;image:string|null;external:boolean}>;
type Section=Readonly<{id:string;title:string;hint:string;empty:string;href:string;cta:string;alternateHref?:string|null;items:readonly Pick[]}>;

const cityName=(value:string)=>value.normalize("NFKC").trim().toLocaleLowerCase("en");
const countryName=(value:string)=>value.normalize("NFKC").trim().toLocaleLowerCase("en");
const internal=(href:string)=>href.startsWith("/")&&!href.startsWith("//");
const safeHotelId=(id:string)=>/^[A-Za-z0-9_-]{1,100}$/.test(id);

/**
 * Products come from the supplier and its existing verified catalog snapshots.
 * Destination records supply location identity.
 * APIs are accessed server-side through the EXISTING bounded/cache-protected
 * WeGoTrip and Nuitee readers. Venue links use the curated official venue guide.
 */
export default async function DestinationSupplierPicks({city,country,countryCode}:Props) {
  const code=countryCode&&/^[A-Z]{2}$/.test(countryCode)?countryCode:countryCodeForDestinationName(country);
  const isGoa = code === "IN" && cityName(city) === "goa";
  const validIdentity=city.length>=2&&city.length<=80&&!!country&&country.length<=100;
  const parsed = parseTourFilters({ city, currency: "USD" });
  const readExperiences = (mode: ExperiencePath) => validIdentity && parsed.ok && country
    ? firstAvailableSupplierCatalog(
        getSupplierCatalog({ city: parsed.filters.city, currency: parsed.filters.currency }, mode, country),
        loadPersistedSupplierProducts(parsed.filters, mode, country),
      )
    : Promise.resolve({ items: [] });
  const [tourResult,activityResult,attractionResult,hotelResult,partnerResult,mappedResult]=await Promise.allSettled([
    readExperiences("/tours"),
    readExperiences("/activities"),
    validIdentity?getSupplierAttractions(city,country!):Promise.resolve([]),
    validIdentity&&code?getFreeHotelProfiles(code,city,1):Promise.resolve({items:[]}),
    destinationPartnerCatalog(city,country),
    code && validIdentity ? listPlaces({country:code,...(isGoa?{region:"goa"}:{city}),limit:8}) : Promise.resolve({items:[]}),
  ] as const);
  const tours=tourResult.status==="fulfilled"?tourResult.value.items:[];
  const activities=activityResult.status==="fulfilled"?activityResult.value.items:[];
  const attractions=attractionResult.status==="fulfilled"?attractionResult.value:[];
  const hotels=hotelResult.status==="fulfilled"?hotelResult.value.items:[];
  // Recheck identity even when an upstream response is already scoped.
  const matching=(value:{city:{name:string;country:string}})=>
    !!country&&cityName(value.city.name)===cityName(city)&&countryName(value.city.country)===countryName(country);
  const catalog = partnerResult.status === "fulfilled" ? partnerResult.value : {tours:[],activities:[]};
  const mapped = mappedResult.status === "fulfilled" ? mappedResult.value.items : [];
  const toursCards:Pick[]=tours.filter(matching).slice(0,3).map(p=>({
    id:"tour-"+p.id,title:p.title,detail:supplierPrice(p.price,p.currency) ?? "Check price and dates on the booking page",
    href:p.href,image:p.image,external:true,
  }));
  const activitiesCards:Pick[]=activities.filter(matching).slice(0,3).map(p=>({
    id:"activity-"+p.id,title:p.title,detail:supplierPrice(p.price,p.currency) ?? "Check price and dates on the booking page",
    href:p.href,image:p.image,external:true,
  }));
  const attractionCards:Pick[]=attractions.filter(matching).slice(0,3).map(p=>({
    id:"attraction-"+p.id,title:p.name,detail:"Supplier attraction reference; browse the matching city collection",
    href:p.href,image:p.image,external:true,
  }));
  const hotelCards:Pick[]=hotels.filter(p=>cityName(p.city)===cityName(city)&&p.country===code&&safeHotelId(p.id)).slice(0,3).map(p=>{
    const url=new URL("/hotels/"+encodeURIComponent(p.id),HOTEL_BOOKING_ORIGIN);
    url.searchParams.set("language","en");url.searchParams.set("currency","INR");
    return {id:"hotel-"+p.id,title:p.name,detail:"Supplier hotel profile · room availability and prices require dates",
      href:url.toString(),image:p.image,external:true};
  });
  const venueCards:Pick[]=code?stadiums.filter(v=>v.countryCode===code&&cityName(v.city)===cityName(city))
    .slice(0,3).map(v=>({id:"stadium-"+v.slug,title:v.name,
      detail:v.sports.join(" · ")+" · official event information",
      href:"/stadiums/"+v.slug,image:null,external:false})):[];
  const hotelQuery = new URLSearchParams({ view: "booking", city, ...(code ? { country: code } : {}) });
  // Reuse the common hotel resolver: exact White Label city ID first,
  // reviewed city-specific alternate second, genuine search otherwise.
  const reviewedHotelHref = code ? destinationHotelHref(city, code) : null;
  const tourLinks = destinationExperienceLinks(city,country,"tours");
  const activityLinks = destinationExperienceLinks(city,country,"activities");
  const attractionQuery = new URLSearchParams(code ? {country:code,...(isGoa?{region:"goa"}:{city})} : {});
  const mappedCards:Pick[]=mapped.filter(place => validOsmPlace(place) && place.country_code===code
    && (isGoa ? place.region_scope==="goa" : place.city && cityName(place.city)===cityName(city))).flatMap(place=>{
    const href=osmPlacePath(place.source_id);
    return href ? [{id:place.source_id,title:place.name,detail:"Mapped attraction",href,image:null,external:false}] : [];
  });
  const sections:Section[]=[
    {id:"destination-tours",title:"Tours in "+city,hint:"Guided tours and audio tours",
      empty:"Check local tours on the booking network.",href:tourLinks.klook || tourLinks.guide,
      alternateHref:tourLinks.klook ? tourLinks.guide : null,
      cta:"Browse tours in "+city,
      items:[...toursCards,...catalog.tours.map(item=>({...item,external:true}))].slice(0,3)},
    {id:"destination-activities",title:"Activities in "+city,hint:"Tickets and experiences",
      empty:"Check local activities on the booking network.",href:activityLinks.klook || activityLinks.guide,
      alternateHref:activityLinks.klook ? activityLinks.guide : null,
      cta:"Browse activities in "+city,
      items:[...activitiesCards,...catalog.activities.map(item=>({...item,external:true}))].slice(0,3)},
    {id:"destination-attractions",title:"Attractions in "+city,hint:"Sights and visitor guides",
      empty:"Explore local attractions and visitor information.",href:"/attractions"+(attractionQuery.size?"?"+attractionQuery:""),
      cta:"Explore attractions",items:[...attractionCards,...mappedCards].slice(0,3)},
    {id:"destination-hotels",title:"Stays in "+city,hint:"Supplier hotel profiles only; no fabricated dates or live room rates",
      empty:"No exact city-matched supplier hotel profiles available.",
      href:reviewedHotelHref || "/hotels?" + hotelQuery.toString() + "#hotel-booking-experience",
      cta:"Search stays with dates",items:hotelCards},
    {id:"destination-stadiums",title:"Stadiums in "+city,hint:"Up to 3 host-city venue guides with official schedule references; not live seats",
      empty:"No verified stadium guide mapped to this exact city.",href:"/stadiums",cta:"Browse stadium guide directory",items:venueCards},
  ];
  return <section id="destination-supplier-picks" aria-label={"City-matched travel supplier picks for "+city}
     className="border-y border-[var(--border)] bg-[var(--bg-soft)] py-10 text-[var(--text)] sm:py-14">
    <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]">GTH PRO · Destination supplier discovery</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Explore {city}{country?", "+country:""}</h2>
      </header>
      {sections.map(section=><section key={section.id} id={section.id} aria-labelledby={section.id+"-heading"}
        className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id={section.id+"-heading"} className="text-xl font-semibold">{section.title}</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{section.hint}</p>
          </div>
          {internal(section.href)?
            <Link href={section.href} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline">{section.cta}<ArrowRight size={15}/></Link>:
            <a href={section.href} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline">{section.cta}<ArrowRight size={15}/></a>}
          {section.alternateHref && <a href={section.alternateHref} target="_blank" rel="noopener noreferrer sponsored"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline">More options <ArrowRight size={15}/></a>}
        </div>
        {section.items.length?
          <div role="region" tabIndex={0} aria-label={section.title+" horizontal cards"}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
            {section.items.map(item=><article key={item.id}
              className="flex h-64 w-60 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <div className="relative flex h-28 shrink-0 items-center justify-center overflow-hidden bg-[var(--bg)]">
                <DiscoveryCardPhoto source={item.image} fallback={destinationServicePhoto(section.id.replace("destination-",""))} title={item.title}/>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
                <h4 className="line-clamp-2 text-sm font-semibold">{item.title}</h4>
                <p className="line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{item.detail}</p>
                {item.external?
                  <a href={item.href} target="_blank" rel="noopener noreferrer sponsored"
                    className="mt-auto inline-flex min-h-9 items-center gap-2 text-xs font-semibold">{section.id === "destination-attractions" ? "View details" : "Check availability"} <ArrowRight size={14}/></a>:
                  <Link href={item.href} className="mt-auto inline-flex min-h-9 items-center gap-2 text-xs font-semibold">View guide <ArrowRight size={14}/></Link>}
              </div>
            </article>)}
          </div>:
          <article className="flex max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] sm:flex-row"><div className="relative h-36 shrink-0 sm:h-auto sm:w-44"><DiscoveryCardPhoto source={null} fallback={destinationServicePhoto(section.id.replace("destination-",""))} title=""/></div><div className="p-4"><p className="text-sm text-[var(--text-soft)]">{section.empty}</p><a href={section.href} className="gth-btn-gold mt-3 inline-flex min-h-11 items-center gap-2 px-4 text-sm" {...(!internal(section.href)?{target:"_blank",rel:"noopener noreferrer sponsored"}:{})}>{section.cta}<ArrowRight size={15}/></a></div></article>}
      </section>)}
      <p className="flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
        <MapPin size={16} className="mt-1 shrink-0"/>Confirm current prices, availability and booking terms on the booking page.
      </p>
    </div>
  </section>;
}
