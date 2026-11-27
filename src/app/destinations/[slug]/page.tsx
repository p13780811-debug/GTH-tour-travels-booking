import {destinationVisual,isIllustrativeVisual} from "@/lib/destinations/visual-media";
import CityMobility from "@/components/mobility/CityMobility";
import {mobilityCity} from "@/lib/mobility/city";
import DestinationTravelSearch from "@/components/destination/DestinationTravelSearch";
import {countryCodeForDestinationName} from "@/lib/travel/osmCountryCodes";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import {Suspense} from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, BookOpen, Compass, Globe2, Hotel, MapPin, Plane, ShieldCheck, Sparkles } from "lucide-react";
import DestinationCard from "@/components/destination/DestinationCard";
import DestinationEcosystem from "@/components/destination/DestinationEcosystem";
import {destinationServices,destinationCountryCode} from "@/lib/destinations/ecosystem";
import { destinations, destinationImageForSlug, type DestinationOverview } from "@/data/destinations";
import { blogs } from "@/data/blogs";
import { siteUrl,isPublicLaunch } from "@/lib/seo/site";
import {isIndexableDestination} from "@/lib/seo/large-sitemaps";
import JsonLd from "@/components/seo/JsonLd";
import { destinationGeography } from "@/lib/destinations/geography";
import {validatedCountry} from "@/lib/destinations/country";
import CitySpineHub from "@/components/destination/CitySpineHub";
import DestinationSupplierPicks from "@/components/destination/DestinationSupplierPicks";
import { unifiedCityRouterEnabled } from "@/lib/router/affiliateRouter";
import { resolveCityContext, type CityContext } from "@/lib/router/cityContext";
import { SUPPORTED_UI_LOCALES, type UiLocale } from "@/lib/router/edgeGeoAutoDetect";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    lang?: string | string[];
    country?: string | string[];
    checkin?: string | string[]; checkout?: string | string[];
    adults?: string | string[]; children?: string | string[];
    currency?: string | string[];
  }>;
};
type DestinationDetail = DestinationOverview & { description: string; country: string | null; region: string | null; seoApproved:boolean; cityId?:string|null;countryCode:string|null; seoTitle?:string|null; seoDescription?:string|null };

// Cache successful anonymous reads by both route slug and validated country.
const readDestination = unstable_cache(async (slug: string, countryFilter: string) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Public destination catalog is unavailable");
    const client = createClient(url, key);
    const lookup = client.from("destinations")
      .select("id,slug,name,description,country,country_code,is_active,media_rights_verified,source_name,source_url,seo_title,seo_description")
      .eq("slug", slug)
      .eq("is_active", true);
    // A city slug may exist in multiple countries. Never choose an arbitrary match.
    const { data, error } = await (countryFilter ? lookup.eq("country", countryFilter) : lookup)
      .abortSignal(AbortSignal.timeout(5_000)).maybeSingle();

    if (error || !data) throw new Error("Destination could not be read");
    return data;
}, ["gth-destination-public-metadata-v2"], { revalidate: 3600 });

