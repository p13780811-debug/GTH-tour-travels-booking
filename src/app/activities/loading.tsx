import TourSearchHero from "@/components/tours/TourSearchHero";
export default function ActivitiesLoading(){return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]"><TourSearchHero basePath="/activities"/><p role="status" aria-live="polite" className="mx-auto max-w-7xl px-4 py-6 text-sm text-[var(--text-soft)]">Preparing activities and ticket partners…</p></main>;}
