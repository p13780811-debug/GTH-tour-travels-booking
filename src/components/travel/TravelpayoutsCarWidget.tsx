"use client";

import { useEffect, useRef, useState } from "react";
import { CarFront, ExternalLink, ShieldCheck } from "lucide-react";

// Publisher-provided public affiliate widget parameters. Never append visitor
// input to third-party script URLs or place privileged tokens in browser code.
export const CAR_WIDGET_URL = "https://tpwidg.com/content?trs=504342&shmarker=417668&locale=en&country=153&city=68511&powered_by=true&campaign_id=87&promo_id=2466";
export const QEEQ_WIDGET_URL = "https://tpwidg.com/content?trs=504342&shmarker=417668&locale=en&powered_by=true&campaign_id=172&promo_id=4850";

const suppliers = {
  qeeq: {
    label: "QEEQ",
    title: "QEEQ car-rental search",
    description: "Search for car rentals with the QEEQ affiliate widget. Availability, costs, deposit terms and geographic coverage depend on the provider.",
    script: QEEQ_WIDGET_URL,
    website: "https://www.qeeq.com/",
  },
  localrent: {
    label: "Localrent",
    title: "Localrent featured city search",
    description: "This Localrent affiliate widget includes a specific country and city preset (country=153, city=68511). It is not an all-countries inventory feed; change location inside the supplier widget if supported.",
    script: CAR_WIDGET_URL,
    website: "https://localrent.com/",
  },
} as const;

type Supplier = keyof typeof suppliers;
type Status = "loading" | "loaded" | "failed";

export default function TravelpayoutsCarWidget() {
  const [active, setActive] = useState<Supplier>("qeeq");
  const [status, setStatus] = useState<Status>("loading");
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Travelpayouts injects content beside its script. Keep this script and
    // generated markup inside the car-rental module, never the global layout.
    mount.replaceChildren();
    const script = document.createElement("script");
    script.src = suppliers[active].script;
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => setStatus("loaded");
    script.onerror = () => setStatus("failed");
    mount.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
      mount.replaceChildren();
    };
  }, [active]);

  function selectSupplier(next: Supplier) {
    if (next === active) return;
    setStatus("loading");
    setActive(next);
  }

  return (
    <section id="car-rental-offers" aria-labelledby="car-widget-heading"
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
      <p className="hidden sm:block text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Travelpayouts rental partners</p>
      <h2 id="car-widget-heading" className="mt-0 sm:mt-3 text-xl sm:text-2xl font-semibold">Compare rental-car providers</h2>


      <div role="group" aria-label="Car rental suppliers" className="mt-5 flex flex-wrap gap-2">
        {(["qeeq", "localrent"] as const).map((key) => (
          <button key={key} type="button" aria-pressed={active === key} onClick={() => selectSupplier(key)}
            className={active === key
              ? "gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
              : "inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-5 text-sm font-semibold"}>
            <CarFront size={17} aria-hidden="true" />{suppliers[key].label}
          </button>
        ))}
      </div>

      <div className="mt-5 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 sm:p-5">
        <h3 className="font-semibold">{suppliers[active].title}</h3>

        <a href={suppliers[active].website} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
          Open {suppliers[active].label} search <ExternalLink size={15} aria-hidden="true" />
        </a>
        {status === "loading" && <p role="status" className="mt-3 text-sm text-[var(--text-soft)]">Loading supplier tool…</p>}
        {status === "failed" && (
          <p role="alert" className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            This supplier tool could not load. Browser privacy settings or the partner network may block scripts.
            You can still visit the independent provider site below.
          </p>
        )}
        <div ref={mountRef} className="mt-5 min-h-24 min-w-0 max-w-full overflow-x-auto [&_iframe]:max-w-full"
          aria-label={suppliers[active].title} />
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{suppliers[active].description}</p>
        <p className="mt-2 text-xs text-[var(--text-soft)]">The website link is a direct provider link, not an affiliate-tracked handoff.</p>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
        Choose the QEEQ or Localrent partner search. Only the selected provider widget loads,
        avoiding duplicate third-party tools. Bookings, vehicle availability, payment and support remain with the supplier.
      </p>

      <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
        <ShieldCheck size={17} className="mt-1 shrink-0" aria-hidden="true" />
        Partner widgets may earn GTH PRO an affiliate commission. Always verify the correct pickup city,
        vehicle class, mileage, card deposit, insurance, final taxes and cancellation conditions with the rental provider.
      </p>
      <a href="/affiliate-disclosure" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)] underline">
        Our affiliate disclosure <ExternalLink size={14} aria-hidden="true" />
      </a>
    </section>
  );
}
