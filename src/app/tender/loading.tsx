import Link from "next/link";
import { FileSearch, ShieldCheck } from "lucide-react";

/** Streaming feedback while public tender source and eligibility filters resolve. */
export default function TenderLoading() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Tender intelligence</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-4xl">Find verified public tenders</h1>
        <p role="status" aria-live="polite" className="mt-4 flex items-center gap-2 text-sm text-[var(--text-soft)]">
          <FileSearch size={17} aria-hidden="true" /> Checking available notices and source-backed tender details…
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--border)]" />
              <div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-[var(--border)]" />
              <div className="mt-4 h-3 w-5/6 animate-pulse rounded bg-[var(--border)]" />
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
          <ShieldCheck size={16} aria-hidden="true" /> Tender notices must be verified with their original issuing authorities before applying.
        </p>
        <Link href="/tender/assistant" className="gth-btn mt-5 inline-flex items-center justify-center">
          Learn how to prepare a tender
        </Link>
      </div>
    </main>
  );
}