async function getDestination(slug: string, countryFilter = ""): Promise<DestinationDetail | null> {
  const worldSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 140;
  // Public city identity pages are independent of the opt-in unified booking router.
  // Supplier-side city-spine behavior remains feature-gated below.
  if (!worldSlug) return null;
  const editorialBase = destinations.find((item) => item.slug === slug) ?? null;
  const editorial: DestinationDetail | null = editorialBase && (!countryFilter || destinationGeography(slug).country === countryFilter) ? { ...editorialBase, ...destinationGeography(slug), seoApproved:true,countryCode:null } : null;

  try {
    const data = await readDestination(slug, countryFilter);
    const approved=isIndexableDestination(data as unknown as Record<string,unknown>);
    // Never overwrite a curated, source-reviewed editorial page with unapproved imported copy.
    if (!approved && editorial) return editorial;
    const name = typeof data.name === "string" && data.name.trim().length <= 120
      ? data.name.trim()
      : editorial?.name;
    if (!name) return editorial;
    return {
      slug,
      name,
      seoApproved:approved,
      // Never treat an unreviewed AI draft as approved site copy. City identity
      // and content lengths must match before the sourced fields reach <head>.
      seoTitle:approved && typeof data.seo_title==="string" &&
        data.seo_title.trim().length>=24 && data.seo_title.trim().length<=85 &&
        data.seo_title.toLocaleLowerCase().includes(name.toLocaleLowerCase()) &&
        !/[<>]/.test(data.seo_title) ? data.seo_title.trim() : null,
      seoDescription:approved && typeof data.seo_description==="string" &&
        data.seo_description.trim().length>=90 && data.seo_description.trim().length<=165 &&
        data.seo_description.toLocaleLowerCase().includes(name.toLocaleLowerCase()) &&
        !/[<>]/.test(data.seo_description) ? data.seo_description.trim() : null,
      cityId:typeof data.id==="string"&&/^[a-f0-9-]{36}$/i.test(data.id)?data.id:null,
      countryCode:typeof data.country_code==="string"&&/^[A-Z]{2}$/.test(data.country_code)?data.country_code:null,
      ...destinationGeography(slug, data.country),
      image_url: destinationImageForSlug(slug),
      description: typeof data.description === "string" && data.description.trim()
        ? data.description.slice(0, 5000)
        : editorial?.description || "Explore destination information and confirm planning details with providers.",
    };
  } catch {
    return editorial;
  }
}

export function generateStaticParams() {
  return destinations.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const countryFilter = validatedCountry((await searchParams)?.country);
  const place = await getDestination(slug,countryFilter);
  if (!place) return { title: "Destination not found | GTH PRO", robots: { index: false } };
  const index=isPublicLaunch()&&place.seoApproved;
  return {
    title: place.seoTitle || `Explore ${place.name}${place.country ? `, ${place.country}` : ""} | GTH PRO Destinations`,
    description: place.seoDescription || (place.seoApproved ? place.description.slice(0,175) : `Research ${place.name} and verify destination details with official local sources.`),
    robots:{index,follow:index},
    alternates: { canonical: `/destinations/${slug}${countryFilter?`?country=${encodeURIComponent(countryFilter)}`:""}` },
    openGraph: {
      title: `Explore ${place.name} | GTH PRO Travel`,
      images: [{ url: place.image_url, alt: place.name }],
      type: "website",
    },
  };
}

