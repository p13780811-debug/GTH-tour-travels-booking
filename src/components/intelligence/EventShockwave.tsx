import {resolveEventTarget,readEventStays} from "@/lib/intelligence/eventShockwave";
import type {IntelligenceTarget} from "@/lib/intelligence/contracts";
import IntelligenceLeadForm from "./IntelligenceLeadForm";
export default async function EventShockwave({target}:{target:IntelligenceTarget}){
 const venue=await resolveEventTarget(target).catch(()=>null);if(!venue)return null;
 const hotels=await readEventStays(venue);
 return <section aria-label="VIP hospitality and group charter desk" className="gth-glass mt-6 rounded-2xl border border-[var(--gold)] p-5 sm:p-7">
  <p className="gth-badge-gold text-xs font-semibold">EVENT-SHOCKWAVE · Private group enquiries</p>
  <h2 className="mt-3 text-2xl font-semibold">{target.kind==="stadium"?"Match-Day ":""}VIP Hospitality &amp; Group Charter Desk</h2>
  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Plan corporate hospitality, group ground transport and hotel blocks around {venue.name}. We collect requests for supplier review; access to corporate boxes, vehicles and rooms requires a separate confirmed quotation.</p>
  <h3 className="mt-5 font-semibold">City-Level Stay Options{venue.city?" · "+venue.city:""}</h3>
  {hotels.length?<ul className="mt-3 grid gap-3 sm:grid-cols-2">{hotels.map(h=><li key={h.id} className="rounded-xl border border-[var(--border)] p-3 text-sm"><strong>{h.name}</strong><p className="mt-2 text-xs">Recorded public hotel · {h.city}. No verified distance or live room availability.</p></li>)}</ul>:<p className="mt-2 text-sm text-[var(--text-soft)]">No eligible public hotel records match the recorded city and country. Use the booking search to check current stays.</p>}
  <a href={venue.bookingUrl} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn gth-btn-gold mt-4 inline-flex min-h-11 items-center px-4">Check hotel dates &amp; availability</a>
  <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">City-level suggestions are not verified nearby stays. The white-label partner confirms the actual hotel, price and availability. Affiliate commission may apply.</p>
  <details className="mt-5"><summary className="cursor-pointer font-semibold">Request corporate hospitality, ground charter or hotel blocks</summary><IntelligenceLeadForm kind="hospitality" target={target}/></details>
 </section>;
}
