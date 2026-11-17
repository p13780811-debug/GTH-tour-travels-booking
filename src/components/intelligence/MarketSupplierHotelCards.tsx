"use client";
import {useState} from "react";
import NuiteeHotelsListWidget from "@/components/hotel/NuiteeHotelsListWidget";

/** Only the two source-reviewed supplier Place IDs already used by GTH PRO.
 * No inferred geocodes, map IDs, OSM IDs or synthetic hotel inventory.
 * The supplier SDK itself owns the actual hotel product cards and handoffs.
 */
const REVIEWED_CITY_IDS={
  "IN:Mumbai":{placeId:"ChIJwe1EZjDG5zsRaYxkjY_tpF0",label:"Mumbai"},
  "GB:London":{placeId:"ChIJdd4hrwug2EcRmSrV3Vo6llI",label:"London"},
} as const;

export default function MarketSupplierHotelCards({city,countryCode}:{city:string;countryCode:string}){
 const key=(countryCode+":"+city) as keyof typeof REVIEWED_CITY_IDS;
 const config=REVIEWED_CITY_IDS[key];
 const [visible,setVisible]=useState(false);
 if(!config)return null;
 return <section aria-labelledby="gth-market-supplier-offers" className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
  <h3 id="gth-market-supplier-offers" className="font-semibold">GTH Worldwide Stays · {config.label}</h3>
  <p className="mt-2 text-sm text-[var(--text-soft)]">
   See hotel products from our existing booking integration. These are separate from the OSM directory;
   select exact hotel, travel dates and room before payment. No availability or price is assumed here.
  </p>
  {!visible?<button type="button" className="gth-btn gth-btn-gold mt-4 min-h-11" onClick={()=>setVisible(true)}
    aria-expanded={false} aria-controls="gth-market-bookable-hotels">
    Load connected hotel offers
  </button>:<div id="gth-market-bookable-hotels" className="mt-4">
    <NuiteeHotelsListWidget id={"gth-market-connected-"+countryCode.toLowerCase()+"-"+city.toLowerCase().replaceAll(" ","-")}
      placeId={config.placeId} placeLabel={config.label} rows={1} currency={countryCode==="GB"?"GBP":"INR"}/>
  </div>}
 </section>;
}
