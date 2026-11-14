/**
 * Free, completely browser-side QR visiting poster. No image service, uploads
 * or remote font requests. Public contact is included only after QR consent.
 */
import {qrcodegen} from "@/lib/client/vendor/qrcodegen";

export type BrokerPoster={url:string;broker:string;phone:string;projects:string[];shape?:"status"|"square"};
const compact=(raw:string,max:number)=>raw.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max);
function fit(ctx:CanvasRenderingContext2D,text:string,maxWidth:number){
 let value=compact(text,115);
 while(value.length>2&&ctx.measureText(value).width>maxWidth)value=value.slice(0,-2);
 return value.length<compact(text,115).length?value.trimEnd()+"…":value;
}
function download(canvas:HTMLCanvasElement,filename:string){
 const a=document.createElement("a");
 a.href=canvas.toDataURL("image/png");a.download=filename;
 document.body.appendChild(a);a.click();a.remove();
}
export function downloadBrokerPoster(input:BrokerPoster){
 if(typeof document==="undefined"||!input.url.startsWith("https://")&&!input.url.startsWith("http://"))throw Error("Invalid catalog link");
 const href=new URL(input.url);
 if(href.origin!==window.location.origin||href.pathname!=="/real-estate/mini-catalog")throw Error("Only public GTH PRO catalogs can be shared");
 if(input.projects.length<1||input.projects.length>5)throw Error("Select 1 to 5 projects first");
 const qr=qrcodegen.QrCode.encodeText(href.href,qrcodegen.QrCode.Ecc.MEDIUM);
 const square=input.shape==="square",W=1080,H=square?1080:1920;
 const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext("2d");
 if(!ctx)throw Error("Poster canvas is unavailable");
 ctx.fillStyle="#0f2035";ctx.fillRect(0,0,W,H);
 ctx.fillStyle="#d6b66b";ctx.fillRect(0,0,W,16);
 ctx.fillStyle="#f6f7fb";ctx.font="bold 76px Arial,sans-serif";ctx.fillText("GTH PRO",74,122);
 ctx.fillStyle="#d6b66b";ctx.font="bold 31px Arial,sans-serif";ctx.fillText("PROPERTY RESEARCH · DIGITAL VISITING CARD",76,179);
 ctx.fillStyle="#ffffff";ctx.font="bold 54px Arial,sans-serif";
 ctx.fillText(fit(ctx,input.broker,920),74,272);
 ctx.fillStyle="#e3e7ed";ctx.font="38px Arial,sans-serif";ctx.fillText(fit(ctx,input.phone,890),76,333);
 const mainY=square?390:380,mainH=square?255:620;
 ctx.fillStyle="#1d3550";ctx.fillRect(64,mainY,952,mainH);
 ctx.fillStyle="#d6b66b";ctx.font="bold 34px Arial,sans-serif";ctx.fillText("PROJECT SHORTLIST",96,mainY+64);
 const rowHeight=square?37:89,rowFont=square?24:39;
 input.projects.forEach((value,i)=>{
  const y=mainY+(square?107:141)+i*rowHeight;
  ctx.fillStyle="#d6b66b";ctx.beginPath();ctx.arc(105,y-12,9,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#fff";ctx.font="bold "+rowFont+"px Arial,sans-serif";
  ctx.fillText(fit(ctx,value,820),138,y);
 });
 const qrOuter=square?250:612,qrX=(W-qrOuter)/2,qrY=square?670:1047;
 ctx.fillStyle="#fff";ctx.fillRect(qrX,qrY,qrOuter,qrOuter);
 const quiet=4,moduleSize=(qrOuter-42)/(qr.size+quiet*2);
 ctx.fillStyle="#101820";
 for(let y=0;y<qr.size;y++)for(let x=0;x<qr.size;x++)if(qr.getModule(x,y))
  ctx.fillRect(qrX+21+(x+quiet)*moduleSize,qrY+21+(y+quiet)*moduleSize,moduleSize+0.25,moduleSize+0.25);
 ctx.fillStyle="#fff";ctx.textAlign="center";
 ctx.font="bold "+(square?26:44)+"px Arial,sans-serif";
 ctx.fillText("SCAN TO VIEW PROJECTS",W/2,qrY+qrOuter+(square?39:70));
 ctx.font=(square?16:25)+"px Arial,sans-serif";ctx.fillStyle="#b9c6d5";
 ctx.fillText("Public research links · Broker identity and availability not verified",W/2,qrY+qrOuter+(square?51:87));
 ctx.fillStyle="#d6b66b";ctx.fillRect(0,H-(square?75:136),W,3);
 ctx.font="bold "+(square?27:43)+"px Arial,sans-serif";
 ctx.fillText("Powered by gthproglobal.com",W/2,H-(square?25:64));
 download(canvas,"gth-pro-broker-visiting-poster-"+(square?"square":"status")+".png");
}
