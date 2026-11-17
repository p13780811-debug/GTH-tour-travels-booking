import Link from "next/link";
import { ArrowUpRight, BedDouble, CarFront, Compass, Plane, Ship, Ticket } from "lucide-react";
import { destinationFlightHref } from "@/lib/destinations/ecosystem";

/**
 * Commerce navigation never queries Supabase, requires a registry record, or
 * constructs a supplier product/room ID. Each existing booking page owns its
 * supplier-validated destination selection and final checkout handoff.
 */
export function marketBookingHandoffs(city: string, countryCode: string) {
  const destination = city.normalize("NFKC").trim().slice(0,80);
  const validCity = /^[\p{L}\p{M}\p{N} .'-]{2,80}$/u.test(destination) ? destination : "";
  const validCountry = /^[A-Z]{2}$/.test(countryCode) ? countryCode : "";
  const params = new URLSearchParams({view:"booking"});
  if (validCity) params.set("city",validCity);
  if (validCountry) params.set("country",validCountry);
  return [
    { id:"hotel", label:"Search & Book Stays", href:"/hotels?"+params.toString(), Icon:BedDouble, note:"Live availability, dates and guest selection in booking flow" },
    { id:"flight", label:"Search Flights", href:validCity?destinationFlightHref(validCity):"/flights", Icon:Plane, note:"Flight routes and fares with the connected booking engine" },
    { id:"tour", label:"Book Tours & Activities", href:"/tours"+(validCity?"?"+new URLSearchParams({city:validCity}).toString():""), Icon:Compass, note:"Explore and select actual supplier-operated experiences" },
    { id:"transfer", label:"Airport Transfers", href:"/transfers", Icon:CarFront, note:"Enter exact pickup details and confirm with transport provider" },
    { id:"ticket", label:"Stadium & Event Tickets", href:"/tickets"+(validCity?"?"+new URLSearchParams({q:validCity}).toString():""), Icon:Ticket, note:"Find event-specific ticket sources; check date and admission" },
    { id:"cruise", label:"Cruises & River Trips", href:"/cruises", Icon:Ship, note:"Search live partner offers and verify exact itinerary" },
  ] as const;
}
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
      {links.map(({id,label,href,Icon,note})=><Link key={id} href={href} prefetch={false}
        className="group flex min-w-0 flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 hover:border-[var(--gold)]">
        <Icon size={22} className="text-[var(--gold)]" aria-hidden="true"/>
        <span className="inline-flex items-center gap-2 font-semibold">{label}<ArrowUpRight size={15}/></span>
        <span className="text-xs leading-5 text-[var(--text-soft)]">{note}</span>
      </Link>)}
    </div>
  </section>;
}