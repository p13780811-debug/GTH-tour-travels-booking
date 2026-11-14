/**
 * Browser-only, image-backed A4-landscape PDF. Canvas fonts render Unicode
 * without uploading source-backed comparison data or adding PDF dependencies.
 */
export type ComparisonItem={title:string;path:string;fields:Record<string,string>};
const clean=(value:unknown,max=150)=>typeof value==="string"
 ?value.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max):"Not recorded";
function wrap(ctx:CanvasRenderingContext2D,text:string,width:number,maxLines=3){
 const words=clean(text,240).split(/\s+/),lines:string[]=[];
 let line="";
 for(const word of words){
   const proposed=line?line+" "+word:word;
   if(ctx.measureText(proposed).width<=width){line=proposed;continue;}
   if(line){lines.push(line);line=word;}
   else{ // Long identifiers must not overflow their column.
     let chunk="";
     for(const char of word){if(ctx.measureText(chunk+char).width>width&&chunk){lines.push(chunk);chunk=char;}else chunk+=char;}
     line=chunk;
   }
   if(lines.length>=maxLines)break;
 }
 if(line&&lines.length<maxLines)lines.push(line);
 if(words.length&&!lines.length)lines.push("Not recorded");
 return lines.slice(0,maxLines);
}
function bytes(text:string){return new TextEncoder().encode(text);}
function pdfFromJpeg(jpeg:Uint8Array,annotations:{url:string;x:number;y:number;w:number;h:number}[]){
 const W=842,H=595,objects:Uint8Array[]=[];
 const mk=(data:string)=>bytes(data);
 objects.push(mk("<< /Type /Catalog /Pages 2 0 R >>"));
 objects.push(mk("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
 objects.push(mk(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R /Annots [${annotations.map((_,i)=>`${6+i} 0 R`).join(" ")}] >>`));
 const imageBegin=mk(`<< /Type /XObject /Subtype /Image /Width 1684 /Height 1190 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
 const imageEnd=mk("\nendstream");
 const image=new Uint8Array(imageBegin.length+jpeg.length+imageEnd.length);
 image.set(imageBegin);image.set(jpeg,imageBegin.length);image.set(imageEnd,imageBegin.length+jpeg.length);
 objects.push(image);
 const content=mk("q\n842 0 0 595 0 0 cm\n/Im1 Do\nQ\n");
 objects.push(mk(`<< /Length ${content.length} >>\nstream\n`+new TextDecoder().decode(content)+"endstream"));
 for(const a of annotations){
  // Links are first-party HTTPS URLs built from vetted relative paths only.
  const r=[a.x/2,595-(a.y+a.h)/2,(a.x+a.w)/2,595-a.y/2].map(v=>Math.round(v*100)/100);
  const safePdfUri=a.url.replace(/[\\()]/g, char => "\\" + char);
  objects.push(mk(`<< /Type /Annot /Subtype /Link /Rect [${r.join(" ")}] /Border [0 0 0] /A << /S /URI /URI (${safePdfUri}) >> >>`));
 }
 const parts:Uint8Array[]=[mk("%PDF-1.4\n%GTH PRO\n")];let offset=parts[0].length;const offsets=[0];
 for(let i=0;i<objects.length;i++){
  const intro=mk(`${i+1} 0 obj\n`),end=mk("\nendobj\n");
  offsets.push(offset);parts.push(intro,objects[i],end);offset+=intro.length+objects[i].length+end.length;
 }
 const xref=offset;let trailer=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
 for(const x of offsets.slice(1))trailer+=String(x).padStart(10,"0")+" 00000 n \n";
 trailer+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 parts.push(mk(trailer));
 const pdf=new Uint8Array(offset+bytes(trailer).length);let pos=0;
 for(const part of parts){pdf.set(part,pos);pos+=part.length;}
 return pdf;
}
export function downloadComparisonPdf(kind:string,items:ComparisonItem[]){
 if(typeof document==="undefined"||items.length<2||items.length>3)throw Error("Choose two or three records.");
 const canvas=document.createElement("canvas");canvas.width=1684;canvas.height=1190;
 const ctx=canvas.getContext("2d");
 if(!ctx)throw Error("Canvas unavailable.");
 const W=canvas.width,H=canvas.height,colW=455,x0=200;
 ctx.fillStyle="#ffffff";ctx.fillRect(0,0,W,H);
 ctx.fillStyle="#142840";ctx.fillRect(0,0,W,160);
 ctx.fillStyle="#fff";ctx.font="bold 48px Arial,sans-serif";ctx.fillText("GTH PRO  |  Side-by-side research",65,75);
 ctx.font="24px Arial,sans-serif";ctx.fillText(clean(kind,50)+" comparison  ·  "+new Date().toLocaleDateString("en-IN"),66,118);
 ctx.fillStyle="#182d44";ctx.font="bold 25px Arial,sans-serif";ctx.fillText("Recorded details",55,226);
 const keys=Array.from(new Set(items.flatMap(item=>Object.keys(item.fields)))).slice(0,9);
 const annotations:{url:string;x:number;y:number;w:number;h:number}[]=[];
 items.forEach((item,i)=>{
  const x=x0+i*colW;
  ctx.fillStyle="#edf2f5";ctx.fillRect(x-10,181,colW-13,169);
  ctx.fillStyle="#13283f";ctx.font="bold 23px Arial,sans-serif";
  wrap(ctx,item.title,410,3).forEach((line,j)=>ctx.fillText(line,x,221+j*31));
  const url=new URL(item.path,window.location.origin);
  if(item.path.startsWith("/")&&!item.path.startsWith("//")&&url.origin===window.location.origin&&/^[a-z0-9._~!$&'()*+,;=:@%/?#-]+$/i.test(item.path)){
    annotations.push({url:url.href,x,y:182,w:430,h:130});
  }
 });
 const rowH=80,top=370;
 keys.forEach((key,row)=>{
   const y=top+row*rowH;
   if(row%2===0){ctx.fillStyle="#f4f6f8";ctx.fillRect(48,y-33,1586,rowH);}
   ctx.fillStyle="#526170";ctx.font="bold 18px Arial,sans-serif";
   wrap(ctx,key,145,2).forEach((line,j)=>ctx.fillText(line,56,y+j*24));
   items.forEach((item,i)=>{
     ctx.fillStyle="#172b40";ctx.font="19px Arial,sans-serif";
     wrap(ctx,item.fields[key]||"Not recorded",410,2).forEach((line,j)=>ctx.fillText(line,x0+i*colW,y+j*26));
   });
 });
 ctx.fillStyle="#d8b779";ctx.fillRect(0,H-120,W,3);
 ctx.fillStyle="#142840";ctx.font="bold 25px Arial,sans-serif";
 ctx.fillText("GTH PRO  ·  gthproglobal.com",55,H-72);
 ctx.fillStyle="#526170";ctx.font="20px Arial,sans-serif";
 ctx.fillText("Research only. Verify original sources, final prices, dates and availability.",55,H-36);
 annotations.push({url:"https://gthproglobal.com/",x:50,y:H-116,w:740,h:98});
 const payload=canvas.toDataURL("image/jpeg",0.83).split(",")[1];
 if(!payload)throw Error("PDF canvas could not be encoded.");
 const binary=atob(payload),jpeg=Uint8Array.from(binary,c=>c.charCodeAt(0));
 const data=pdfFromJpeg(jpeg,annotations);
 const objectUrl=URL.createObjectURL(new Blob([data],{type:"application/pdf"}));
 const a=document.createElement("a");a.href=objectUrl;a.download=`gth-pro-${clean(kind,28).toLowerCase().replace(/[^a-z0-9]+/g,"-")}-comparison.pdf`;
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),3000);
}
