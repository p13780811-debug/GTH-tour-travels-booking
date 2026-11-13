import type {Metadata} from "next";
import Link from "next/link";
import {Suspense} from "react";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import HotelBookingExperience from "@/components/hotel/HotelBookingExperience";
import MobileAppSection from "../[section]/page";
export const metadata:Metadata={title:"Hotels | GTH PRO App"};
export const dynamic="force-dynamic";
type Query=Record<string,string|string[]|undefined>;
export default async function AppHotels({searchParams}:{searchParams:Promise<Query>}){
 const query=await searchParams;
 // Local hotel guides are separate from supplier rate search. Query text,
 // city and dates never implicitly switch the app into local directory mode.
 const directory=query.directory==="1";
 if(directory)return <MobileAppSection params={Promise.resolve({section:"hotels"})} searchParams={Promise.resolve(query)}/>;
 const rawCity=typeof query.city==="string"?query.city:typeof query.destination==="string"?query.destination:"";
 const bookingCity=/^[\p{L}\p{M}\s.'-]{2,80}$/u.test(rawCity.trim())?rawCity.trim():"";
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(90px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <div className="mx-auto w-full max-w-7xl pt-3">
   <h1 className="mb-3 px-4 text-xl font-semibold sm:px-6">Hotels</h1>
   {bookingCity&&<p role="status" className="mx-4 mb-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-6 text-[var(--text-soft)] sm:mx-6">
     Search <strong className="text-[var(--text)]">{bookingCity}</strong> on the Nuitee supplier search form below. Select the supplier&apos;s city suggestion and your stay dates; its White Label will then display matching live hotel options. We do not invent a Place ID or show local directory records as rooms.
   </p>}
   <Suspense fallback={<p role="status">Loading hotel search…</p>}><HotelBookingExperience searchPath="/app/hotels"/></Suspense>
   <Link href="/app/hotels?directory=1" className="mx-4 my-4 inline-flex min-h-11 items-center text-sm underline sm:mx-6">Explore separate non-bookable hotel directory</Link>
  </div>
 </main>;
}
