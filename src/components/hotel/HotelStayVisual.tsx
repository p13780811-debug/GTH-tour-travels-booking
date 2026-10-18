"use client";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
/** Never look up general destination stock images as a substitute for a hotel photo. */
export default function HotelStayVisual({name}:{name:string;location:string}){
 return <HotelPropertyImage src={null} name={name} variant="detail"
  className="h-64 w-full object-cover md:h-96"
  placeholderClassName="flex h-64 w-full flex-col items-center justify-center gap-3 bg-[var(--bg)] text-[var(--text-soft)] md:h-96"/>;
}
