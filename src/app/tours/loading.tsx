import TourSearchHero from "@/components/tours/TourSearchHero";
/** Initial navigation keeps a usable search available before inventory resolves. */
export default function ToursLoading(){return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]"><TourSearchHero basePath="/tours"/><p role="status" aria-live="polite" className="mx-auto max-w-7xl px-4 py-6 text-sm text-[var(--text-soft)]">Preparing tour listings and booking partners…</p></main>;}
