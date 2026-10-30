import Link from "next/link";
import { ArrowLeft, ChefHat, ExternalLink, ShieldCheck } from "lucide-react";

const THALI_APP_URL = "https://thali-treats-preview.gaminggaming93039.workers.dev/";

export default function GthKitchenPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="gth-btn inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              aria-label="Back to GTH PRO"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                <p className="truncate text-sm font-black">Thali Treats · Palava</p>
              </div>
              <p className="truncate text-xs text-[var(--text-soft)]">
                Bengali home kitchen · GTH PRO ecosystem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
            <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
            <span>Secure ordering and owner operations</span>
          </div>
        </div>
      </header>

      <section className="border-b border-[var(--border)] bg-[var(--card)]/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-black sm:text-2xl">
              Order from Thali Treats inside GTH PRO
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
              Live menu, cart, WhatsApp handoff and kitchen-backed ordering are served by the dedicated
              Thali Treats Cloudflare application while GTH PRO remains the public ecosystem entry.
            </p>
          </div>

          <a
            href={THALI_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="gth-btn inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Open full screen
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section aria-label="Thali Treats ordering application" className="bg-[var(--bg)]">
        <iframe
          src={THALI_APP_URL}
          title="Thali Treats Palava ordering application"
          className="block h-[calc(100dvh-9.5rem)] min-h-[720px] w-full border-0 bg-white"
          allow="geolocation; clipboard-write; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </section>
    </main>
  );
}
