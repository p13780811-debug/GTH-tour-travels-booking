"use client";
import {useState} from "react";
import {ArrowUpRight} from "lucide-react";
import type {SupplierProduct} from "@/lib/tours/supplier-products";
/** A missing supplier photo removes the card instead of substituting stock imagery. */
export default function SupplierTourCard({product}:{product:SupplierProduct}){
 const [failedImage,setFailedImage]=useState<string|null>(null);if(failedImage===product.image)return null;
 let price="Price on WeGoTrip";if(product.price!==null)try{price=new Intl.NumberFormat("en-IN",{style:"currency",currency:product.currency,maximumFractionDigits:2}).format(product.price);}catch{/* Provider remains the price authority. */}
 return <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
  <a href={product.href} target="_blank" rel="noopener noreferrer sponsored" className="relative block aspect-[16/10] overflow-hidden" aria-label={product.title+" on WeGoTrip"}>
   <img src={product.image} alt={product.title} width={640} height={400} loading="lazy" decoding="async" onError={()=>setFailedImage(product.image)} className="h-full w-full object-cover"/>
  </a>
  <div className="flex min-w-0 flex-1 flex-col p-4">
   <p className="text-xs text-[var(--text-soft)]">{product.city.name}{product.city.country?", "+product.city.country:""}</p>
   <h3 className="mt-2 text-sm font-bold leading-5">{product.title}</h3>
   <p className="mt-2 text-xs text-[var(--text-soft)]">{product.kind==="audio-tour"?"Self-guided audio tour":"Ticket / audio experience"} · WeGoTrip</p>
   <div className="mt-auto pt-4"><p className="break-words text-base font-bold">{price}</p><p className="mt-1 text-[11px] leading-5 text-[var(--text-soft)]">Supplier-listed price · confirm date and total</p>
    <a href={product.href} target="_blank" rel="noopener noreferrer sponsored" className="gth-btn-gold mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 px-3 text-xs font-semibold">View on WeGoTrip<ArrowUpRight size={15} aria-hidden="true"/></a>
   </div>
  </div>
 </article>;
}
