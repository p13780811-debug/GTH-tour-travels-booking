import Link from "next/link";
import { ArrowRight, BookOpen, BusFront, TrainFront } from "lucide-react";

export type GroundTransportMode = "bus" | "train";

type Corridor = { from: string; to: string; context: string; guide: string };
const corridors: Record<GroundTransportMode, readonly Corridor[]> = {
  bus: [
    { from: "Mumbai", to: "Pune", context: "Compare terminals, boarding stops and luggage rules", guide: "mumbai-pune-bus-planning" },
    { from: "Bengaluru", to: "Mysuru", context: "Check operator pickup points and arrival location", guide: "bengaluru-mysuru-road-rail-guide" },
    { from: "Delhi", to: "Jaipur", context: "Compare day versus overnight travel options", guide: "delhi-jaipur-train-versus-bus" },
    { from: "Kolkata", to: "Digha", context: "Plan the coast-bound trip and final local transfer", guide: "kolkata-digha-travel-options" },
    { from: "Chennai", to: "Puducherry", context: "Review departure terminals and trip duration", guide: "choosing-bus-and-train-tickets" },
    { from: "Hyderabad", to: "Vijayawada", context: "Check actual drop-off points with the operator", guide: "choosing-bus-and-train-tickets" },
  ],
  train: [
    { from: "Mumbai", to: "Pune", context: "Check stations, class, quotas and boarding point", guide: "mumbai-pune-bus-planning" },
    { from: "Kolkata", to: "Digha", context: "Compare rail stations and the last-mile transfer", guide: "kolkata-digha-travel-options" },
    { from: "Delhi", to: "Jaipur", context: "Review official rail availability and fare classes", guide: "delhi-jaipur-train-versus-bus" },
    { from: "Bengaluru", to: "Mysuru", context: "Compare train timing with road transfer options", guide: "bengaluru-mysuru-road-rail-guide" },
    { from: "Delhi", to: "Agra", context: "Confirm the correct arrival station before booking", guide: "choosing-bus-and-train-tickets" },
    { from: "Chennai", to: "Coimbatore", context: "Check quota, train class and actual dates", guide: "choosing-bus-and-train-tickets" },
  ],
};

export default function TransportRouteDiscovery({ mode }: { mode: GroundTransportMode }) {
  const Icon = mode === "bus" ? BusFront : TrainFront;
  return (
    <section aria-label={mode === "bus" ? "Bus route research ideas" : "Train route research ideas"} className="mb-10">
      <div className="mb-5 flex items-start gap-3">
        <Icon size={25} aria-hidden="true" className="shrink-0" />
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Explore popular journey pairs</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
            Route ideas for planning, not live departures, scheduled services or confirmed fares.
            Use the booking form above to search a route once; the connected provider confirms tickets and final fares.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {corridors[mode].map((route) => (
          <article key={route.from + route.to} className="gth-glass flex flex-col rounded-2xl border border-[var(--border)] p-4">
            <p className="flex items-center gap-2 text-base font-semibold">
              <span>{route.from}</span><ArrowRight size={16} aria-hidden="true" /><span>{route.to}</span>
            </p>
            <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-soft)]">{route.context}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <Link className="gth-btn-gold inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 font-semibold"
                href="#journey-search">
                Search route <ArrowRight size={15} />
              </Link>
              <Link className="inline-flex min-h-10 items-center gap-1 font-semibold underline underline-offset-4"
                href={`/blog/${route.guide}`}>Read guide <BookOpen size={15} /></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
