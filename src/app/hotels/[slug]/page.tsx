import TravelSectionNav from "@/components/travel/TravelSectionNav";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BedDouble, BookOpen, Compass, Plane, ShieldCheck } from "lucide-react";
import HotelResults from "../results/HotelResults";
import JsonLd from "@/components/seo/JsonLd";
import { siteUrl } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

const cityPhotos: Record<string, string> = {
  "mumbai": "/images/cities/mumbai.jpg",
  "goa": "/images/cities/goa.jpg",
  "dubai": "/images/cities/dubai.jpg",
  "london": "/images/cities/london.jpg",
  "singapore": "/images/cities/singapore.jpg",
  "bangkok": "/images/cities/bangkok.jpg",
  "paris": "/images/cities/paris.jpg",
  "new-york": "/images/cities/new-york.jpg",
  "bali": "/images/cities/bali.jpg",
  "tokyo": "/images/cities/tokyo.jpg",
  "jaipur": "/images/cities/jaipur.jpg",
  "delhi": "/images/cities/delhi.jpg",
};

function cityFromSlug(slug: string) {
  if (!/^[a-z]+(?:-[a-z]+)*$/.test(slug) || slug.length > 80) return null;
  const citySlug = slug.startsWith("hotels-in-") ? slug.slice("hotels-in-".length) : slug;
  if (!citySlug || citySlug.length < 2) return null;
  const city = citySlug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return { city, citySlug };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const parsed = cityFromSlug(slug);
  if (!parsed) return { title: "Hotel listings | GTH PRO", robots: { index: false } };
  return {
    title: `Hotels in ${parsed.city} | GTH PRO Travel`,
    description: `Explore hotel listings in ${parsed.city} and continue to booking partners to confirm availability, current total cost, policies and cancellation terms.`,
    alternates: { canonical: `/hotels/${parsed.citySlug}` },
    openGraph: { title: `Hotels in ${parsed.city} | GTH PRO`, description: `Explore hotels in ${parsed.city} and verify current rates with booking partners.`, url: `/hotels/${parsed.citySlug}`, type: "website", ...(cityPhotos[parsed.citySlug] ? { images: [cityPhotos[parsed.citySlug]] } : {}) },
    ...(cityPhotos[parsed.citySlug] ? {} : { robots: { index: false } }),
  };
}

export default async function HotelCityPage({ params }: Props) {
  const { slug } = await params;
  const parsed = cityFromSlug(slug);
  if (!parsed) notFound();

  const image = cityPhotos[parsed.citySlug] || "/images/cities/default.jpg";
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hotels", item: siteUrl("/hotels") },
      { "@type": "ListItem", position: 2, name: `Hotels in ${parsed.city}`, item: siteUrl(`/hotels/${parsed.citySlug}`) },
    ],
  };
  const links = [
    { href: "/flights", label: "Find flights", Icon: Plane },
    { href: "/tours", label: "Tours & activities", Icon: Compass },
    { href: "/guides", label: "Travel guides", Icon: BookOpen },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <JsonLd data={breadcrumbData} />
      <section className="relative isolate overflow-hidden" data-travel-hero="true">
        <div className="absolute inset-0 -z-10">
          <Image src={image} fill priority alt={`Travel destination: ${parsed.city}`} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-20 text-white md:px-6 md:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">GTH PRO • Hotel discovery</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight md:text-6xl">Explore hotels in {parsed.city}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 md:text-base">
            Discover available hotel listings, then confirm room type, cancellation rules,
            taxes and final prices directly with the booking partner.
          </p>
          <Link href={`/hotels?city=${encodeURIComponent(parsed.city)}`}
            className="gth-btn-gold mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold">
            <BedDouble size={18} /> Search hotels in {parsed.city}
          </Link>
        </div>
      </section>
      <TravelSectionNav />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold md:text-3xl">Hotel listings for {parsed.city}</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">Listings depend on available database inventory; no simulated prices or reviews.</p>
          </div>
          <Link href="/hotels" className="text-sm underline">All hotels</Link>
        </div>
        <HotelResults city={parsed.city} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <h2 className="mb-5 text-xl font-bold md:text-2xl">Keep planning your trip</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {links.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className="gth-glass flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] p-5">
              <span className="flex items-center gap-3 font-semibold"><Icon size={18} /> {label}</span>
              <ArrowRight size={17} />
            </Link>
          ))}
        </div>
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[var(--border)] p-5 text-sm text-[var(--text-soft)]">
          <ShieldCheck size={18} className="mt-1 shrink-0" aria-hidden="true" />
          <p>GTH PRO does not confirm rooms or process payments on this page. Booking, payment, changes,
          support, refunds and final inclusive pricing are subject to the provider's terms.</p>
        </div>
      </section>
    </main>
  );
}
