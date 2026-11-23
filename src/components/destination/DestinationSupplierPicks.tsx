import "server-only";
import Link from "next/link";
import {ArrowRight, Building2, Compass, Hotel, MapPin} from "lucide-react";
import {getSupplierCatalog,getSupplierAttractions} from "@/lib/tours/supplier-catalog";
import {getFreeHotelProfiles} from "@/lib/travel/nuitee-free-hotels";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";
import {trackedHotelCityHref} from "@/lib/travel/klook-hotel-search";
import {trackKlookDestination} from "@/lib/travel/partner-search";
import {countryCodeForDestinationName} from "@/lib/travel/osmCountryCodes";
import {stadiums} from "@/lib/travel/stadiums";

type Props={city:string;country:string|null;countryCode:string|null};
type Pick=Readonly<{id:string;title:string;detail:string;href:string;image:string|null;external:boolean}>;
type Section=Readonly<{id:string;title:string;hint:string;empty:string;href:string;cta:string;items:readonly Pick[]}>;

const cityName=(value:string)=>value.normalize("NFKC").trim().toLocaleLowerCase("en");
const countryName=(value:string)=>value.normalize("NFKC").trim().toLocaleLowerCase("en");
const internal=(href:string)=>href.startsWith("/")&&!href.startsWith("//");
const safeHotelId=(id:string)=>/^[A-Za-z0-9_-]{1,100}$/.test(id);

// Public product pages with itineraries explicitly located in Goa, India.
// Display the product and direct handoff only. Prices, photos and availability
// are owned by the supplier and checked on its booking page.
const goaExperiences = {
  tours: [
    ["17261", "North Goa Tour by Luxury Coach", "17261-north-luxury-coach-tour-goa"],
    ["17259", "South Goa Tour by Luxury Coach", "17259-south-luxury-coach-tour-goa"],
  ],
  activities: [
    ["117288", "Mandovi Sunset Boat Party", "117288-mandovi-sunset-boat-party"],
    ["185490", "Vihaan Evening Dinner Cruise", "185490-vihaan-evening-dinner-cruise-experience"],
  ],
} as const;

function goaProductLinks(kind: keyof typeof goaExperiences): Pick[] {
  return goaExperiences[kind].flatMap(([id, title, product]) => {
    const href = trackKlookDestination(new URL("https://www.klook.com/en-IN/activity/" + product + "/"),
      "gth_goa_" + id);
    return href ? [{ id: "goa-" + id, title, detail: "Goa, India · Check dates on the booking page",
      href, image: null, external: true }] : [];
  });
}

/**
 * Cards are supplier-returned products only, never public.destinations,
 * public.hotels, OSM or demo rows. A destination record supplies identity only.
 * APIs are accessed server-side through the EXISTING bounded/cache-protected
 * WeGoTrip and Nuitee readers. Venue links use the curated official venue guide.
 */
