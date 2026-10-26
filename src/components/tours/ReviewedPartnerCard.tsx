"use client";
import {useState} from "react";
import {ArrowUpRight} from "lucide-react";
import type {ReviewedPartnerProduct} from "@/lib/tours/reviewed-partner-products";
const LABELS={klook:"Klook",kkday:"KKday",tiqets:"Tiqets"} as const;
/** Only vetted supplier-feed photos; a broken image removes the card, not replaced by stock. */
export default function ReviewedPartnerCard({product}:{product:ReviewedPartnerProduct}){
 const [failed,setFailed]=useState(false);if(failed)return null;
 let price="Check price on partner";
 if(product.price_numeric!==null&&product.currency)try{price=new Intl.NumberFormat("en-IN",{style:"currency",currency:product.currency,maximumFractionDigits:2}).format(product.price_numeric);}catch{/* Do not invent a price. */}
 return <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
  <a href={product.source_url} target="_blank" rel="noopener noreferrer sponsored" aria-label={product.title+" on "+LABELS[product.provider]} className="relative block aspect-[16/10] overflow-hidden">
   <img src={product.image_url} alt={product.title} width={product.image_width} height={product.image_height} loading="lazy" decoding="async" onError={()=>setFailed(true)} className="h-full w-full object-cover"/>
  </a>
  <div className="flex min-w-0 flex-1 flex-col p-4">
   <p className="text-xs text-[var(--text-soft)]">{product.city}, {product.country}</p>
   <h3 className="mt-2 text-sm font-bold leading-5">{product.title}</h3>
   <p className="mt-2 text-xs text-[var(--text-soft)]">Supplier product · {LABELS[product.provider]}</p>
   <div className="mt-auto pt-4">
    <p className="text-base font-bold">{price}</p>
    <p className="mt-1 text-[11px] leading-5 text-[var(--text-soft)]">Confirm dates, availability and final price with the provider</p>
    <a href={product.source_url} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 px-3 text-xs font-semibold">
     View exact product <ArrowUpRight size={15} aria-hidden="true"/>
    </a>
   </div>
  </div>
 </article>;
}
