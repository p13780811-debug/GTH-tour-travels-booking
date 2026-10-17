import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, BookOpen, Compass, Globe2, Hotel, MapPin, Plane, ShieldCheck, Sparkles } from "lucide-react";
import DestinationCard from "@/components/destination/DestinationCard";
import DestinationEcosystem from "@/components/destination/DestinationEcosystem";
import { destinations, destinationImageForSlug, type DestinationOverview } from "@/data/destinations";
import { getTours } from "@/lib/tours";
import { blogs } from "@/data/blogs";
import { siteUrl } from "@/lib/seo/site";
import JsonLd from "@/components/seo/JsonLd";
import HotelResults from "@/app/hotels/results/HotelResults";
import { destinationGeography } from "@/lib/destinations/geography";

type Props = { params: Promise<{ slug: string }> };
type DestinationDetail = DestinationOverview & { description: string; country: string | null; region: string | null };

async function getDestination(slug: string): Promise<DestinationDetail | null> {
  if (!/^[a-z]+(?:-[a-z]+)*$/.test(slug) || slug.length > 80) return null;
  const editorialBase = destinations.find((item) => item.slug === slug) ?? null;
  const editorial: DestinationDetail | null = editorialBase ? { ...editorialBase, ...destinationGeography(slug) } : null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return editorial;

  try {
    const client = createClient(url, key);
    const { data, error } = await client.from("destinations")
      .select("slug,name,description,country")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return editorial;
    const name = typeof data.name === "string" && data.name.trim().length <= 120
      ? data.name.trim()
      : editorial?.name;
    if (!name) return editorial;
    return {
      slug,
      name,
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await getDestination(slug);
  if (!place) return { title: "Destination not found | GTH PRO", robots: { index: false } };
  return {
    title: `Explore ${place.name} | GTH PRO Destinations`,
    description: `Plan a trip to ${place.name}: discover accommodation, tour listings and practical travel guides. Verify current prices and booking conditions with providers.`,
    alternates: { canonical: `/destinations/${slug}` },
    openGraph: {
      title: `Explore ${place.name} | GTH PRO Travel`,
      images: [{ url: place.image_url, alt: place.name }],
      type: "website",
    },
  };
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) notFound();

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Destinations", item: siteUrl("/destinations") },
      { "@type": "ListItem", position: 2, name: destination.name, item: siteUrl(`/destinations/${slug}`) },
    ],
  };
  const availableTours = (await getTours({ city: slug })).slice(0, 6);
  const morePlaces = destinations.filter((item) => item.slug !== slug)
    .sort((a,b) => Number(destinationGeography(b.slug).region === destination.region) - Number(destinationGeography(a.slug).region === destination.region))
    .slice(0, 6);
  const suggestedGuides = blogs.filter((blog) => blog.category === "Planning" || blog.category === "Safety").slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <JsonLd data={breadcrumbData}/>
      <section className="relative isolate overflow-hidden border-b border-[var(--border)]">
        <Image src={destination.image_url} alt={destination.name} fill priority sizes="100vw"
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
              <Link href="#destination-ecosystem" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"><Globe2 size={17}/> Explore categories</Link>
              <Link href="#destination-hotels" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm"><Hotel size={17}/> Hotels</Link>
              <Link href="#destination-tours" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm"><Compass size={17}/> Tours</Link>
              <Link href="/flights" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm"><Plane size={17}/> Flights</Link>
            </nav>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]"><Sparkles size={17}/> One destination · three pillars</p>
            <h2 className="mt-4 text-xl font-semibold">Plan, stay, invest and discover.</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              Start with destination context, move to relevant travel options, explore source-backed property listings and access public tender intelligence.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {["Travel","Real Estate","Tenders"].map((value)=><span key={value} className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2">{value}</span>)}
            </div>
          </div>
        </div>
      </section>

      <DestinationEcosystem slug={slug} name={destination.name} country={destination.country}/>

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

      <section id="destination-hotels" className="scroll-mt-20 border-y border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Source-backed accommodation</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Hotels in {destination.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Only available source catalog records are displayed. Provider handles final booking and prices.</p>
            </div>
            <Link href={"/hotels?destination="+encodeURIComponent(slug)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">All Hotels <ArrowRight size={15}/></Link>
          </div>
          <HotelResults city={destination.name} destination={slug}/>
        </div>
      </section>

      <section id="destination-tours" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 md:py-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Experience discovery</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Tours & experiences in {destination.name}</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">Real tour catalog entries where present; never simulated availability.</p>
          </div>
          <Link href={"/tours?city="+encodeURIComponent(slug)} className="inline-flex items-center gap-2 text-sm font-semibold underline">All tours <ArrowRight size={16}/></Link>
        </div>
        {availableTours.length>0?(
          <div role="region" aria-label="Tours horizontal cards" tabIndex={0}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
            {availableTours.map((tour)=>(
              <Link key={String(tour.id)} href={"/tours/"+encodeURIComponent(String(tour.id))}
                className="group flex h-48 w-60 shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="flex items-center gap-2 text-xs font-medium text-[var(--text-soft)]"><Compass size={15}/> {tour.category||"Tour listing"}</span>
                <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-snug">{tour.title}</h3>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">Verify inclusions, dates and provider conditions.</p>
                <span className="mt-auto inline-flex items-center gap-2 text-xs font-semibold">View experience <ArrowRight size={15}/></span>
              </Link>
            ))}
          </div>
        ):(
          <div role="status" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--text-soft)]">
            No source-backed tours are currently displayed for {destination.name}. This does not mean every experience is unavailable.
            <Link href={"/tours?city="+encodeURIComponent(slug)} className="mt-3 block font-semibold underline">Browse tour discovery</Link>
          </div>
        )}
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Travel knowledge</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Guides & planning</h2>
          <div role="region" aria-label="Travel guides horizontal cards" tabIndex={0}
            className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
            {suggestedGuides.map((article)=>(
              <Link href={"/blog/"+article.slug} key={article.slug}
                className="flex h-48 w-60 shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:-translate-y-1 hover:shadow-lg">
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
