import { createElement } from "react";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** Public brand raster icons generated on demand, with no client data or external assets. */
export async function GET(_request: Request, context: {params: Promise<{size: string}>}) {
  const {size} = await context.params;
  if (!/^(180|192|512)$/.test(size)) {
    return NextResponse.json({error:"Unsupported icon size"}, {status:404});
  }
  const dimension = Number(size);
  const border = Math.max(3, Math.floor(dimension/95));
  const icon = createElement("div", {
    style:{
      width:"100%",height:"100%",display:"flex",alignItems:"center",
      justifyContent:"center",background:"#061426",color:"#f8f9fe",
      fontFamily:"sans-serif"
    }
  }, createElement("div", {
    style:{
      height:"78%",width:"78%",borderRadius:"23%",border:border+"px solid #d4af37",
      display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",gap:dimension>200?8:3
    }
  },
    createElement("div",{style:{display:"flex",fontWeight:800,fontSize:Math.round(dimension*.218),letterSpacing:"-0.06em"}},"GTH"),
    createElement("div",{style:{display:"flex",fontWeight:800,fontSize:Math.round(dimension*.154),color:"#d4af37",letterSpacing:".16em"}},"PRO")
  ));
  return new ImageResponse(icon,{width:dimension,height:dimension,headers:{
    "Cache-Control":"public, max-age=86400",
    "X-Content-Type-Options":"nosniff"
  }});
}
