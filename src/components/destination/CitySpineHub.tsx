import Link from "next/link";
import Image from "next/image";
import {destinationServicePhoto} from "@/lib/destinations/visual-media";
import type { ReactNode } from "react";
import {
  ArrowRight, Building2, Compass, FileText, Globe2, Hotel,
  MapPin, Plane, ShieldCheck, Ticket, TrainFront,
} from "lucide-react";
import type { PublicTour } from "@/lib/tours";
import { parseTravelQuery, type CityContext, type HotelCurrency } from "@/lib/router/cityContext";
import StaySearchControls from "./StaySearchControls";
import { resolveAffiliateRoute, resolveFlightCompetition } from "@/lib/router/affiliateRouter";
import { buildCitySpineLinks } from "@/lib/router/citySpine";
import {
  isHopeGooCountry, type ProviderId,
} from "@/lib/router/providerRegistry";
import {
  SUPPORTED_UI_LOCALES, preferredCurrencyForCountry, type UiLocale,
} from "@/lib/router/edgeGeoAutoDetect";

type Props = {
  city: CityContext;
  tours?: readonly PublicTour[];
  locale?: UiLocale;
  detected?: boolean;
  currency?: HotelCurrency;
  travelParams?: Readonly<Record<string, unknown>>;
};

function BookingAction({href,label}: {href:string|null;label:string}) {
  if (!href) return (
    <span className="mt-auto inline-flex min-h-11 items-center text-xs text-[var(--text-soft)]">
      Confirm availability with a provider
    </span>
  );
  const external = /^https:\/\//.test(href);
  const className = "gth-btn-gold mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-center text-sm font-semibold";
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer sponsored" className={className}>
        {label}<ArrowRight size={15} aria-hidden="true"/>
      </a>
    : <Link href={href} prefetch={false} className={className}>
        {label}<ArrowRight size={15} aria-hidden="true"/>
      </Link>;
}

function HubCard({name,description,scope,href,label,icon,media="packages"}: {
  name:string;description:string;scope:string;href:string|null;label:string;
  icon:ReactNode;media?:string;
}) {
  return <article className="gth-glass flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--text)] shadow-sm">
    <div className="relative aspect-[16/7] overflow-hidden rounded-xl"><Image src={destinationServicePhoto(media)} alt="" fill sizes="(max-width:768px) 100vw,33vw" className="object-cover"/></div>
    <div className="flex items-start justify-between gap-3">
      <span className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2 text-[var(--gold)]">{icon}</span>
      <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] text-[var(--text-soft)]">{scope}</span>
    </div>
    <h3 className="text-lg font-semibold">{name}</h3>
    <p className="flex-1 text-sm leading-6 text-[var(--text-soft)]">{description}</p>
    <BookingAction href={href} label={label}/>
  </article>;
}

function ManualDestinationControls({city,locale}: {city:CityContext;locale:UiLocale}) {
  const control = "min-h-11 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]";
  return <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:grid-cols-2">
    <form method="get" action="/destinations" className="flex flex-wrap items-end gap-2" role="search">
      <label className="min-w-0 flex-1 text-xs text-[var(--text-soft)]">
        Switch city
        <input className={"mt-1 w-full "+control} type="search" name="search" maxLength={70}
          placeholder="Type a city or country" aria-label="Search another destination"/>
      </label>
      <button className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm" type="submit">Find city</button>
    </form>
    <form method="get" action={"/destinations/"+encodeURIComponent(city.slug)} className="flex flex-wrap items-end gap-2">
      <label className="min-w-0 flex-1 text-xs text-[var(--text-soft)]">
        Preferred UI language
        <select className={"mt-1 w-full "+control} name="lang" defaultValue={locale}>
          {SUPPORTED_UI_LOCALES.map(lang=><option key={lang} value={lang}>{lang.toUpperCase()}</option>)}
        </select>
      </label>
      <button type="submit" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm">
        Apply language
      </button>
    </form>
  </div>;
}

function exactTourRows(city:CityContext,tours:readonly PublicTour[]) {
  if (!city.country || !city.country_code) return [];
  return tours.filter(tour =>
    tour.city.normalize("NFKC").toLocaleLowerCase("en") === city.name.normalize("NFKC").toLocaleLowerCase("en") &&
    tour.country === city.country &&
    (tour.city_slug === city.slug || tour.city_slug === city.slug.replace(/-[a-z]{2}$/,""))
  ).slice(0,3);
}

const DISCOVER_LABEL:Record<UiLocale,string>={
  en:"Discover", hi:"खोजें", zh:"探索", ja:"探す", ko:"탐색",
  th:"สำรวจ", ms:"Terokai", vi:"Khám phá", fr:"Découvrez", es:"Descubre",
};

