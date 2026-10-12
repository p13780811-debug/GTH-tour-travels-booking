import Link from "next/link";
import { blogs } from "@/data/blogs";

export default function GuidesScroll({ city }: { city?: string }) {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="text-2xl font-bold md:text-3xl">
          Travel planning guides{city ? ` for your ${city} trip` : ""}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-soft)]">Practical advice to verify before booking, not invented destination-specific reviews.</p>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {blogs.slice(0, 5).map((blog) => (
            <Link key={blog.slug} href={`/blog/${blog.slug}`}
              className="gth-glass min-w-[220px] max-w-[280px] flex-shrink-0 rounded-2xl border border-[var(--border)] p-5">
              <p className="text-xs text-[var(--text-soft)]">{blog.category}</p>
              <h3 className="mt-3 font-semibold">{blog.title}</h3>
              <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--text-soft)]">{blog.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
