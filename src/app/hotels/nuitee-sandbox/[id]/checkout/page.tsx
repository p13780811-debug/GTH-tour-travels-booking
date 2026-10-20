import {notFound} from "next/navigation";
import Link from "next/link";
import {getSandboxHotel} from "@/lib/travel/nuitee-sandbox";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const metadata={title:"Hotel stay selection · GTH PRO Sandbox",robots:{index:false,follow:false}};
export default async function Checkout({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(process.env.VERCEL_ENV!=="preview" || process.env.GTH_NUITEE_MODE!=="sandbox" ||
 process.env.GTH_NUITEE_SANDBOX_ENABLED!=="true"||!/^[A-Za-z0-9_-]{1,100}$/.test(id))notFound();
 let hotel:Awaited<ReturnType<typeof getSandboxHotel>>=null;
 try{hotel=await getSandboxHotel(id);}catch{notFound();}
 if(!hotel)notFound();
 return <main className="min-h-screen bg-[var(--bg)] p-5 text-[var(--text)] md:p-10"><section className="gth-glass mx-auto max-w-3xl space-y-6 rounded-2xl border border-[var(--border)] p-6">
 <Link href={"/hotels/nuitee-sandbox/"+encodeURIComponent(id)} className="text-sm underline">← Back to hotel details</Link>
 <p className="text-xs font-semibold text-[var(--text-soft)]">SANDBOX ONLY · NO PAYMENT</p>
 <h1 className="text-2xl font-bold">Choose your stay</h1><h2 className="text-lg font-semibold">{hotel.name}</h2><p className="text-sm text-[var(--text-soft)]">{hotel.address||hotel.city}</p>
 <div className="rounded-xl border border-[var(--border)] p-5"><h3 className="font-semibold">Reservation not available yet</h3><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">The hotel detail page contains supplier metadata, not a confirmed date-specific offer. A valid room rate, cancellation policy, final taxes and a successful prebook must be selected before an actual checkout can be offered. This sandbox page never charges a customer or creates a real reservation.</p></div>
 <div className="flex flex-wrap gap-3"><a className="gth-btn-gold inline-flex rounded-xl px-5 py-3" href={"https://gthproglobal.nuitee.link/hotels/"+encodeURIComponent(id)} target="_blank" rel="noopener noreferrer nofollow">Open matching hotel on GTH PRO White Label ↗</a><Link className="rounded-xl border border-[var(--border)] px-5 py-3" href={"/hotels/nuitee-sandbox/"+encodeURIComponent(id)}>Review hotel and rooms</Link></div><p className="text-xs text-[var(--text-soft)]">The hotel identity is retained in the partner URL. Sandbox checkout is not a confirmed booking; verify the hotel name on the partner page.</p>
 </section></main>;
}
