import Link from "next/link";
import { ArrowUpRight, Building2, Plane } from "lucide-react";

// Discovery link only: the provider's existing embedded white-label owns fares and checkout.
const cities: Record<string, { iata: string; name: string }> = {
  mumbai: { iata: "BOM", name: "Mumbai" },
  goa: { iata: "GOI", name: "Goa" },
  paris: { iata: "CDG", name: "Paris" },
  delhi: { iata: "DEL", name: "Delhi" },
  dubai: { iata: "DXB", name: "Dubai" },
  london: { iata: "LHR", name: "London" },
};
export default function SmartSynergy({ city, context }: {city: string; context: "property" | "travel"}) {
  const key = city.trim().toLowerCase();
  const match = Object.entries(cities).find(([place]) => key === place || key.includes(place + ","));
  const destination = match?.[1];
  if (context === "property" && !destination) return null;
  return <aside aria-label="Explore another GTH PRO service" className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--text)]">
    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">One connected journey</p>
    {context === "property" ? <>
      <h2 className="mt-2 text-lg font-semibold">Planning a site visit to {destination!.name}?</h2>
      <p className="mt-2 text-sm text-[var(--text-soft)]">Explore flights in our embedded Aviasales white-label. Choose dates and route to see supplier-operated prices; no fare is promised here.</p>
      <Link href={`/flights?destination=${destination!.iata}`} className="gth-btn mt-4 inline-flex min-h-11 items-center gap-2"><Plane size={16}/> Search flights <ArrowUpRight size={15}/></Link>
    </> : <>
      <h2 className="mt-2 text-lg font-semibold">Love {city || "this destination"}? Explore longer-term living.</h2>
      <p className="mt-2 text-sm text-[var(--text-soft)]">Discover source-backed property projects and separately published inventory. Availability must be confirmed.</p>
      <Link href={`/real-estate${city ? "?" + new URLSearchParams({city: city.slice(0,80)}).toString() : ""}`} className="gth-btn mt-4 inline-flex min-h-11 items-center gap-2"><Building2 size={16}/> Explore real estate <ArrowUpRight size={15}/></Link>
    </>}
  </aside>;
}
