import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Hotel, Plane } from "lucide-react";
import { blogs } from "@/data/blogs";

export const metadata: Metadata = {
  title: "Travel Planning Guides | GTH PRO",
  description: "Travel-planning resources covering flights, accommodation, activities, booking security and destination research.",
};

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">GTH PRO • Travel resource hub</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">Plan better with practical travel guides</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">
          Understand your booking choices before committing to flights, hotels or experiences.
          These resources contain general checklists—not live prices, guaranteed discounts or official entry advice.
        </p>
        <nav aria-label="Related travel modules" className="mt-7 flex flex-wrap gap-3 text-sm">
          <Link href="/flights" className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3"><Plane size={17} /> Flights</Link>
          <Link href="/hotels" className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3"><Hotel size={17} /> Hotels</Link>
          <Link href="/tours" className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3"><Compass size={17} /> Tours & Activities</Link>
          <Link href="/destinations" className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3"><Compass size={17} /> Destinations</Link>
        </nav>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-bold"><BookOpen size={23} /> Essential checklists</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">{blogs.length} complete editorial guides covering real travel decisions.</p>
          </div>
          <Link href="/blog" className="shrink-0 text-sm underline">All topics</Link>
        </div>
        <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((item) => (
            <Link key={item.slug} href={`/blog/${item.slug}`}
              className="gth-glass group min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] transition-shadow hover:shadow-lg">
              <div className="relative aspect-[16/9]">
                <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-soft)]">{item.category}</p>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-soft)]">{item.description}</p>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                  Read guide <ArrowRight size={16} />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
