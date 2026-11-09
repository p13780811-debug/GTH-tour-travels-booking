"use client";
import {useEffect,useState} from "react";
import type {SupplierProduct} from "@/lib/tours/supplier-products";
import ConnectedExperienceProductCard from "./ConnectedExperienceProductCard";
import styles from "./ConnectedTravelWorkspace.module.css";
type Selection={items:SupplierProduct[];available:boolean};
const cache=new Map<string,{until:number;read:Promise<Selection>}>();
function catalogue(city:string):Promise<Selection>{
 const key=city.normalize("NFKC").trim().toLocaleLowerCase(),existing=cache.get(key);
 if(existing&&existing.until>Date.now())return existing.read;
 if(cache.size>=64)cache.delete(cache.keys().next().value!);
 const entry={until:Date.now()+86400000,read:Promise.resolve<Selection>({items:[],available:false})};
 entry.read=fetch("/api/travel/experiences"+(key?"?"+new URLSearchParams({city:key}):"")).then(async response=>{
  const data=await response.json();if(!response.ok||!Array.isArray(data.items)||typeof data.available!=="boolean")throw Error();
  if(!data.available)entry.until=Date.now()+120000;
  return {items:data.items.slice(0,6),available:data.available};
 }).catch(()=>{entry.until=Date.now()+120000;return {items:[],available:false};});
 cache.set(key,entry);return entry.read;
}
export default function ConnectedExperienceGallery({city,enabled}:{city:string;enabled:boolean}){
 const [data,setData]=useState<{key:string;selection:Selection}|null>(null),key=city.normalize("NFKC").trim().toLocaleLowerCase();
 useEffect(()=>{let active=true;if(enabled)void catalogue(key).then(selection=>{if(active)setData({key,selection});});return ()=>{active=false;};},[key,enabled]);
 if(!data||data.key!==key)return <p role="status" className={styles.loading}>Finding tickets and experiences for your next adventure…</p>;
 if(!data.selection.items.length)return <p className={styles.caption}>Explore the destination collections below, or open all experiences for more options. Current ticket prices and availability are confirmed when booking.</p>;
 return <section className={styles.productSection} aria-label="Experience product selection"><h3>{city?"Tickets & experiences in "+city:"Discover your next experience"}</h3><div className={styles.productGrid}>{data.selection.items.map(product=><ConnectedExperienceProductCard key={product.id} product={product}/>)}</div><p className={styles.caption}>Supplier-listed products and prices in USD. Check your chosen date, inclusions and final total before booking.</p></section>;
}
