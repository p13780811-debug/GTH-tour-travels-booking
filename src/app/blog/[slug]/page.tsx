import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowRight, BookOpen, Compass, Hotel, Plane, ShieldCheck } from "lucide-react";
import { blogs } from "@/data/blogs";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = blogs.find((article) => article.slug === slug);
  if (!blog) return { title: "Guide not found | GTH PRO", robots: { index: false } };
  return {
    title: `${blog.title} | GTH PRO Travel Guides`,
    description: blog.description,
    openGraph: {
      title: blog.title,
      description: blog.description,
      images: [{ url: blog.image, alt: blog.title }],
      type: "article",
    },
    alternates: { canonical: `/blog/${blog.slug}` },
  };
}

export default async function BlogPage({ params }: Props) {
  const { slug } = await params;
  const blog = blogs.find((article) => article.slug === slug);
  if (!blog) notFound();

  const related = blogs.filter((item) => item.slug !== blog.slug &&
    item.category === blog.category).slice(0, 3);
  const more = related.length ? related : blogs.filter((item) => item.slug !== blog.slug).slice(0, 3);

  const minutes = Math.max(2, Math.ceil(blog.content.trim().split(/\s+/).length / 190));
  const palette = {
    "--bg": "#061426",
    "--text": "#f6f8fe",
    "--text-soft": "#c2cfdf",
    "--border": "rgba(234,198,113,.25)",
    "--card": "rgba(9,26,45,.9)",
    "--gold": "#eac671",
  } as CSSProperties;

  return (
    <main style={palette} className="min-h-screen bg-[#061426] text-[#f6f8fe]">
      <header className="relative isolate overflow-hidden border-b border-[#eac671]/25">
        <Image src={blog.image} alt="" fill priority sizes="100vw" className="absolute -z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#031021]/98 via-[#061426]/92 to-[#07172c]/75" />
        <div className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8 md:py-24">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#ffe3a4]">
            <Link href="/blog" className="inline-flex items-center gap-2 hover:underline"><ArrowLeft size={15} /> Travel Journal</Link>
            <span className="text-[#9facbf]">/</span>
            <span className="text-[#d8e2f0]">{blog.category}</span>
          </nav>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#eac671]/40 bg-[#061426]/75 px-4 py-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#f0d38d]">
            <BookOpen size={16} /> GTH PRO / Editorial Intelligence
          </p>
          <h1 className="mt-6 max-w-5xl text-4xl font-semibold leading-[1.13] tracking-[-.04em] sm:text-5xl lg:text-[60px]">{blog.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#d1dceb] sm:text-lg">{blog.description}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#d1dceb]">
            <span className="rounded-full border border-[#eac671]/30 bg-[#081b30]/80 px-4 py-2">{blog.category}</span>
            <span className="rounded-full border border-[#eac671]/30 bg-[#081b30]/80 px-4 py-2">{minutes} min read</span>
            <span className="rounded-full border border-[#eac671]/30 bg-[#081b30]/80 px-4 py-2">Travel Planning</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 px-5 py-10 sm:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article aria-label={blog.title} className="min-w-0 overflow-hidden rounded-2xl border border-[#eac671]/25 bg-[#0c2037] p-6 shadow-[0_18px_50px_rgba(0,0,0,.2)] sm:p-9 lg:p-12">
          <div className="mb-8 flex items-center gap-3 border-b border-[#eac671]/20 pb-6">
            <BookOpen size={20} className="shrink-0 text-[#f0d38d]" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#f0d38d]">Knowledge Before Booking</p>
              <p className="mt-1 text-sm text-[#c6d3e3]">A practical guide from the GTH PRO travel editorial library.</p>
            </div>
          </div>
          <div className="prose prose-base max-w-none prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-[#f9fafc] prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-xl prose-p:leading-8 prose-p:text-[#cedae8] prose-li:leading-7 prose-li:text-[#d0dbe7] prose-strong:text-white prose-blockquote:border-[#eac671] prose-blockquote:text-[#e6ebf5]">
            <ReactMarkdown
              components={{
                a: ({ href, children }) =>
                  href?.startsWith("/") && !href.startsWith("//")
                    ? <Link href={href} className="font-semibold text-[#ffe19a] underline underline-offset-4">{children}</Link>
                    : <span>{children}</span>,
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </div>
          <div className="mt-12 rounded-xl border border-[#eac671]/30 bg-[#06182c] p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#ffe09c]"><ShieldCheck size={19} /> Important travel information</p>
            <p className="mt-3 text-sm leading-7 text-[#c6d3e3]">
              Prices, availability, entry requirements and cancellation terms can change. Confirm current details with the relevant official authority, airline or booking provider before making a purchase.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 border-t border-[#eac671]/20 pt-7">
            <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/40 px-5 text-sm font-semibold text-[#f4d990]"><ArrowLeft size={17} /> All Travel Guides</Link>
            <Link href="/destinations" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/40 px-5 text-sm font-semibold text-[#f4d990]"><Compass size={17} /> Destinations</Link>
          </div>
        </article>

        <aside className="space-y-5 self-start lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[#eac671]/30 bg-[#0c2037] p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><BookOpen size={20} className="text-[#f0d38d]" /> Continue researching</h2>
            <nav aria-label="Travel research tools" className="mt-6 space-y-3 text-sm">
              <Link href="/flights" className="flex min-h-11 items-center gap-3 rounded-xl border border-[#eac671]/15 px-3 text-[#dbe5f1] hover:border-[#eac671]/50"><Plane size={17} className="text-[#f0d38d]" /> Compare Flights</Link>
              <Link href="/hotels" className="flex min-h-11 items-center gap-3 rounded-xl border border-[#eac671]/15 px-3 text-[#dbe5f1] hover:border-[#eac671]/50"><Hotel size={17} className="text-[#f0d38d]" /> Explore Hotels</Link>
              <Link href="/activities" className="flex min-h-11 items-center gap-3 rounded-xl border border-[#eac671]/15 px-3 text-[#dbe5f1] hover:border-[#eac671]/50"><Compass size={17} className="text-[#f0d38d]" /> Browse Activities</Link>
              <Link href="/destinations" className="flex min-h-11 items-center gap-3 rounded-xl border border-[#eac671]/15 px-3 text-[#dbe5f1] hover:border-[#eac671]/50"><Compass size={17} className="text-[#f0d38d]" /> Explore Destinations</Link>
            </nav>
          </div>
          <div className="rounded-2xl border border-[#eac671]/25 bg-[#0c2037] p-6 text-sm leading-7 text-[#cbd7e6]">
            <p className="font-semibold text-[#ffe19a]">Editorial standards</p>
            <p className="mt-3">These are general planning and consumer-readiness guides. They do not represent real-time fare quotes, official immigration advice or independently verified supplier reviews.</p>
          </div>
        </aside>
      </div>

      <section className="border-t border-[#eac671]/20 bg-[#041123]">
        <div className="mx-auto max-w-[1320px] px-5 py-12 sm:px-8 md:py-16">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#f0d38d]">Further Reading</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">More from the travel journal</h2>
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((item) => (
              <Link href={"/blog/" + item.slug} key={item.slug}
                className="group min-w-0 overflow-hidden rounded-2xl border border-[#eac671]/25 bg-[#0d2037] transition hover:-translate-y-1 hover:border-[#eac671]/70">
                <div className="relative h-44 overflow-hidden">
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#f0d38d]">{item.category}</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f0d38d]">Read Guide <ArrowRight size={16} /></p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
