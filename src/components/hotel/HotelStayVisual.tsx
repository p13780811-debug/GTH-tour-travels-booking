"use client";
import HotelPropertyImage from "@/components/hotel/HotelPropertyImage";
import {useHotelIllustrations} from "@/lib/travel/use-hotel-illustrations";

/** Hotel detail never calls Pexels using a hotel name. The image is decorative. */
export default function HotelStayVisual({name,location}:{
  name:string;location:string;
}){
 const illustrations=useHotelIllustrations(location,true);
 return <>
  <HotelPropertyImage src={null} name={name} variant="detail"
   illustration={illustrations[0]||null}
   className="h-64 w-full object-cover md:h-96"
   placeholderClassName="flex h-64 w-full flex-col items-center justify-center gap-3 text-[var(--text-soft)] md:h-96"/>
  {illustrations.length>0&&<p className="px-3 py-2 text-xs text-[var(--text-soft)]">
   Illustrative travel image only — not a verified photo of {name}. Photos provided by{" "}
   <a href="https://www.pexels.com/" target="_blank" rel="noopener noreferrer nofollow" className="underline">Pexels</a>.
  </p>}
 </>;
}
