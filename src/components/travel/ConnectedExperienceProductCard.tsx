"use client";
import {useState} from "react";
import {ArrowUpRight,MapPin} from "lucide-react";
import type {SupplierProduct} from "@/lib/tours/supplier-products";
import styles from "./ConnectedTravelWorkspace.module.css";
export default function ConnectedExperienceProductCard({product}:{product:SupplierProduct}){
 const [failed,setFailed]=useState(false);if(failed)return null;
 const price=product.price===null?null:new Intl.NumberFormat("en",{style:"currency",currency:product.currency,maximumFractionDigits:2}).format(product.price);
 return <article className={styles.collectionCard} data-experience-product={product.id}>
  <a href={product.href} target="_blank" rel="noopener noreferrer sponsored" className={styles.collectionImage} aria-label={"View "+product.title}><img src={product.image} alt={product.title} width={640} height={480} loading="lazy" decoding="async" onError={()=>setFailed(true)} className={styles.cover+" h-full w-full"}/><span>{product.admissionOnly?"Admission ticket":"Ticket & audio experience"}</span></a>
  <div className={styles.collectionBody}><p><MapPin size={13} aria-hidden="true"/>{product.city.name}, {product.city.country}</p><h4>{product.title}</h4><p>Choose your visit date and review what’s included before booking.</p><div className={styles.productPrice}><div>{price?<><strong>{price}</strong><small>USD · supplier-listed price</small></>:<strong>Check current price</strong>}</div><a href={product.href} target="_blank" rel="noopener noreferrer sponsored">View experience <ArrowUpRight size={15} aria-hidden="true"/></a></div></div>
 </article>;
}
