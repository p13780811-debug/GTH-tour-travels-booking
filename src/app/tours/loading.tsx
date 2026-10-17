import Link from "next/link";
import { Compass, ShieldCheck } from "lucide-react";

/** Route-level streamed fallback; never invent tour inventory, rates or availability. */
export default function ToursLoading() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Global experiences</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-4xl">Explore tours and activities</h1>
        <p role="status" aria-live="polite" className="mt-4 flex items-center gap-2 text-sm text-[var(--text-soft)]">
          <Compass size={17} aria-hidden="true" /> Preparing available experiences and source-backed listings…
        </p>
        <div aria-hidden="true" className="mt-8 flex gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-48 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] sm:w-56">
              <div className="h-28 animate-pulse bg-[var(--bg)]" />
              <div className="space-y-3 p-4"><div className="h-3 w-4/5 animate-pulse rounded bg-[var(--border)]"/><div className="h-3 w-1/2 animate-pulse rounded bg-[var(--border)]"/></div>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
          <ShieldCheck size={16} aria-hidden="true" /> Dates, prices and availability are confirmed by the booking provider.
        </p>
        <Link href="/travel" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
          Explore other travel services
        </Link>
      </div>
    </main>
  );
}
