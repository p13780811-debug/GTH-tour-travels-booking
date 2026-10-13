import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, BookOpen, Compass, Hotel, MapPin, Plane, ShieldCheck } from "lucide-react";
import { destinations, type DestinationOverview } from "@/data/destinations";
import { getTours } from "@/lib/tours";
import { blogs } from "@/data/blogs";
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
      image_url: editorial?.image_url || "/images/default-city.jpg",
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

  const availableTours = (await getTours({ city: slug })).slice(0, 6);
  const morePlaces = destinations.filter((item) => item.slug !== slug).slice(0, 6);
  const suggestedGuides = blogs.filter((blog) => blog.category === "Planning" || blog.category === "Safety").slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={destination.image_url} alt={destination.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 text-white md:px-6 md:py-28">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
            <MapPin size={16} aria-hidden="true" /> GTH PRO Destination Discovery
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-7xl">{destination.name}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/90 md:text-base">
            Find relevant accommodation, experiences and planning guides. Check current availability,
            prices, opening times and local requirements with the actual providers.
          </p>
          <nav aria-label={`Plan your ${destination.name} visit`} className="mt-7 flex flex-wrap gap-3">
            <Link href={`/hotels?city=${encodeURIComponent(destination.name)}`}
              className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">
              <Hotel size={17} /> Find hotels
            </Link>
            <Link href={`/tours?city=${encodeURIComponent(slug)}`}
              className="gth-glass inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm">
              <Compass size={17} /> Explore experiences
            </Link>
            <Link href="/flights" className="gth-glass inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm">
              <Plane size={17} /> Search flights
            </Link>
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <h2 className="text-2xl font-bold">About {destination.name}</h2>
        <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-[var(--text-soft)] md:text-base">
          {destination.description}
        </p>
        <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">
          Destination information is for planning and inspiration; it is not a live visitor advisory.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Hotel listings in {destination.name}</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Browse records returned by our hotel listings API. Booking is completed on partner websites.
            </p>
          </div>
          <Link href={`/hotels?city=${encodeURIComponent(destination.name)}`} className="text-sm underline">All matching hotels</Link>
        </div>
        <HotelResults city={destination.name} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Experiences to explore</h2>
          <Link href={`/tours?city=${encodeURIComponent(slug)}`} className="text-sm underline">All tour listings</Link>
        </div>
        {availableTours.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableTours.map((tour) => (
              <Link key={String(tour.id)} href={`/tours/${encodeURIComponent(String(tour.id))}`}
                className="gth-glass flex min-w-0 flex-col rounded-2xl border border-[var(--border)] p-5">
                <span className="text-xs text-[var(--text-soft)]">{tour.category || "Tour listing"}</span>
                <h3 className="mt-2 font-semibold">{tour.title}</h3>
                <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">
                  Confirm operator availability, inclusions and prices before booking.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">View experience <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div role="status" className="gth-glass rounded-2xl border border-[var(--border)] p-6 text-sm text-[var(--text-soft)]">
            No source-backed tour listings currently displayed for {destination.name}. This does not mean all experiences are sold out.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
        <h2 className="mb-5 text-2xl font-bold">Planning guides</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {suggestedGuides.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`}
              className="gth-glass rounded-2xl border border-[var(--border)] p-5">
              <BookOpen size={18} aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{article.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{article.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 md:px-6">
        <h2 className="mb-5 text-2xl font-bold">More places to discover</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {morePlaces.map((place) => (
            <Link key={place.slug} href={`/destinations/${place.slug}`}
              className="gth-glass min-w-0 overflow-hidden rounded-2xl border border-[var(--border)]">
              <div className="relative aspect-[4/3]">
                <Image src={place.image_url} alt={place.name} fill sizes="(max-width: 768px) 48vw, (max-width: 1280px) 33vw, 16vw" className="object-cover" />
              </div>
              <p className="p-3 text-sm font-semibold">{place.name}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[var(--border)] p-5 text-sm leading-6 text-[var(--text-soft)]">
          <ShieldCheck size={18} className="mt-1 shrink-0" aria-hidden="true" />
          <p>GTH PRO provides discovery links. External booking providers handle final pricing, reservations,
            payment, cancellations and support. Verify current travel and entry rules with official sources.</p>
        </div>
      </section>
    </main>
  );
}