export default function CitySpineHub({
  city,tours=[],locale="en",detected=false,currency,travelParams,
}:Props) {
  const links=buildCitySpineLinks(city);
  if (!links || process.env.ENABLE_UNIFIED_CITY_ROUTER !== "true") return null;

  const selectedCurrency=currency??preferredCurrencyForCountry(city.country_code);
  const intent:Readonly<Record<string,unknown>>={
    ...(travelParams??{}),
    currency:travelParams?.currency??selectedCurrency,
  };
  const verifiedStay=parseTravelQuery(intent);
  // The supplier still owns real availability. Invalid travel inputs fail
  // closed rather than silently defaulting to invented dates or occupancy.
  const preferredHotel=resolveAffiliateRoute({city,service:"hotels",travelParams:intent});
  const nuitee=resolveAffiliateRoute({city,service:"hotels",provider:"nuitee",travelParams:intent});
  const hopegoo=isHopeGooCountry(city.country_code)
    ? resolveAffiliateRoute({city,service:"hotels",provider:"hopegoo",travelParams:intent}) : null;
  const flights=resolveFlightCompetition({city});
  const providers:readonly {id:ProviderId;label:string;summary:string}[]=[
    {id:"wegotrip",label:"Audio walks & self-guided experiences",
      summary:"Browse the reviewed audio-tour partner. Select your destination on the provider site; no specific product is implied."},
    {id:"getyourguide",label:"Guided attractions & city activities",
      summary:"Provider-operated destination search. Review actual dates, products and inclusions with the supplier."},
    {id:"klook",label:"City attractions & tours",
      summary:"Existing tracked destination-search helper; actual product availability is shown by the supplier."},
  ];
  const experiences=providers.map(p=>({
    ...p, result:resolveAffiliateRoute({
      city,service:p.id==="getyourguide"?"activities":"tours",provider:p.id,
    }),
  }));
  const toursForCity=exactTourRows(city,tours);
  const transport=resolveAffiliateRoute({city,service:"train",provider:"12go"});
  const transfers=resolveAffiliateRoute({city,service:"transfers",provider:"kiwitaxi"});

  return <section id="city-spine-hub" aria-labelledby="city-spine-heading"
    className="scroll-mt-24 border-y border-[var(--border)] bg-[var(--bg-soft)] py-10 text-[var(--text)] sm:py-14">
    <div className="mx-auto max-w-7xl space-y-9 px-4 sm:px-6">
      <header className="gth-glass-strong rounded-3xl border border-[var(--border)] p-5 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
          <Globe2 size={16}/>{detected?"Location-aware destination hub":"GTH PRO · Worldwide City Spine"}
        </p>
        <h2 id="city-spine-heading" className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight sm:text-4xl">
          <span lang={locale}>{DISCOVER_LABEL[locale]}</span> {city.name} <span className="text-[var(--gold)]">· Four pillars</span>
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
          {city.country ? city.country+" · " : ""}
          Explore trusted travel handoffs, reviewed venue guides, supported property filters
          and public tender intelligence from one destination identity. Supplier results,
          tickets, live prices and property offers are never guaranteed.
        </p>
        {detected&&<p className="mt-2 text-xs text-[var(--text-soft)]">
          Approximate location hint from Vercel network headers. Change city or language at any time.
        </p>}
        <div className="mt-5"><ManualDestinationControls city={city} locale={locale}/></div>
      </header>

      <section aria-labelledby="city-stays-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Featured stays</p>
            <h3 id="city-stays-heading" className="mt-2 text-xl font-bold sm:text-2xl">Stay in {city.name}</h3></div>
          <span className="text-xs text-[var(--text-soft)]">No fabricated rooms or prices</span>
        </div>
        <StaySearchControls city={city} locale={locale} currency={selectedCurrency}
          value={verifiedStay.ok?verifiedStay.value:null} invalid={!verifiedStay.ok}/>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <HubCard media="hotels" icon={<Hotel size={23}/>}
            name={preferredHotel.provider==="hopegoo"?"HopeGoo · Asia stays":"GTH Worldwide Stays"}
            scope={preferredHotel.capability==="verified_deep_link"?"Verified destination ID":"Supplier-operated search"}
            description={preferredHotel.provider==="hopegoo"
              ?"Public affiliate landing for eligible Asian markets. Confirm your city, dates, guests and currency on the partner site."
              :"Hosted Nuitee search. Choose the exact supplier destination; dates and inventory must be confirmed there."}
            href={preferredHotel.href} label="Explore stays"/>
          {hopegoo&&<HubCard media="hotels" icon={<Globe2 size={23}/>}
            name={preferredHotel.provider==="hopegoo"?"Alternative GTH worldwide stays":"HopeGoo · Regional stays"}
            scope={preferredHotel.provider==="hopegoo"?"Nuitee search":"Regional provider"}
            description={preferredHotel.provider==="hopegoo"
              ?"Alternative provider-hosted Nuitee search with no unverified Place ID."
              :"Approved regional affiliate landing only when configured. Verify city and rooms with the provider."}
            href={(preferredHotel.provider==="hopegoo"?nuitee:hopegoo).href}
            label="Compare stay providers"/>}
        </div>
      </section>

      <section aria-labelledby="city-experiences-heading">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Experiences · three providers</p>
        <h3 id="city-experiences-heading" className="mt-2 text-xl font-bold sm:text-2xl">Explore activities in {city.name}</h3>
        <p className="mt-2 mb-5 text-xs leading-6 text-[var(--text-soft)]">
          These three cards are supplier discovery paths, not invented top-rated attractions or available products.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {experiences.map(({id,label,summary,result})=><HubCard media="activities" key={id}
            icon={<Compass size={22}/>} name={label}
            scope={result.searchIntentForwarded?"City search":"Supplier directory"}
            description={summary} href={result.href} label="Browse experiences"/>)}
        </div>
        {toursForCity.length>0&&<div className="mt-6">
          <h4 className="text-base font-semibold">Published city catalog experiences</h4>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {toursForCity.map(t=><Link key={String(t.id)} href={"/tours/"+encodeURIComponent(String(t.id))}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm font-semibold">
              {t.title}<span className="mt-2 block text-xs font-normal text-[var(--text-soft)]">
                Review source details and provider terms <ArrowRight size={13} className="inline"/></span>
            </Link>)}
          </div>
        </div>}
      </section>

      <section aria-labelledby="city-mobility-heading">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Flight choices & mobility</p>
        <h3 id="city-mobility-heading" className="mt-2 text-xl font-bold sm:text-2xl">Compare travel handoffs</h3>
        <p className="mt-2 mb-5 text-xs leading-6 text-[var(--text-soft)]">
          Route selection is not a live-fare comparison. Select actual dates and airports in each supplier form.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {flights.map(item=><HubCard media="flights" key={item.provider}
            icon={<Plane size={22}/>} name={item.label}
            scope={item.provider==="nuitee"
              ? item.capability==="supplier_search"?"Shared flights & stays portal":"Portal unavailable"
              : item.capability==="unavailable"?"Not a verified flight supplier"
              : item.capability==="supplier_search"?"Supplier search":"Booking form"}
            description={item.detail}
            href={item.href}
            label={item.provider==="nuitee"?"Open flights & stays":"Compare flight search"}/>)}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <HubCard media="train" icon={<TrainFront size={22}/>} name="Trains, buses & ferries"
            scope="12Go provider form"
            description="Choose departure and arrival cities on the existing supplier widget. No route is fabricated."
            href={transport.href} label="Explore ground travel"/>
          <HubCard media="transfers" icon={<MapPin size={22}/>} name="Airport & local transfers"
            scope="Verified widget"
            description="Use the existing transfer provider search to select airport, pickup and passenger details."
            href={transfers.href} label="Find transfers"/>
        </div>
      </section>

      <section aria-labelledby="city-pillars-heading">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">One city · four pillars</p>
        <h3 id="city-pillars-heading" className="mt-2 text-xl font-bold sm:text-2xl">City-connected opportunities</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <HubCard media="stadiums" icon={<Ticket size={22}/>} name="Stadiums & live events"
            scope={links.venues.length?"Exact host-city match":"Global venue directory"}
            description={links.venues.length
              ? links.venues.map(v=>v.name).join(", ")+" · Official schedules, not live seat inventory."
              :"No exact city-and-country-reviewed stadium mapping. Browse worldwide venues instead."}
            href={links.venues.length?links.venues[0].href:"/stadiums"} label="Explore stadiums"/>
          <HubCard media="properties" icon={<Building2 size={22}/>} name="Real Estate & registry"
            scope={links.realEstate.scope==="city_filter"?"City-filtered research":"Global property directory"}
            description="Explore public property and project references. A city filter does not guarantee local inventory or verified prices."
            href={links.realEstate.href} label="Research property"/>
          <HubCard media="tenders" icon={<FileText size={22}/>} name="Global tenders"
            scope={links.tenders.scope==="country"?"Country-wide coverage":"Worldwide coverage"}
            description="Procurement discovery is grouped by published jurisdiction, not an unverified city-level tender match."
            href={links.tenders.href} label="Discover tenders"/>
        </div>
        {links.venues.length>0&&<div className="mt-4 flex flex-wrap gap-2">
          {links.venues.map(v=><Link key={v.slug} href={v.href}
            className="gth-btn inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold">
            {v.name}{v.event?" · Calendar available":""}<ArrowRight size={14}/>
          </Link>)}
        </div>}
        {links.realEstate.registryHref&&<Link href={links.realEstate.registryHref}
          className="gth-btn mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm">
          Research official Maharashtra registry records <ArrowRight size={15}/>
        </Link>}
      </section>
      <p className="flex gap-2 border-t border-[var(--border)] pt-5 text-xs leading-6 text-[var(--text-soft)]">
        <ShieldCheck size={17} className="mt-1 shrink-0"/>
        GTH PRO is a discovery platform. Final prices, seats, legal property details, deadlines and supplier availability
        are confirmed independently. Third-party links may be affiliate links.
        <Link href="/affiliate-disclosure" className="underline">Disclosure</Link>
      </p>
    </div>
  </section>;
}
