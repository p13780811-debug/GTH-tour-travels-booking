import {ArrowUpRight,Plane} from "lucide-react";
import Link from "next/link";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";
/** Owner-verified shared White Label shows Stays + Flights tabs. No selected
 * flight/offer deep-link contract was supplied: use its verified shared entry. */
export default function NuiteeFlightHandoff({workspaceLink=true}:{workspaceLink?:boolean}){
 return <section aria-labelledby="nuitee-flight-option" className="my-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--text)]">
  <h2 id="nuitee-flight-option" className="flex items-center gap-2 text-lg font-semibold"><Plane size={19} aria-hidden="true"/>Stays &amp; Flights with GTH PRO</h2>
  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">Our Nuitee booking site also offers flight search. Open the site and select its Flights tab to compare routes and book with the provider.</p>
  <div className="mt-4 flex flex-wrap gap-3"><a href={HOTEL_BOOKING_ORIGIN} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">Open Nuitee Stays &amp; Flights <ArrowUpRight size={15} aria-hidden="true"/></a>
  {workspaceLink&&<Link href="/travel?travelMode=flights#travel-search" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Plan hotels, flights &amp; experiences together</Link>}</div>
 </section>;
}
