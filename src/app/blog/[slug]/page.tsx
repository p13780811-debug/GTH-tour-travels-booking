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

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="relative isolate overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 -z-10">
          <Image src={blog.image} alt="" fill sizes="100vw" priority className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-[var(--bg)]/80" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-24">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold underline">
            <ArrowLeft size={16} aria-hidden="true" /> All travel guides
          </Link>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
            GTH PRO Travel Guides • {blog.category}
          </p>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight md:text-6xl">{blog.title}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--text-soft)] md:text-lg">{blog.description}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 md:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article aria-label={blog.title} className="gth-glass min-w-0 rounded-2xl border border-[var(--border)] p-5 md:p-10">
          <div className="prose prose-base max-w-none text-[var(--text)] prose-headings:text-[var(--text)] prose-p:text-[var(--text-soft)] prose-li:text-[var(--text-soft)] prose-strong:text-[var(--text)] prose-a:gold-text prose-a:underline dark:prose-invert">
            <ReactMarkdown
              components={{
                a: ({ href, children }) =>
                  href?.startsWith("/") && !href.startsWith("//")
                    ? <Link href={href} className="gold-text underline">{children}</Link>
                    : <span>{children}</span>,
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </div>
          <div className="mt-10 rounded-xl border border-[var(--border)] p-5 text-sm leading-6 text-[var(--text-soft)]">
            <p className="flex items-center gap-2 font-semibold text-[var(--text)]"><ShieldCheck size={18} /> Important information</p>
            <p className="mt-2">
              Travel prices, availability, entry rules, cancellation conditions and safety guidance can change.
              Verify current details with the relevant official authority, airline or booking provider.
            </p>
          </div>
        </article>
        <aside className="space-y-5 self-start lg:sticky lg:top-24">
          <div className="gth-glass rounded-2xl border border-[var(--border)] p-5">
            <h2 className="flex items-center gap-2 font-semibold"><BookOpen size={18} /> Keep researching</h2>
            <nav aria-label="Related travel services" className="mt-4 space-y-4 text-sm">
              <Link href="/flights" className="flex items-center gap-3 underline"><Plane size={16} /> Compare flight fares</Link>
              <Link href="/hotels" className="flex items-center gap-3 underline"><Hotel size={16} /> Explore hotel listings</Link>
              <Link href="/activities" className="flex items-center gap-3 underline"><Compass size={16} /> Browse activities</Link>
              <Link href="/destinations" className="flex items-center gap-3 underline"><Compass size={16} /> Discover destinations</Link>
            </nav>
          </div>
          <div className="gth-glass rounded-2xl border border-[var(--border)] p-5 text-xs leading-6 text-[var(--text-soft)]">
            <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">About these guides</h2>
            Practical editorial checklists prepared for travel planning. We do not promise real-time updates,
            independent verification of any supplier, or guaranteed savings.
          </div>
        </aside>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-14 md:px-6">
        <h2 className="text-2xl font-bold">More travel guides</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {more.map((item) => (
            <Link key={item.slug} href={`/blog/${item.slug}`}
              className="gth-glass flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-5">
              <span className="text-xs text-[var(--text-soft)]">{item.category}</span>
              <span className="font-semibold">{item.title}</span>
              <span className="mt-auto flex items-center gap-2 text-sm">Read guide <ArrowRight size={16} /></span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
