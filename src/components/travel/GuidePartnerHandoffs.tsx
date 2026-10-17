import Link from "next/link";
import {ArrowUpRight,CarFront,Compass,Hotel,Plane,ShieldCheck,Ticket,Wifi} from "lucide-react";
import {findFlightPartner} from "@/lib/flights/partners";

/**
 * Booking-step handoffs for editorial travel guides. These are publisher
 * supplied, fixed partner program links from the existing flight registry.
 * They are NOT ticket inventory, product-specific deep links, price quotes
 * or booked reservations. No script or URL is built from visitor input.
 */
const featured = [
 {slug:"klook",title:"Tours & activities",description:"Browse tour and activity offers",Icon:Ticket,host:"klook.tpo.lv"},
 {slug:"wegotrip",title:"Audio & self-guided tours",description:"Compare independently operated experiences",Icon:Compass,host:"wegotrip.tpo.lv"},
 {slug:"aviasales",title:"Compare flights",description:"Search flights and choose a booking provider",Icon:Plane,host:"aviasales.tpo.lv"},
 {slug:"welcome",title:"Airport transfers",description:"Check pickup locations and service terms",Icon:CarFront,host:"tpo.lv"},
 {slug:"ekta",title:"Travel insurance",description:"Check policy eligibility, coverage and exclusions",Icon:ShieldCheck,host:"ektatraveling.tpo.lv"},
 {slug:"yesim",title:"Travel eSIM",description:"Review device support and destination coverage",Icon:Wifi,host:"yesim.tpo.lv"},
] as const;

/** Only the explicitly approved partner slug and hostname combination may open. */
function partnerTarget(slug:string,host:string):string|null{
 const program=findFlightPartner(slug);
 if(!program?.external)return null;
 try{
  const u=new URL(program.destination);
  return u.protocol==="https:"&&u.hostname===host&&!u.username&&!u.password&&!u.port
    ?u.toString():null;
 }catch{return null;}
}

export default function GuidePartnerHandoffs({city}:{city:string|null}){
 const hotelHref=city?"/hotels/results?city="+encodeURIComponent(city):"/hotels";
 const offers=featured.flatMap(item=>{
  const href=partnerTarget(item.slug,item.host);
  return href?[{...item,href}]:[];
 });
 return <section aria-labelledby="guide-booking-handoff" className="mt-12 border-t border-[var(--border)] pt-8">
  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]">Final step · Independent booking providers</p>
  <h2 id="guide-booking-handoff" className="mt-2 text-2xl font-bold">Ready to book? Choose a trusted booking path</h2>
  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
   Finish your research here, then compare real options with independent partners.
   Partner links open general supplier searches; choose your actual destination, dates,
   travellers and product with the supplier. No availability or price is guaranteed by GTH PRO.
  </p>
  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   <Link href={hotelHref} className="flex min-h-[154px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--gold)]">
    <span className="flex items-center gap-2 text-base font-bold"><Hotel size={19} aria-hidden="true"/> Search hotels</span>
    <span className="mt-2 flex-1 text-xs leading-6 text-[var(--text-soft)]">Browse destination listings; a specific property only offers booking when its actual partner link is available.</span>
    <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold">Find a stay <ArrowUpRight size={16} aria-hidden="true"/></span>
   </Link>
   {offers.map(({slug,title,description,Icon,href})=>
    <a key={slug} href={href} target="_blank" rel="noopener noreferrer sponsored"
      className="flex min-h-[154px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--gold)]"
      aria-label={title+" — open partner website in a new tab"}>
     <span className="flex items-center gap-2 text-base font-bold"><Icon size={19} aria-hidden="true"/>{title}</span>
     <span className="mt-2 flex-1 text-xs leading-6 text-[var(--text-soft)]">{description}. Final inventory, prices and checkout are the provider's responsibility.</span>
     <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold">Continue to partner <ArrowUpRight size={16} aria-hidden="true"/></span>
    </a>)}
  </div>
  <p className="mt-5 text-xs leading-6 text-[var(--text-soft)]">
   Affiliate disclosure: GTH PRO may earn a commission for eligible partner bookings.
   We do not issue tickets, hotel vouchers, transfer confirmations or insurance policies.{" "}
   <Link href="/affiliate-disclosure" className="underline">Read the full disclosure</Link>.
  </p>
 </section>;
}
