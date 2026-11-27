import {LUXURY_VISUALS} from "@/lib/destinations/visual-media";
import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import TravelPackagePlanner from "@/components/travel/TravelPackagePlanner";
export const metadata:Metadata={title:"Build Your Travel Package | GTH PRO",description:"Create an image-led travel itinerary with hotels, return flights, experiences and transfers. Compare independently booked services and plan your budget.",alternates:{canonical:"/travel/packages"},openGraph:{images:["/images/cities/dubai.jpg"]}};
export default function PackagesPage(){return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
 <section className="mx-auto grid max-w-7xl gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-2 lg:items-center"><div><Link href="/travel" className="text-sm underline">Back to GTH PRO Travel</Link><p className="mt-5 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Travel packages</p><h1 className="mt-3 text-4xl font-bold md:text-5xl">Your holiday, beautifully connected.</h1><p className="mt-4 text-base leading-7 text-[var(--text-soft)]">Combine flights, hotels, experiences and airport pickups in one personal travel plan. Compare each service and book independently with existing booking providers.</p><a href="#package-builder" className="gth-btn-gold mt-5 inline-flex min-h-12 items-center px-5">Start planning</a></div><div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-[var(--border)]"><Image src={LUXURY_VISUALS.packages} alt="" fill sizes="(max-width:1024px) 100vw,50vw" className="object-cover" priority unoptimized/><span className="absolute bottom-2 right-2 rounded bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text)]">AI illustrative visual</span></div></section>
 <TravelPackagePlanner/>
 </main>;}
