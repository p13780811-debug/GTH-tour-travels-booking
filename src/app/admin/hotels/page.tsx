import type {Metadata} from "next";
import {ShieldCheck} from "lucide-react";
import HotelReviewDashboard from "@/components/hotel/HotelReviewDashboard";
export const metadata:Metadata={
 title:"Hotel Partner Review | GTH PRO Admin",
 robots:{index:false,follow:false},
};
export default function AdminHotels(){
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
   <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">
    <ShieldCheck size={16}/> Restricted GTH PRO Hotel Administration
   </p>
   <h1 className="mt-4 text-3xl font-semibold">Hotel partner review</h1>
   <p className="mt-3 mb-8 text-sm leading-7 text-[var(--text-soft)]">Private submissions and photos. Every public listing requires administrator verification of the hotel, owner authority and image publication rights.</p>
   <HotelReviewDashboard/>
  </div>
 </main>;
}
