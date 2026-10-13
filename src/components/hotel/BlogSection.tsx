import Link from "next/link";
import { blogs } from "@/data/blogs";

export default function BlogSection({ city }: { city: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h2 className="text-xl font-bold md:text-2xl">Plan your visit to {city}</h2>
      <p className="mt-2 text-sm text-[var(--text-soft)]">
        Booking checklists and travel tips are useful wherever you decide to stay.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {blogs.filter((item) => ["Hotels", "Planning", "Safety"].includes(item.category)).slice(0, 3).map((blog) => (
          <Link key={blog.slug} href={`/blog/${blog.slug}`}
            className="gth-glass rounded-2xl border border-[var(--border)] p-5">
            <span className="text-xs text-[var(--text-soft)]">{blog.category}</span>
            <h3 className="mt-2 font-semibold">{blog.title}</h3>
            <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">{blog.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