export default async function DestinationSupplierPicks({city,country,countryCode}:Props) {
  const code=countryCode&&/^[A-Z]{2}$/.test(countryCode)?countryCode:countryCodeForDestinationName(country);
  const isGoa = code === "IN" && cityName(city) === "goa";
  const validIdentity=city.length>=2&&city.length<=80&&!!country&&country.length<=100;
  const [tourResult,activityResult,attractionResult,hotelResult]=await Promise.allSettled([
    validIdentity?getSupplierCatalog({city,currency:"USD"},"/tours",country!):Promise.resolve({items:[]}),
    validIdentity?getSupplierCatalog({city,currency:"USD"},"/activities",country!):Promise.resolve({items:[]}),
    validIdentity?getSupplierAttractions(city,country!):Promise.resolve([]),
    validIdentity&&code?getFreeHotelProfiles(code,city,1):Promise.resolve({items:[]}),
  ] as const);
  const tours=tourResult.status==="fulfilled"?tourResult.value.items:[];
  const activities=activityResult.status==="fulfilled"?activityResult.value.items:[];
  const attractions=attractionResult.status==="fulfilled"?attractionResult.value:[];
  const hotels=hotelResult.status==="fulfilled"?hotelResult.value.items:[];
  // Recheck identity even when an upstream response is already scoped.
  const matching=(value:{city:{name:string;country:string}})=>
    !!country&&cityName(value.city.name)===cityName(city)&&countryName(value.city.country)===countryName(country);
  const toursCards:Pick[]=tours.filter(matching).slice(0,3).map(p=>({
    id:"tour-"+p.id,title:p.title,detail:"Supplier-listed audio tour; dates and prices checked on booking",
    href:p.href,image:p.image,external:true,
  }));
  const activitiesCards:Pick[]=activities.filter(matching).slice(0,3).map(p=>({
    id:"activity-"+p.id,title:p.title,detail:p.admissionOnly?"Supplier-listed attraction admission":"Supplier-listed ticket and audio experience",
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
  const query=new URLSearchParams({city}).toString();
  const hotelQuery = new URLSearchParams({ view: "booking", city, ...(code ? { country: code } : {}) });
  const hasReviewedHotelDestination = isGoa || (code === "AE" && cityName(city) === "dubai");
  const reviewedHotelHref = hasReviewedHotelDestination ? trackedHotelCityHref(city) : null;
  const goaTours = isGoa ? trackKlookDestination(new URL("https://www.klook.com/en-IN/destination/c178-goa/1001-tours/"), "gth_goa_tours") : null;
  const goaActivities = isGoa ? trackKlookDestination(new URL("https://www.klook.com/en-IN/destination/c178-goa/1-things-to-do/"), "gth_goa_activities") : null;
  const sections:Section[]=[
    {id:"destination-tours",title:"Popular tours in "+city,hint:"Supplier-listed tours for this destination",
      empty:"No matching supplier tours returned for this city.",href:goaTours || "/tours?"+query+"#discover",
      cta:"Explore city tours",items: toursCards.length || !isGoa ? toursCards : goaProductLinks("tours")},
    {id:"destination-activities",title:"Activities in "+city,hint:"Supplier ticket and activity products, checked against city and country",
      empty:"No matching supplier activities returned for this city.",href:goaActivities || "/activities?"+query+"#discover",
      cta:"Explore city activities",items: activitiesCards.length || !isGoa ? activitiesCards : goaProductLinks("activities")},
    {id:"destination-attractions",title:"Attractions in "+city,hint:"Attractions from the supplier city collection, not a separate local DB",
      empty:"No matching supplier attractions returned for this city.",href:goaActivities || "/activities?"+query+"#discover",cta:"Find city attractions",items:attractionCards},
    {id:"destination-hotels",title:"Stays in "+city,hint:"Supplier hotel profiles only; no fabricated dates or live room rates",
      empty:"No exact city-matched supplier hotel profiles available.",
      href:(!hotelCards.length && reviewedHotelHref) || "/hotels?" + hotelQuery.toString() + "#hotel-booking-experience",
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
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
          Each product card must match this city and country. No unrelated destination results,
          generic demo listings, or unverifiable booking availability.
        </p>
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
        </div>
        {section.items.length?
          <div role="region" tabIndex={0} aria-label={section.title+" horizontal cards"}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
            {section.items.map(item=><article key={item.id}
              className="flex h-64 w-60 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex h-28 shrink-0 items-center justify-center overflow-hidden bg-[var(--bg)]">
                {item.image?<img src={item.image} alt={item.title} loading="lazy" width={480} height={224}
                  className="h-full w-full object-cover"/>:
                  section.id==="destination-hotels"?<Hotel size={26}/>:section.id==="destination-stadiums"?<Building2 size={26}/>:<Compass size={26}/>}
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
                <h4 className="line-clamp-2 text-sm font-semibold">{item.title}</h4>
                <p className="line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{item.detail}</p>
                {item.external?
                  <a href={item.href} target="_blank" rel="noopener noreferrer sponsored"
                    className="mt-auto inline-flex min-h-9 items-center gap-2 text-xs font-semibold">View details <ArrowRight size={14}/></a>:
                  <Link href={item.href} className="mt-auto inline-flex min-h-9 items-center gap-2 text-xs font-semibold">View venue <ArrowRight size={14}/></Link>}
              </div>
            </article>)}
          </div>:
          <p role="status" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--text-soft)]">
            {section.empty} Use the search link above to check the supplier directly.
          </p>}
      </section>)}
      <p className="flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
        <MapPin size={16} className="mt-1 shrink-0"/>Listings depend on supplier inventory,
        source permissions and available city identifiers; three products are shown only when
        three genuine matches exist. Always confirm admission, price, availability and terms with the provider.
      </p>
    </div>
  </section>;
}
