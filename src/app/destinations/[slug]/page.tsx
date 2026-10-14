import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, BookOpen, Compass, Globe2, Hotel, MapPin, Plane, ShieldCheck, Sparkles } from "lucide-react";
import { destinations, destinationImageForSlug, type DestinationOverview } from "@/data/destinations";
import { getTours } from "@/lib/tours";
import { blogs } from "@/data/blogs";
import { siteUrl } from "@/lib/seo/site";
import JsonLd from "@/components/seo/JsonLd";
import HotelResults from "@/app/hotels/results/HotelResults";

type Props = { params: Promise<{ slug: string }> };
type DestinationDetail = DestinationOverview & { description: string };

async function getDestination(slug: string): Promise<DestinationDetail | null> {
  if (!/^[a-z]+(?:-[a-z]+)*$/.test(slug) || slug.length > 80) return null;
  const editorial = destinations.find((item) => item.slug === slug) ?? null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return editorial;

  try {
    const client = createClient(url, key);
    const { data, error } = await client.from("destinations")
      .select("slug,name,description")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return editorial;
    const name = typeof data.name === "string" && data.name.trim().length <= 120
      ? data.name.trim()
      : editorial?.name;
    if (!name) return editorial;
    return {
      slug,
      name,
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
  const morePlaces = destinations.filter((item) => item.slug !== slug).slice(0, 6);
  const suggestedGuides = blogs.filter((blog) => blog.category === "Planning" || blog.category === "Safety").slice(0, 3);

  const palette = {
    "--bg": "#061426",
    "--text": "#f6f8fe",
    "--text-soft": "#c2cfdf",
    "--border": "rgba(234,198,113,.23)",
    "--card": "rgba(9,26,45,.9)",
    "--gold": "#eac671",
  } as CSSProperties;

  return (
    <main style={palette} className="min-h-screen bg-[#061426] text-[#f6f8fe]">
      <JsonLd data={breadcrumbData} />
      <section className="relative isolate overflow-hidden border-b border-[#eac671]/25">
        <Image src={destination.image_url} alt={destination.name} fill priority sizes="100vw"
          className="absolute -z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020b1d]/95 via-[#041426]/88 to-[#061426]/60" />
        <div className="mx-auto grid max-w-[1400px] items-center gap-8 px-5 py-16 sm:px-8 md:py-24 lg:min-h-[490px] lg:grid-cols-[1.35fr_.65fr]">
          <div>
            <Link href="/destinations" className="inline-flex items-center gap-2 text-xs font-semibold text-[#ffe09c] hover:underline">
              <ArrowLeft size={16} /> All Destinations
            </Link>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#eac671]/40 bg-[#071729]/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#f2d48d]">
              <MapPin size={15} /> GTH PRO / Destination Intelligence
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-.045em] sm:text-6xl lg:text-[76px]">
              Discover <span className="text-[#f0d38d]">{destination.name}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#d4deec] sm:text-base">
              Local inspiration, city insights and direct access to hotel and experience discovery. Confirm prices, availability and entry rules with the provider before booking.
            </p>
            <nav aria-label={"Plan travel to " + destination.name} className="mt-8 flex flex-wrap gap-3">
              <Link href={"/hotels?city=" + encodeURIComponent(destination.name)}
                className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-bold">
                <Hotel size={18} /> Find Hotels
              </Link>
              <Link href={"/tours?city=" + encodeURIComponent(slug)}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#eac671]/55 bg-[#071729]/70 px-5 text-sm font-semibold text-[#ffe3a4]">
                <Compass size={18} /> Explore Tours
              </Link>
              <Link href="/flights" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 bg-[#071729]/70 px-5 text-sm font-semibold text-white">
                <Plane size={18} /> Compare Flights
              </Link>
            </nav>
          </div>
          <div className="rounded-2xl border border-[#eac671]/35 bg-[#031226]/80 p-6 shadow-[0_18px_50px_rgba(0,0,0,.3)] backdrop-blur-md">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#f0d38d]">
              <Globe2 size={17} /> Your journey, connected
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">One destination. More ways to explore.</h2>
            <p className="mt-4 text-sm leading-7 text-[#d2ddeb]">Research experiences, compare accommodation choices and read practical planning guidance from the GTH PRO ecosystem.</p>
            <Link href="#destination-discovery" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#f2d58e]">
              Explore the destination <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section id="destination-discovery" className="mx-auto grid max-w-[1400px] scroll-mt-14 gap-7 px-5 py-12 sm:px-8 md:py-16 lg:grid-cols-[1fr_320px]">
        <article>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#f0d38d]"><Sparkles size={15} /> Destination briefing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Explore {destination.name}</h2>
          <p className="mt-5 whitespace-pre-line text-sm leading-8 text-[#cbd8e7] sm:text-base">{destination.description}</p>
          <p className="mt-5 text-xs leading-6 text-[#aab9ce]">Editorial information only. Opening hours, travel restrictions and local conditions must be confirmed with current official sources.</p>
        </article>
        <aside className="self-start rounded-2xl border border-[#eac671]/25 bg-[#0c2037] p-6">
          <h3 className="text-lg font-semibold text-white">Research essentials</h3>
          <div className="mt-5 space-y-4 text-sm text-[#d3deeb]">
            <p className="flex gap-3"><ShieldCheck size={18} className="shrink-0 text-[#f0d38d]" /> Check current local entry and safety requirements</p>
            <p className="flex gap-3"><Hotel size={18} className="shrink-0 text-[#f0d38d]" /> Verify actual dates, room options and terms</p>
            <p className="flex gap-3"><Compass size={18} className="shrink-0 text-[#f0d38d]" /> Confirm tour operator inclusions and schedules</p>
          </div>
          <Link href="/blog" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#ffe09c]">Travel Knowledge Hub <ArrowRight size={16} /></Link>
        </aside>
      </section>

      <section id="destination-hotels" className="border-y border-[#eac671]/20 bg-[#08192d]">
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 md:py-16">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#eac671]">Stay Discovery</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Hotels in {destination.name}</h2>
              <p className="mt-3 max-w-3xl text-sm text-[#c0ccdd]">Source-backed hotel records when available. Final room rates and reservations are handled by the partner.</p>
            </div>
            <Link href={"/hotels?city=" + encodeURIComponent(destination.name)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/45 px-4 text-sm font-semibold text-[#f2d58e]">All Hotels <ArrowRight size={16} /></Link>
          </div>
          <HotelResults city={destination.name} />
        </div>
      </section>

      <section id="destination-tours" className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 md:py-16">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#eac671]">Experience Discovery</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Explore beyond the usual</h2>
            <p className="mt-3 text-sm text-[#c0ccdd]">Tour listings shown only when returned by the connected catalog.</p>
          </div>
          <Link href={"/tours?city=" + encodeURIComponent(slug)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#f2d58e]">View tours <ArrowRight size={16} /></Link>
        </div>
        {availableTours.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {availableTours.map((tour) => (
              <Link key={String(tour.id)} href={"/tours/" + encodeURIComponent(String(tour.id))}
                className="group flex min-w-0 flex-col rounded-2xl border border-[#eac671]/25 bg-[#0c2037] p-6 transition hover:-translate-y-1 hover:border-[#eac671]/70">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#f0d38d]"><Compass size={16} /> {tour.category || "Tour listing"}</span>
                <h3 className="mt-5 text-xl font-semibold leading-snug text-white">{tour.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#c0ccdd]">Review itinerary, inclusions, operator availability and current prices before booking.</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-[#f0d38d]">View experience <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div role="status" className="rounded-2xl border border-[#eac671]/25 bg-[#0c2037] p-7 text-sm text-[#ced9e7]">
            No source-backed tours are currently displayed for {destination.name}. This does not mean every experience is unavailable.
            <Link href={"/tours?city=" + encodeURIComponent(slug)} className="mt-4 block font-semibold text-[#f0d38d] underline">Browse tour discovery</Link>
          </div>
        )}
      </section>

      <section className="border-t border-[#eac671]/20 bg-[#041123]">
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 md:py-14">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#eac671]">Travel Research</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Plan with real knowledge</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedGuides.map((article) => (
              <Link href={"/blog/" + article.slug} key={article.slug}
                className="group flex flex-col rounded-2xl border border-[#eac671]/25 bg-[#0d2037] p-6 transition hover:border-[#eac671]/70">
                <BookOpen size={22} className="text-[#f0d38d]" />
                <h3 className="mt-5 font-semibold leading-snug text-white">{article.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#c0ccdd]">{article.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#f0d38d]">Read guide <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 md:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold sm:text-3xl">More destinations to discover</h2>
          <Link href="/destinations" className="inline-flex items-center gap-2 text-sm font-semibold text-[#f0d38d]">All destinations <ArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {morePlaces.map((place) => (
            <Link key={place.slug} href={"/destinations/" + place.slug}
              className="group min-w-0 overflow-hidden rounded-xl border border-[#eac671]/30 bg-[#0d2037] transition hover:border-[#eac671]/80">
              <div className="relative aspect-[4/3]">
                <Image src={place.image_url} alt={place.name} fill
                  sizes="(max-width: 640px) 47vw, (max-width: 1024px) 31vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <p className="p-3 text-sm font-semibold text-white">{place.name}</p>
            </Link>
          ))}
        </div>
        <p className="mt-8 flex items-start gap-3 rounded-xl border border-[#eac671]/25 bg-[#0b1d32] p-5 text-xs leading-6 text-[#c0ccdd]">
          <ShieldCheck size={18} className="mt-1 shrink-0 text-[#eac671]" />
          GTH PRO provides research and discovery links. External booking providers handle final prices, reservations, payments, cancellations and customer support.
        </p>
      </section>
    </main>
  );
}
