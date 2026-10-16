import Link from "next/link";
import {
  ArrowUpRight, BriefcaseMedical, BusFront, CarFront, CircleParking,
  Compass, Hotel, Luggage, MapPinned, Plane, ShieldCheck, Smartphone,
  Ticket, TrainFront, Users, Wifi,
} from "lucide-react";

// Only publisher-supplied links are marked "partner". Other provider links
// remain clearly labeled independent; do not imply affiliate attribution.
const stages = [
  {
    id: "before-flight",
    eyebrow: "Before departure",
    title: "Prepare for your flight",
    services: [
      { name: "Flight search", detail: "Find your flight and check the booking provider's final fare.", href: "/flights", Icon: Plane, kind: "internal" },
      { name: "AirHelp compensation", detail: "Review whether eligible flight delays or cancellations qualify for AirHelp claims.", href: "https://airhelp.tpo.lv/W9baN8JY", Icon: ShieldCheck, kind: "partner" },
      { name: "Compensair claims", detail: "Explore flight disruption compensation options and provider eligibility requirements.", href: "https://compensair.tpo.lv/s1kibgeh", Icon: ShieldCheck, kind: "partner" },
      { name: "Travel insurance", detail: "Review policy exclusions, coverage and insurer terms before choosing a plan.", href: "/insurance", Icon: BriefcaseMedical, kind: "internal" },
      { name: "Airport lounges", detail: "Find lounge access options; membership and entry restrictions apply.", href: "https://www.prioritypass.com/en-GB/airport-lounges", Icon: Users, kind: "provider" },
      { name: "Yesim travel eSIM", detail: "Check destination data coverage, eSIM support and plan terms through the Yesim affiliate link.", href: "https://yesim.tpo.lv/yZBVdtqT", Icon: Wifi, kind: "partner" },
    ],
  },
  {
    id: "at-airport",
    eyebrow: "At the airport",
    title: "Transfers and terminal essentials",
    services: [
      { name: "Kiwitaxi & intui.travel", detail: "Open the embedded Travelpayouts airport transfer and pickup widgets.", href: "#transfer-provider-heading", Icon: CarFront, kind: "internal" },
      { name: "Welcome Pickups", detail: "Check pickup service and destination coverage with Welcome Pickups.", href: "https://tpo.lv/GFuzmgYk", Icon: MapPinned, kind: "partner" },
      { name: "GetTransfer.com", detail: "Explore third-party transfers and compare supplier service conditions.", href: "https://gettransfer.tpo.lv/jpv6nsqO", Icon: CarFront, kind: "partner" },
      { name: "Car rentals (QEEQ & Localrent)", detail: "Browse dedicated GTH PRO car-hire widgets; compare deposits and licence requirements.", href: "/cars", Icon: CarFront, kind: "internal" },
      { name: "Airport parking", detail: "Check available parking at your departure airport.", href: "https://www.parkvia.com/en", Icon: CircleParking, kind: "provider" },
      { name: "Radical Storage", detail: "Find luggage-storage locations and review booking terms through the supplied affiliate link.", href: "https://radicalstorage.tpo.lv/iDuI1UD0", Icon: Luggage, kind: "partner" },
    ],
  },
  {
    id: "after-landing",
    eyebrow: "After landing",
    title: "Explore your destination",
    services: [
      { name: "Hotels", detail: "Discover accommodation and verify rooms and prices with providers.", href: "/hotels", Icon: Hotel, kind: "internal" },
      { name: "Tours", detail: "Explore destination tours and operator booking conditions.", href: "/tours", Icon: Ticket, kind: "internal" },
      { name: "Activities", detail: "Find local experiences and attractions for your destination.", href: "/activities", Icon: Compass, kind: "internal" },
      { name: "Destinations", detail: "Explore destination guides and travel planning inspiration.", href: "/destinations", Icon: MapPinned, kind: "internal" },
      { name: "Bus connections", detail: "Continue to official or external bus transport providers.", href: "/bus", Icon: BusFront, kind: "internal" },
      { name: "Train connections", detail: "Plan onward rail travel with official railway information.", href: "/train", Icon: TrainFront, kind: "internal" },
    ],
  },
] as const;

export default function AirportJourneyServices() {
  return (
    <section aria-labelledby="airport-services-heading" className="mb-10 min-w-0">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">Airport & onward travel services</p>
        <h2 id="airport-services-heading" className="mt-2 text-2xl font-bold sm:text-3xl">Your journey, from flight to destination</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
          Find useful travel services in one place. Embedded search tools and partner links are identified separately
          from independent provider websites. GTH PRO does not guarantee service coverage at every airport.
        </p>
      </div>

      <nav aria-label="Airport service categories" className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stages.map((stage) => (
          <a key={stage.id} href={"#" + stage.id}
            className="gth-glass inline-flex min-h-11 shrink-0 items-center rounded-full border border-[var(--border)] px-4 text-xs font-semibold">
            {stage.title}
          </a>
        ))}
      </nav>

      {stages.map((stage) => (
        <section key={stage.id} id={stage.id} aria-labelledby={stage.id + "-heading"} className="mb-8 scroll-mt-24">
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">{stage.eyebrow}</p>
          <h3 id={stage.id + "-heading"} className="mt-1 text-xl font-bold">{stage.title}</h3>
          <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stage.services.map((service) => {
              const Icon = service.Icon;
              const contents = (
                <>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-2 text-sm font-bold">
                    {service.name}
                    <ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-[var(--text-soft)]">{service.detail}</span>
                  <span className="mt-auto pt-4 text-[11px] font-medium text-[var(--text-soft)]">
                    {service.kind === "partner" ? "Existing GTH PRO partner link"
                      : service.kind === "provider" ? "Independent provider website"
                        : "GTH PRO service"}
                  </span>
                </>
              );
              const classes = "gth-glass flex w-[min(78vw,240px)] min-w-0 shrink-0 snap-start flex-col rounded-2xl border border-[var(--border)] p-4 transition-transform hover:-translate-y-0.5 sm:w-[240px]";
              return service.kind === "internal" ? (
                <Link key={service.name} href={service.href} className={classes}>{contents}</Link>
              ) : (
                <a key={service.name} href={service.href} target="_blank"
                  rel={service.kind === "partner" ? "noopener noreferrer sponsored" : "noopener noreferrer"}
                  className={classes}>{contents}</a>
              );
            })}
          </div>
        </section>
      ))}

      <p className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)]">
        <Smartphone size={18} className="mt-1 shrink-0" aria-hidden="true" />
        Booking, airport eligibility, travel documents, refunds and customer support are provided by the selected supplier.
        Independent provider links above are not represented as approved Travelpayouts affiliate campaigns.
      </p>
    </section>
  );
}
