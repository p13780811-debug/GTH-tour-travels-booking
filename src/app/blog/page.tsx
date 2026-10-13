import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass, Hotel, Plane, ShieldCheck } from "lucide-react";
import { blogs, type Blog } from "@/data/blogs";

export const metadata: Metadata = {
  title: "Travel Guides & Booking Checklists | GTH PRO",
  description: "Practical flight, hotel, tour and travel-planning guides. Learn what to verify before booking with an external provider.",
  openGraph: {
    title: "Travel Guides | GTH PRO",
    description: "Useful travel booking guides and safety checklists, connected to Flights, Hotels and Activities.",
    type: "website",
  },
};

type Category = Blog["category"] | "All";
const categories: Category[] = ["All", "Flights", "Hotels", "Experiences", "Planning", "Safety"];
type Props = { searchParams: Promise<{ category?: string | string[] }> };

export default async function BlogList({ searchParams }: Props) {
  const params = await searchParams;
  const selected = typeof params.category === "string" && categories.includes(params.category as Category)
    ? params.category as Category
    : "All";
  const articles = selected === "All" ? blogs : blogs.filter((article) => article.category === selected);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="relative isolate overflow-hidden border-b border-[var(--border)]">
        <Image src="/images/cities/paris.jpg" fill priority alt="" sizes="100vw"
          className="absolute inset-0 -z-20 object-cover opacity-25" />
        <div className="absolute inset-0 -z-10 bg-[var(--bg)]/80" />
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">GTH PRO • Travel knowledge</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">Travel guides that help you book with confidence</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-soft)] md:text-base">
            Compare options with practical checklists. Our guides explain what to confirm with airlines,
            hotels and activity operators before committing to a booking.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link href="/flights" className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm"><Plane size={16} /> Flights</Link>
            <Link href="/hotels" className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm"><Hotel size={16} /> Hotels</Link>
            <Link href="/activities" className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm"><Compass size={16} /> Experiences</Link>
            <Link href="/guides" className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm"><BookOpen size={16} /> Guides</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Explore our travel guides</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">Evergreen travel-planning advice, not live price or regulatory updates.</p>
          </div>
          <p className="text-xs text-[var(--text-soft)]">{articles.length} articles</p>
        </div>
        <nav aria-label="Filter travel guides by topic" className="mt-7 flex gap-2 overflow-x-auto pb-3">
          {categories.map((category) => (
            <Link key={category} href={category === "All" ? "/blog" : `/blog?category=${encodeURIComponent(category)}`}
              aria-current={selected === category ? "page" : undefined}
              className={`shrink-0 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium ${selected === category ? "gth-btn-gold" : "gth-glass"}`}>
              {category}
            </Link>
          ))}
        </nav>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((blog) => (
            <Link key={blog.slug} href={`/blog/${blog.slug}`}
              className="gth-glass group overflow-hidden rounded-2xl border border-[var(--border)] transition-shadow hover:shadow-lg">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={blog.image} alt={blog.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="space-y-4 p-6">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-soft)]">{blog.category}</span>
                <h3 className="text-xl font-semibold leading-snug">{blog.title}</h3>
                <p className="line-clamp-3 text-sm leading-6 text-[var(--text-soft)]">{blog.description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold">Read guide <ArrowUpRight size={16} aria-hidden="true" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] p-5 text-sm leading-6 text-[var(--text-soft)]">
          <ShieldCheck size={19} className="mt-1 shrink-0" aria-hidden="true" />
          <p>Guides are general planning information, not a substitute for official immigration requirements,
          airline terms or provider-specific refund conditions. Always independently confirm current details.</p>
        </div>
      </section>
    </main>
  );
}
