"use client";
import {useEffect,useState} from "react";
import {HOTEL_CURRENCY_OPTIONS,hotelCurrency} from "@/lib/travel/hotel-currency";
type Option={code:string;name:string};
export default function HotelCurrencySelector({value,onChange}:{value:string;onChange:(value:string)=>void}){
  const [options,setOptions]=useState<Option[]>(HOTEL_CURRENCY_OPTIONS.map(item=>({...item})));
  useEffect(()=>{
    const controller=new AbortController();
    void fetch("/api/hotels/reference/currencies",{signal:controller.signal}).then(async response=>{
      if(!response.ok)return;
      const result=await response.json();
      if(!Array.isArray(result?.items))return;
      const items=result.items.filter((item:Option)=>typeof item?.code==="string"&&hotelCurrency(item.code)===item.code&&typeof item.name==="string"&&item.name.length<=80);
      if(items.length===HOTEL_CURRENCY_OPTIONS.length&&new Set(items.map((item:Option)=>item.code)).size===HOTEL_CURRENCY_OPTIONS.length)setOptions(items);
    }).catch(()=>{});
    return ()=>controller.abort();
  },[]);
  return <label className="inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-[var(--text-soft)]">Currency
    <select aria-label="Hotel display currency" value={value} onChange={event=>onChange(hotelCurrency(event.target.value))} className="min-h-11 max-w-44 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-sm text-[var(--text)]">
      {options.map(item=><option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}
    </select>
  </label>;
}
