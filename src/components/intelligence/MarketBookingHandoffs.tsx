import Link from "next/link";
import { ArrowUpRight, BedDouble, CarFront, Compass, Plane, Ship, Ticket } from "lucide-react";
import { marketBookingHandoffs } from "@/lib/intelligence/booking-paths";

const ICONS = { hotel:BedDouble,flight:Plane,tour:Compass,transfer:CarFront,ticket:Ticket,cruise:Ship } as const;

/**
 * Always-visible, RLS/DB-independent paths to the existing supplier-operated
 * booking/search services. No search, room API call or database read occurs here.
 */
export default function MarketBookingHandoffs({city,countryCode}:{city:string;countryCode:string}){
  const links=marketBookingHandoffs(city,countryCode);
  return <section aria-labelledby="decision-booking-heading" className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7" data-booking-independent-of-db="true">
    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">GTH Global Booking Engine · Always available navigation</p>
    <h2 id="decision-booking-heading" className="mt-2 text-2xl font-semibold">Book your journey — independently of directory records</h2>
    <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
      These booking handoffs do not depend on GTH PRO's local database counts. Search dates,
      guests, live supplier offers and final prices directly through each existing service.
      The connected provider confirms availability and operates checkout.
    </p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map(({id,label,href,note})=>{const Icon=ICONS[id];return <Link key={id} href={href} prefetch={false}
        className="group flex min-w-0 flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 hover:border-[var(--gold)]">
        <Icon size={22} className="text-[var(--gold)]" aria-hidden="true"/>
        <span className="inline-flex items-center gap-2 font-semibold">{label}<ArrowUpRight size={15}/></span>
        <span className="text-xs leading-5 text-[var(--text-soft)]">{note}</span>
      </Link>})}
    </div>
  </section>;
}