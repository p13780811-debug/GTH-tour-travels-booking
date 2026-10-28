import TravelSectionNav from "@/components/travel/TravelSectionNav";
export default function Loading(){
 return <main className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
  <TravelSectionNav/>
  <div role="status" aria-live="polite" aria-busy="true" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
   <div className="max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
    <div className="mb-4 h-1 w-14 animate-pulse rounded bg-[var(--gold)]"/>
    <h1 className="text-lg font-semibold">Opening activities…</h1>
    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Loading source-backed information. Your selection is being processed.</p>
   </div>
  </div>
 </main>;
}
