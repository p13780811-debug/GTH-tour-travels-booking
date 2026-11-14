"use client";

import {useMemo,useState} from "react";
import {QrCode,Copy,Download} from "lucide-react";
import {qrcodegen} from "@/lib/client/vendor/qrcodegen";
import {catalogContact,catalogHref,catalogSlugs,MAX_CATALOG_PROJECTS} from "@/lib/real-estate/broker-catalog";

const safeLabel=(text:string)=>text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
/** Render locally as printable SVG; only first-party URL is ever encoded. */
function qrSvg(url:string){
 const qr=qrcodegen.QrCode.encodeText(url,qrcodegen.QrCode.Ecc.MEDIUM);
 const size=qr.size,quiet=4,scale=8,top=62,side=48;
 const width=(size+quiet*2)*scale+side*2,height=width+top+70;
 let path="";
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(qr.getModule(x,y))
   path+=`M${(x+quiet)*scale+side},${(y+quiet)*scale+top}h${scale}v${scale}h-${scale}z`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
 <rect width="${width}" height="${height}" fill="#ffffff"/>
 <text x="${width/2}" y="43" text-anchor="middle" font-size="31" font-family="Arial,sans-serif" font-weight="bold" fill="#12243c">GTH PRO</text>
 <path d="${path}" fill="#101820"/>
 <text x="${width/2}" y="${height-37}" text-anchor="middle" font-size="17" font-family="Arial,sans-serif" fill="#12243c">Scan to view property research</text>
 <text x="${width/2}" y="${height-13}" text-anchor="middle" font-size="15" font-family="Arial,sans-serif" fill="#5b6570">${safeLabel("gthproglobal.com")}</text>
 </svg>`;
}
function saveSvg(svg:string){
 const objectUrl=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}));
 const a=document.createElement("a");a.href=objectUrl;a.download="gth-pro-property-catalog-qr.svg";
 a.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
}
export default function BrokerCatalogGenerator({initialSlugs=[]}:{initialSlugs?:string[]}){
 const [name,setName]=useState(""),[phone,setPhone]=useState("");
 const [rawSlugs,setRawSlugs]=useState(initialSlugs.join(", "));
 const [consent,setConsent]=useState(false);
 const [created,setCreated]=useState<{url:string;svg:string}|null>(null);
 const [status,setStatus]=useState("");
 const slugs=useMemo(()=>catalogSlugs(rawSlugs),[rawSlugs]);
 function generate(){
   setCreated(null);setStatus("");
   if(!consent){setStatus("Confirm that you agree to publish this name and phone number in the shared catalog link.");return;}
   if(!catalogContact(name,phone)){setStatus("Enter a name (2–60 characters) and a contact number with 10–15 digits.");return;}
   if(slugs.length<1){setStatus(`Enter 1–${MAX_CATALOG_PROJECTS} existing property slugs, separated by commas.`);return;}
   const href=catalogHref(slugs,name,phone);
   if(!href){setStatus("Catalog inputs are invalid.");return;}
   const url=new URL(href,window.location.origin);
   // No third-party QR service. The phone is present only if the broker opts in.
   try{setCreated({url:url.href,svg:qrSvg(url.href)});}
   catch{setStatus("Catalog link is too long for QR encoding. Use fewer or shorter property slugs.");}
 }
 async function copy(){
  if(!created)return;
  try{await navigator.clipboard.writeText(created.url);setStatus("Public catalog link copied.");}
  catch{setStatus("Copy the catalog link manually from below.");}
 }
 return <section className="gth-glass rounded-3xl border border-[var(--border)] p-5 sm:p-7" aria-label="Broker catalog QR generator">
  <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Free browser tool · no account or API call</p>
  <h2 className="mt-2 text-xl font-bold">Branded property mini-catalog & QR</h2>
  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">Choose up to five existing GTH PRO project slugs. The resulting QR and link are generated on your device. You are responsible for confirming your authority to market a project.</p>
  <div className="mt-4 grid gap-3 sm:grid-cols-2">
   <label className="text-sm font-semibold">Your public display name<input value={name} maxLength={60} onChange={e=>{setName(e.target.value);setCreated(null);}} className="gth-input mt-2" placeholder="Agency or agent name"/></label>
   <label className="text-sm font-semibold">Public business phone<input value={phone} maxLength={16} inputMode="tel" onChange={e=>{setPhone(e.target.value);setCreated(null);}} className="gth-input mt-2" placeholder="+919876543210"/></label>
   <label className="text-sm font-semibold sm:col-span-2">Property slugs (1–5, comma separated)<textarea value={rawSlugs} maxLength={600} rows={3} onChange={e=>{setRawSlugs(e.target.value);setCreated(null);}} className="gth-input mt-2" placeholder="project-slug-one, project-slug-two"/></label>
  </div>
  <label className="mt-4 flex items-start gap-3 text-xs leading-6 text-[var(--text-soft)]"><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);setCreated(null);}} className="mt-1 size-4"/><span>I understand that this link publicly displays my supplied business name and phone, and that anyone with the link may share them. Do not enter private personal numbers without consent.</span></label>
  <button type="button" className="gth-btn-gold mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold" onClick={generate}><QrCode size={17}/>Generate QR on this device</button>
  {status&&<p role="status" className="mt-3 text-xs text-[var(--text-soft)]">{status}</p>}
  {created&&<div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
    <img src={"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(created.svg)} alt="Locally generated QR code linking to public GTH PRO property mini-catalog" width={270} height={290} className="max-w-full"/>
    <p className="mt-2 break-all text-xs text-[var(--text-soft)]">{created.url}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={()=>saveSvg(created.svg)} className="gth-btn inline-flex min-h-11 items-center gap-2"><Download size={15}/>Save printable QR</button>
      <button type="button" onClick={()=>void copy()} className="gth-btn inline-flex min-h-11 items-center gap-2"><Copy size={15}/>Copy link</button>
      <a href={created.url} className="gth-btn inline-flex min-h-11 items-center">Preview catalog</a>
    </div>
  </div>}
  <p className="mt-4 text-xs leading-5 text-[var(--text-soft)]">This is a public research shortcut, not a verified broker license, project claim or live property inventory. No messages are sent automatically.</p>
 </section>;
}
