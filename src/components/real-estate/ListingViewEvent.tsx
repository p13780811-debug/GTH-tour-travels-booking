"use client";
import {useEffect,useRef} from 'react';
import {ESTATE_ANALYTICS_KEY} from './EstateAnalyticsConsent';
export default function ListingViewEvent({inventoryId}:{inventoryId:string}){const sent=useRef(false);useEffect(()=>{const measure=()=>{try{if(sent.current||navigator.doNotTrack==='1'||localStorage.getItem(ESTATE_ANALYTICS_KEY)!=='allow')return;sent.current=true;void fetch('/api/real-estate/listing-events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),inventory_id:inventoryId}),keepalive:true,signal:AbortSignal.timeout(8000)}).catch(()=>{});}catch{}};measure();window.addEventListener('gth-estate-consent',measure);return()=>window.removeEventListener('gth-estate-consent',measure);},[inventoryId]);return null;}
