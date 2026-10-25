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
 const directory=query.directory==="1"||["q","category","country","destination","page"].some(key=>typeof query[key]==="string");
 if(directory)return <MobileAppSection params={Promise.resolve({section:"hotels"})} searchParams={Promise.resolve(query)}/>;
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(90px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6">
   <h1 className="mb-3 text-xl font-semibold">Hotels</h1>
   <Suspense fallback={<p role="status">Loading hotel search…</p>}><HotelBookingExperience searchPath="/app/hotels"/></Suspense>
   <Link href="/app/hotels?directory=1" className="my-4 inline-flex min-h-11 items-center text-sm underline">Explore hotel guides</Link>
  </div>
 </main>;
}
