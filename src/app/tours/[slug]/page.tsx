import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, ArrowUpRight, Compass, ShieldCheck } from "lucide-react";
import RelatedCarousel from "@/components/RelatedCarousel";
import JsonLd from "@/components/seo/JsonLd";
import { siteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
const fields = "id,title,city,city_slug,country,price_numeric,currency,rating,image_url,affiliate_link";

function publicPartnerLink(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    const domains = ["klook.com", "trip.com", "booking.com", "hotellook.com", "viator.com",
      "getyourguide.com", "expedia.com", "tp.media", "tpo.lv"];
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    return domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
      ? url.toString() : null;
  } catch {
    return null;
  }
}

function imageUrl(value: unknown): string {
  if (typeof value !== "string") return "/placeholder.jpg";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try { return new URL(value).protocol === "https:" ? value : "/placeholder.jpg"; }
  catch { return "/placeholder.jpg"; }
}

function quote(price: unknown, currency: unknown): string {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0 ||
      typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) return "Confirm current price with partner";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(price) + " • listed";
  } catch {
    return "Confirm current price with partner";
  }
}

async function getTour(slug: string) {
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(slug)) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key);
  const isId = /^\d+$/.test(slug) || /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(slug);
  const query = client.from("tours").select(fields).limit(1);
  const { data, error } = isId
    ? await query.eq("id", slug).maybeSingle()
    : await query.eq("city_slug", slug).maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTour(slug);
  if (!tour) return { title: "Tour not found | GTH PRO", robots: { index: false } };
  return {
    title: `${tour.title} | GTH PRO Tours`,
    description: `Explore ${tour.title}. Review the itinerary, final price, availability and cancellation terms with the booking partner.`,
    alternates: { canonical: `/tours/${encodeURIComponent(slug)}` },
    openGraph: { title: tour.title, description: `Explore ${tour.title}. Confirm current prices, tour details and availability with the provider.`, url: `/tours/${encodeURIComponent(slug)}`, type: "website" },
  };
}

export default async function TourDetailPage({ params }: Props) {
  const { slug } = await params;
  const tour = await getTour(slug);
  if (!tour) notFound();

  const partner = publicPartnerLink(tour.affiliate_link);
  const shownPrice = quote(tour.price_numeric, tour.currency);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let related: Record<string, unknown>[] = [];
  if (url && key && typeof tour.country === "string" && tour.country.trim()) {
    try {
      const client = createClient(url, key);
      const response = await client.from("tours").select(fields)
        .eq("country", tour.country).neq("id", tour.id).limit(8);
      if (!response.error) related = (response.data || []) as Record<string, unknown>[];
    } catch {
      // A missing recommendations feed must not break the actual experience page.
    }
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Tours and Activities", item: siteUrl("/tours") },
      { "@type": "ListItem", position: 2, name: tour.title, item: siteUrl(`/tours/${encodeURIComponent(slug)}`) },
    ],
  };
  const symbolMap: Record<string, string> = { INR: "₹", USD: "$", EUR: "€" };
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <JsonLd data={breadcrumbData} />
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={imageUrl(tour.image_url)} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-[var(--bg)]/75" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <Link href="/tours" className="inline-flex items-center gap-2 text-sm underline"><ArrowLeft size={16} /> All tours</Link>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
            {tour.city || tour.city_slug} {tour.country ? `• ${tour.country}` : ""}
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight md:text-6xl">{tour.title}</h1>
          <p className="mt-4 text-2xl font-bold">{shownPrice}</p>
          <p className="mt-2 max-w-3xl text-sm text-[var(--text-soft)]">
            Listing price, if available, is not a live date-specific quote. Confirm all costs and conditions on the partner site.
          </p>
          {partner ? (
            <a href={partner} target="_blank" rel="noopener noreferrer sponsored"
              className="gth-btn-gold mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold">
              Continue to booking partner <ArrowUpRight size={17} />
            </a>
          ) : (
            <p role="status" className="mt-6 text-sm">Online partner booking link is unavailable for this listing.</p>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 md:grid-cols-[minmax(0,1fr)_300px] md:px-6">
        <div className="gth-glass rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-xl font-semibold">Before booking this experience</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
            Explore {tour.title}. Detailed itinerary, operating dates, accessibility,
            traveler requirements, pickup arrangements and inclusions should be confirmed with the actual provider.
          </p>
          <ul className="mt-5 list-inside list-disc space-y-2 text-sm text-[var(--text-soft)]">
            <li>Confirm meeting point, timings and duration.</li>
            <li>Review total prices, taxes, fees and optional extras.</li>
            <li>Check date-specific availability and cancellation terms.</li>
            <li>Review safety and age requirements for your group.</li>
          </ul>
        </div>
        <aside className="gth-glass self-start rounded-2xl border border-[var(--border)] p-6">
          <ShieldCheck size={20} aria-hidden="true" />
          <h2 className="mt-3 font-semibold">Booking transparency</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            GTH PRO lists experiences. Payment, confirmation, cancellations and traveler support are handled by the booking provider.
          </p>
          <Link href="/hotels" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline">
            Find hotels for your trip <Compass size={16} />
          </Link>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6">
          <RelatedCarousel related={related} symbolMap={symbolMap} />
        </section>
      )}
      <nav aria-label="Continue travel planning" className="mx-auto flex max-w-7xl flex-wrap gap-4 px-4 pb-12 text-sm md:px-6">
        <Link href="/flights" className="underline">Flights</Link>
        <Link href="/hotels" className="underline">Hotels</Link>
        <Link href="/guides" className="underline">Travel guides</Link>
        <Link href="/destinations" className="underline">Destinations</Link>
      </nav>
    </main>
  );
}
