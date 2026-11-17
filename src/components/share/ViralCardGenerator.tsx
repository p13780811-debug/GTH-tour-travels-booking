"use client";

import { useState } from "react";

type ViralKind = "property" | "tender" | "stadium";
type Size = "square" | "story";
const DIMENSIONS: Record<Size,readonly [number,number]> = {
  square:[1080,1080], story:[1080,1920],
};
type Props = {
  kind:ViralKind;
  title:string;
  subtitle?:string|null;
  price?:string|null;
  path:string;
};

function safeText(text:unknown,max:number) {
  return typeof text==="string"
    ? text.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>]/g," ").replace(/\s+/g," ").trim().slice(0,max)
    : "";
}
function sourceUrl(path:string) {
  if(!/^\/(?:real-estate|tender|stadiums)(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(path)) return "https://www.gthproglobal.com";
  return "https://www.gthproglobal.com"+path;
}
function multiline(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines:number) {
  const words=text.split(/\s+/).filter(Boolean);
  let line="",lines=0;
  for(const word of words) {
    const next=line?line+" "+word:word;
    if(ctx.measureText(next).width>maxWidth && line){
      ctx.fillText(line,x,y+lines*lineHeight);lines++;line=word;
      if(lines===maxLines-1)break;
    } else line=next;
  }
  if(line && lines<maxLines)ctx.fillText(line,x,y+lines*lineHeight);
}
function renderCard({kind,title,subtitle,price,path}:Props,size:Size) {
  const [w,h]=DIMENSIONS[size];
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("Canvas unavailable");
  const gradient=ctx.createLinearGradient(0,0,w,h);
  gradient.addColorStop(0,"#0b1030");gradient.addColorStop(.55,"#090b19");gradient.addColorStop(1,"#03050c");
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  const halo=ctx.createRadialGradient(w*.77,h*.24,10,w*.77,h*.24,w*.75);
  halo.addColorStop(0,"rgba(199,155,68,.23)");halo.addColorStop(1,"rgba(199,155,68,0)");
  ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle="rgba(212,170,84,.3)";ctx.lineWidth=3;
  ctx.strokeRect(52,52,w-104,h-104);
  for(let i=0;i<6;i++){
    ctx.beginPath();ctx.ellipse(w*.88,h*.24,150+i*43,150+i*43,Math.PI/5,0,Math.PI*2);ctx.stroke();
  }
  ctx.textBaseline="top";
  ctx.fillStyle="#e1b65d";ctx.font="bold 36px Arial, sans-serif";
  ctx.fillText("GTH PRO  /  GLOBAL",94,110);
  const kindLabel={property:"GLOBAL REAL ESTATE",tender:"GLOBAL TENDER INTELLIGENCE",stadium:"MATCH-DAY FAN CONCIERGE"}[kind];
  ctx.font="600 27px Arial, sans-serif";ctx.fillText(kindLabel,96,h*.34-76);
  ctx.fillStyle="#ffffff";ctx.font="bold 62px Arial, sans-serif";
  multiline(ctx,safeText(title,150)||"Explore GTH PRO",94,h*.34,w-188,78,size==="story"?7:4);
  ctx.fillStyle="#d6d8e4";ctx.font="34px Arial, sans-serif";
  multiline(ctx,safeText(subtitle,180),96,h*.64,w-192,48,size==="story"?5:3);
  if(price) {
    ctx.fillStyle="#e7b959";ctx.font="bold 43px Arial, sans-serif";
    multiline(ctx,safeText(price,90),96,h*.77,w-192,52,2);
  }
  ctx.strokeStyle="rgba(212,170,84,.4)";ctx.beginPath();ctx.moveTo(94,h-248);ctx.lineTo(w-94,h-248);ctx.stroke();
  ctx.fillStyle="#fff";ctx.font="bold 34px Arial, sans-serif";
  ctx.fillText("gthproglobal.com",96,h-213);
  ctx.fillStyle="#e1b65d";ctx.font="30px Arial, sans-serif";
  ctx.fillText("@official.gthpro",96,h-159);
  ctx.fillStyle="#d6d8e4";ctx.font="22px Arial, sans-serif";
  ctx.fillText("Research and verify details before acting.",96,h-105);
  return {canvas,url:sourceUrl(path),name:"gthpro-"+kind+"-"+size+".png"};
}

export default function ViralCardGenerator(props:Props){
  const [size,setSize]=useState<Size>("square");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function share(){
    if(busy)return;setBusy(true);setMessage("");
    try{
      const {canvas,url,name}=renderCard(props,size);
      const blob=await new Promise<Blob>((resolve,reject)=>{
        canvas.toBlob(data=>data?resolve(data):reject(new Error("PNG export unavailable")),"image/png");
      });
      const file=new File([blob],name,{type:"image/png"});
      const caption=["GTH PRO Global",safeText(props.title,150),safeText(props.subtitle,180),url,"@official.gthpro"].filter(Boolean).join("\n");
      if(typeof navigator.share==="function" && typeof navigator.canShare==="function" &&
        navigator.canShare({files:[file]})){
        try{await navigator.share({files:[file],title:safeText(props.title,150),text:caption});setMessage("Shared.");return;}
        catch(error){if((error as Error)?.name==="AbortError"){setMessage("Share cancelled.");return;}}
      }
      const objectUrl=URL.createObjectURL(blob);
      const link=document.createElement("a");link.href=objectUrl;link.download=name;
      document.body.appendChild(link);link.click();link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
      setMessage("PNG downloaded. Share it on WhatsApp, Instagram or your preferred app.");
    }catch{setMessage("PNG generation unavailable in this browser.");}
    finally{setBusy(false);}
  }
  return <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="GTH PRO branded viral card">
    <label className="sr-only" htmlFor={"viral-size-"+props.kind+"-"+safeText(props.path,70).replace(/[^a-z0-9]/gi,"-")}>Viral card size</label>
    <select id={"viral-size-"+props.kind+"-"+safeText(props.path,70).replace(/[^a-z0-9]/gi,"-")}
      className="gth-glass min-h-11 rounded-lg border border-[var(--border)] px-2 text-xs"
      value={size} onChange={event=>setSize(event.target.value as Size)}>
      <option value="square">1080 × 1080</option><option value="story">1080 × 1920</option>
    </select>
    <button type="button" className="gth-btn inline-flex min-h-11 items-center justify-center text-xs"
      onClick={share} disabled={busy}>{busy?"Generating PNG…":"Share Viral Card"}</button>
    {message&&<p role="status" className="basis-full text-xs text-[var(--text-soft)]">{message}</p>}
  </div>;
}
