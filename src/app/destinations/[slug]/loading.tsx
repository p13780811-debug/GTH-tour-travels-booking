import TravelSectionNav from "@/components/travel/TravelSectionNav";

/** Visible before the slow server-side destination identity/tour queries finish.
 * Keeps the global footer below the screen, without injecting a fake city or
 * changing the shared mobile navigation / global design system.
 */
export default function DestinationDetailLoading(){
 return <main className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
   <TravelSectionNav/>
   <section role="status" aria-live="polite" aria-busy="true"
     className="mx-auto min-h-[80dvh] max-w-7xl px-4 py-10 sm:px-6">
     <div className="max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
       <div className="mb-5 h-2 w-24 animate-pulse rounded-full bg-[var(--gold)]"/>
       <h1 className="text-xl font-semibold">Opening destination guide…</h1>
       <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
         Loading the selected destination. Please keep this page open.
       </p>
     </div>
   </section>
 </main>;
}