export default async function DestinationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const selectedParams = await searchParams;
  const countryFilter = validatedCountry(selectedParams?.country);
  const destination = await getDestination(slug,countryFilter);
  if (!destination) notFound();
  const visual=destinationVisual(slug,destinationCountryCode(destination.country,destination.countryCode),destination.image_url);
  const mobility=mobilityCity({name:destination.name,slug,country:destination.country,
    countryCode:destination.countryCode??countryCodeForDestinationName(destination.country)});

  // Separate read-only identity proof. No city is inferred from SEO text,
  // country labels, stadium flightCity or an OSM hotel ID.
  const enabled = unifiedCityRouterEnabled();
  let city: CityContext | null = null;
  if (enabled && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const db = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {auth:{persistSession:false,autoRefreshToken:false}},
      );
      // Reuse the exact UUID from the country-filtered public destination lookup.
      // Looking up slug alone could bind the wrong country to a supplier hub.
      if (!countryFilter || destination.cityId) {
        const matched = await resolveCityContext(
          db, countryFilter ? {id:destination.cityId} : {slug},
        );
        if (matched.status === "found" && (!countryFilter || matched.city.country === countryFilter)) city = matched.city;
      }
    } catch {
      // A provider outage retains the existing stable editorial destination.
    }
  }
  const selected = selectedParams?.lang;
  const stayParams:Record<string,unknown>={};
  for (const field of ["checkin","checkout","adults","children","currency"] as const) {
    if (selectedParams?.[field] !== undefined) stayParams[field]=selectedParams[field];
  }
  const locale: UiLocale = typeof selected === "string" &&
    SUPPORTED_UI_LOCALES.some(code => code === selected)
      ? selected as UiLocale : "en";

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Destinations", item: siteUrl("/destinations") },
      { "@type": "ListItem", position: 2, name: destination.name, item: siteUrl(`/destinations/${slug}${countryFilter?`?country=${encodeURIComponent(countryFilter)}`:""}`) },
    ],
  };
  const links=destinationServices({slug,name:destination.name,country:destination.country,countryCode:destination.countryCode??countryCodeForDestinationName(destination.country)});
  const mappedAttractions = links.find(item => item.key === "attractions");
  const hotelsHref="#destination-hotels-tab";
  const toursHref="#destination-tours";
  const flightsHref="#destination-transport-tab";
  const morePlaces = destinations.filter((item) => item.slug !== slug)
    .sort((a,b) => Number(destinationGeography(b.slug).region === destination.region) - Number(destinationGeography(a.slug).region === destination.region))
    .slice(0, 6);
  const suggestedGuides = blogs.filter((blog) => blog.category === "Planning" || blog.category === "Safety").slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <JsonLd data={breadcrumbData}/>
      <section className="relative isolate overflow-hidden border-b border-[var(--border)]" data-travel-hero="true">
        <Image src={visual} alt="" fill priority unoptimized={isIllustrativeVisual(visual)} sizes="100vw"
          className="absolute -z-20 object-cover opacity-25" />
        <div className="absolute inset-0 -z-10 bg-[var(--bg)]/80"/>
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <Link href="/destinations" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline">
              <ArrowLeft size={16}/> All Destinations
            </Link>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">
              <MapPin size={15}/> GTH PRO · Worldwide destination intelligence
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Discover {destination.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
              {destination.country ? destination.country+(destination.region?" · "+destination.region:"")+" · ":""}
              Connect this destination with the full Travel, Real Estate and Tender ecosystem.
              Booking, current prices, local conditions and room availability require independent supplier confirmation.
            </p>
            <nav aria-label="Destination page sections" className="mt-6 flex flex-wrap gap-3">
              <Link href={city?"#city-spine-hub":"#destination-ecosystem"} className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"><Globe2 size={17}/> Explore categories</Link>
              <Link href={hotelsHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm"><Hotel size={17}/> Book stays</Link>
              <Link href={toursHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm"><Compass size={17}/> Tours</Link>
              <Link href={flightsHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm"><Plane size={17}/> Flights</Link>
            </nav>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-xl"><Image src={visual} alt={isIllustrativeVisual(visual)?"":destination.name+" destination scenery"} fill unoptimized={isIllustrativeVisual(visual)} sizes="(max-width:1024px) 100vw,40vw" className="object-cover"/>{isIllustrativeVisual(visual)&&<span className="absolute bottom-2 left-2 rounded bg-[var(--card)] px-2 py-1 text-xs">Illustrative visual</span>}</div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]"><Sparkles size={17}/> One destination · four pillars</p>
            <h2 className="mt-4 text-xl font-semibold">Plan, stay, invest and discover.</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              Start with destination context, move to relevant travel options, explore source-backed property listings and access public tender intelligence.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {["Travel","Real Estate","Tenders","Tickets"].map((value)=><span key={value} className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2">{value}</span>)}
            </div>
          </div>
        </div>
      </section>
      <DestinationTravelSearch key={slug + ":" + destination.country} city={destination.name} country={destination.country}
        countryCode={destination.countryCode ?? countryCodeForDestinationName(destination.country)}/>
      <div className="mx-auto max-w-7xl px-4 pb-5 sm:px-6"><Link prefetch={false} href={links.find(item=>item.key==="packages")?.href??"/travel/packages"} className="gth-btn-gold inline-flex min-h-12 items-center gap-2 px-5">Build your {destination.name} travel plan <ArrowRight size={17}/></Link></div>
      <TravelSectionNav />
      <Suspense fallback={<p role="status" className="mx-auto max-w-7xl px-4 py-6 text-sm text-[var(--text-soft)]">Loading city-matched supplier options…</p>}>
        <DestinationSupplierPicks city={destination.name} country={destination.country} countryCode={destination.countryCode}/>
      </Suspense>

      {mobility&&<CityMobility city={mobility} compact/>}

      {city ? <CitySpineHub city={city} locale={locale} travelParams={stayParams}/> :
        <DestinationEcosystem slug={slug} name={destination.name} country={destination.country} countryCode={destination.countryCode}/>}
      {city&&mappedAttractions&&<nav aria-label="Mapped attractions discovery" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm sm:px-6">
        <p className="text-[var(--text-soft)]">Browse real OpenStreetMap records for {mappedAttractions.scope==="destination"?city.name:destination.country||"worldwide locations"}. Community map city tags may be incomplete.</p>
        <Link prefetch={false} href={mappedAttractions.href} className="inline-flex min-h-11 items-center gap-2 font-semibold underline">
          Explore mapped attractions <ArrowRight size={16} aria-hidden="true"/>
        </Link>
      </nav>}

      <section id="destination-discovery" className="mx-auto grid max-w-7xl scroll-mt-20 gap-6 px-4 py-12 sm:px-6 md:py-14 lg:grid-cols-[1fr_300px]">
        <article>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]"><Sparkles size={16}/> Destination briefing</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Explore {destination.name}</h2>
          {destination.country&&<p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-soft)]"><Globe2 size={15}/>{destination.country}{destination.region?" · "+destination.region:""}</p>}
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--text-soft)] sm:text-base">{destination.description}</p>
          <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">Editorial information only. Confirm visa rules, opening hours, transportation and local conditions with current official sources.</p>
        </article>
        <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="text-base font-semibold">Essential checks</h3>
          <div className="mt-4 space-y-4 text-sm text-[var(--text-soft)]">
            <p className="flex gap-3"><ShieldCheck size={17} className="shrink-0"/> Verify local requirements and safety</p>
            <p className="flex gap-3"><Hotel size={17} className="shrink-0"/> Check rooms, photos and terms with providers</p>
            <p className="flex gap-3"><Compass size={17} className="shrink-0"/> Confirm tour dates and inclusions</p>
          </div>
          <Link href="/guides" className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline">Travel Knowledge Hub <ArrowRight size={15}/></Link>
        </aside>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Travel knowledge</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Guides & planning</h2>
          <div role="region" aria-label="Travel guides horizontal cards" tabIndex={0}
            className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
            {suggestedGuides.map((article)=>(
              <Link href={"/blog/"+article.slug} key={article.slug}
                className="flex h-64 w-60 shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:-translate-y-1 hover:shadow-lg">
                <BookOpen size={21} aria-hidden="true"/>
                <h3 className="mt-3 line-clamp-2 text-base font-semibold">{article.title}</h3>
                <p className="mt-2 line-clamp-2 text-xs text-[var(--text-soft)]">{article.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 text-xs font-semibold">Read guide <ArrowRight size={15}/></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-14">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold sm:text-2xl">More worldwide destinations</h2>
          <Link href="/destinations" className="inline-flex items-center gap-2 text-sm font-semibold underline">All destinations <ArrowRight size={16}/></Link>
        </div>
        <div role="region" aria-label="More destinations horizontal cards" tabIndex={0}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
          {morePlaces.map((place)=><DestinationCard key={place.slug} destination={{
            slug:place.slug,title:place.name,image:place.image_url,description:place.description,
            location:"Editorial destination guide",...destinationGeography(place.slug)
          }}/>)}
        </div>
        <p className="mt-7 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)]">
          <ShieldCheck size={18} className="mt-1 shrink-0"/>
          GTH PRO provides discovery and research. Approved providers independently handle final reservations, fares, bookings, payments and policies.
        </p>
      </section>
    </main>
  );
}
