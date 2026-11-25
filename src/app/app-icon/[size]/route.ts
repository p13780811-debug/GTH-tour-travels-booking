import {createElement} from "react";
import {ImageResponse} from "next/og";
import {NextResponse} from "next/server";
export const runtime="edge";
export const dynamic="force-dynamic";

/** The same gold shield / G path as src/components/Logo.tsx. */
export async function GET(_req:Request,context:{params:Promise<{size:string}>}){
 const {size}=await context.params;
 if(!/^(180|192|512)$/.test(size)){
   return NextResponse.json({error:"Unsupported icon size"},{status:404});
 }
 const dimension=Number(size);
 const gold="#d4af37";
 const shield=createElement("svg",{width:dimension*.43,height:dimension*.43,viewBox:"0 0 100 100"},
   createElement("path",{d:"M50 10 L85 30 V70 L50 90 L15 70 V30 Z",fill:"none",stroke:gold,strokeWidth:3.5,strokeLinejoin:"round"}),
   createElement("path",{d:"M65 40 C60 35 55 33 50 33 C38 33 30 42 30 52 C30 62 38 71 50 71 C60 71 65 65 65 58 V52 H50",
     fill:"none",stroke:gold,strokeWidth:5,strokeLinecap:"round"})
 );
 const emblem=createElement("div",{
   style:{width:"100%",height:"100%",display:"flex",flexDirection:"column",
     alignItems:"center",justifyContent:"center",gap:dimension>200?8:3,
     background:"#061426",color:"#f8f9fe",fontFamily:"Arial,sans-serif"}
 },shield,
   createElement("div",{style:{display:"flex",fontWeight:800,fontSize:Math.round(dimension*.17),letterSpacing:"-0.04em"}},"GTH"),
   createElement("div",{style:{display:"flex",fontWeight:900,fontSize:Math.round(dimension*.13),letterSpacing:".14em",color:gold}},"PRO")
 );
 return new ImageResponse(emblem,{width:dimension,height:dimension,
   headers:{"Cache-Control":"public, max-age=86400","X-Content-Type-Options":"nosniff"}});
}
