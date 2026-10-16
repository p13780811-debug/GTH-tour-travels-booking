import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,Camera,ShieldCheck,BadgeCheck} from "lucide-react";
import HotelPartnerForm from "@/components/hotel/HotelPartnerForm";

export const metadata:Metadata={
 title:"List Your Hotel for Review | GTH PRO Hotel Partners",
 description:"Hotel owners can submit genuine accommodation details and original photos for a free, administrator-reviewed listing on GTH PRO.",
 alternates:{canonical:"/hotels/list-your-property"},
 robots:{index:true,follow:true},
};
export default function ListYourHotel(){
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <section className="border-b border-[var(--border)] bg-[var(--card)]">
   <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
    <Link href="/hotels" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--text-soft)]">
     <ArrowLeft size={16}/> Browse hotels
    </Link>
    <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Hotel partner inventory</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">List your hotel on GTH PRO</h1>
    <p className="mt-5 max-w-3xl text-sm leading-8 text-[var(--text-soft)] md:text-base">
     Submit your property details and original hotel photographs directly. No Google Cloud billing, setup fee or third-party scraping required.
     Your hotel is not publicly listed until the business and photo permissions have been reviewed.
    </p>
    <div className="mt-7 grid gap-3 sm:grid-cols-3">
     {[
      {Icon:BadgeCheck,title:"Owner controlled",text:"Your hotel details from you"},
      {Icon:Camera,title:"Actual hotel photos",text:"Owner authorised and reviewed"},
      {Icon:ShieldCheck,title:"Approval before publication",text:"No fabricated rates or inventory"},
     ].map(({Icon,title,text})=><div key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <Icon size={21} className="text-[var(--gold)]"/><p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--text-soft)]">{text}</p>
     </div>)}
    </div>
   </div>
  </section>
  <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
   <HotelPartnerForm/>
  </section>
 </main>;
}
