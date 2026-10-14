import Link from "next/link";
import { ArrowRight, Compass, ShieldCheck } from "lucide-react";

// No active programme is implied. These are authentic first-party discovery
// entry points until an individually authorised affiliate deep link exists.
const pathways = [
  { label: "Travel & Hotels", description: "Discover real hotel and travel options.", href: "/hotels" },
  { label: "Tours & Experiences", description: "Browse available tours and activities.", href: "/tours" },
  { label: "Travel Protection", description: "Learn about coverage and provider terms.", href: "/insurance" },
];
export default function AffiliateDeals({city}:{city?:string}) {
 return <section className="border-y border-[var(--border)] bg-[var(--bg)] py-14 text-[var(--text)]">
  <div className="mx-auto max-w-7xl px-5"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--gold)]"><Compass size={17}/> Travel discovery</p>
   <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Explore travel options{city?" in "+city:""}</h2>
   <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">Explore genuine GTH PRO categories. Booking links and third-party offers are shown only when available from an authorised provider.</p>
   <div className="mt-7 grid gap-4 md:grid-cols-3">{pathways.map(item=><Link href={item.href} key={item.href} className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 hover:border-[var(--gold)]"><h3 className="text-lg font-semibold">{item.label}</h3><p className="mt-3 flex-1 text-sm text-[var(--text-soft)]">{item.description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)]">Explore <ArrowRight size={15}/></span></Link>)}</div>
   <p className="mt-6 flex items-center gap-2 text-xs text-[var(--text-soft)]"><ShieldCheck size={16}/> Some external links may earn commissions. <Link href="/affiliate-disclosure" className="underline">Disclosure</Link></p>
  </div></section>
}