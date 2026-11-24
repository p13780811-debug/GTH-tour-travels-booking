"use client";

import Link from "next/link";

export default function MobilityCityError({reset}:{reset:()=>void}){
  return <main className="mx-auto max-w-3xl space-y-4 px-4 py-12">
    <h1 className="text-2xl font-bold">City guide temporarily unavailable</h1>
    <p className="text-[var(--text-soft)]">Try loading this guide again, or open Mobility to use the driver tools and browse featured cities.</p>
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={reset} className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4">Try again</button>
      <Link href="/mobility" className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4">Open Mobility</Link>
    </div>
  </main>;
}
