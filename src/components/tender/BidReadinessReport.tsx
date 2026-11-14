"use client";
import {useState} from "react";
import Link from "next/link";
import {Download,ClipboardCheck} from "lucide-react";
import {scoreBidReadiness,type BidReadinessInput} from "@/lib/tender/readiness-score";
import {downloadTenderReadinessCanvas} from "@/lib/client/comparison-pdf";

const defaults:BidReadinessInput={
 turnoverLakhs:"",experienceYears:"",similarProjects:"",msme:"unknown",
 gstReady:false,financialsReady:false,criteriaReviewed:false
};
function clean(text:string,max=90){return text.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max);}
function makePdf(input:BidReadinessInput,result:Extract<ReturnType<typeof scoreBidReadiness>,{ok:true}>){
 const canvas=document.createElement("canvas");canvas.width=1684;canvas.height=1190;
 const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas is unavailable");
 ctx.fillStyle="#ffffff";ctx.fillRect(0,0,1684,1190);
 ctx.fillStyle="#11243b";ctx.fillRect(0,0,1684,210);
 ctx.fillStyle="#d6b46e";ctx.fillRect(0,0,1684,10);
 ctx.fillStyle="#fff";ctx.font="bold 58px Arial,sans-serif";ctx.fillText("GTH PRO  |  Bid Readiness Report",83,89);
 ctx.font="27px Arial,sans-serif";ctx.fillText("Private, self-assessed preparation check   •   "+new Date().toLocaleDateString("en-IN"),86,150);
 ctx.fillStyle="#17324e";ctx.font="bold 95px Arial,sans-serif";ctx.fillText(String(result.score)+"/100",95,360);
 ctx.font="bold 37px Arial,sans-serif";ctx.fillText(clean(result.level),520,340);
 ctx.font="25px Arial,sans-serif";ctx.fillText("Preparation score — NOT official tender eligibility",520,386);
 ctx.fillStyle="#e8edf2";ctx.fillRect(76,441,1532,420);
 ctx.fillStyle="#17324e";ctx.font="bold 29px Arial,sans-serif";ctx.fillText("Self-declared inputs",108,494);
 const rows=[
  "Annual turnover (INR lakh): "+clean(input.turnoverLakhs,25),
  "Work experience (years): "+clean(input.experienceYears,20),
  "Similar completed projects: "+clean(input.similarProjects,20),
  "MSME status: "+(input.msme==="registered"?"Registered":input.msme==="not_registered"?"Not registered":"Not answered"),
  "GST / business documents: "+(input.gstReady?"Ready":"Not confirmed"),
  "Financial statements: "+(input.financialsReady?"Ready":"Not confirmed"),
  "Tender criteria read: "+(input.criteriaReviewed?"Confirmed":"Not confirmed")
 ];
 ctx.font="25px Arial,sans-serif";
 rows.forEach((text,i)=>ctx.fillText(clean(text,105),110,542+i*42));
 ctx.fillStyle="#33475b";ctx.font="24px Arial,sans-serif";
 ctx.fillText("Next checks: "+clean(result.missing.slice(0,2).join("; ")||"Verify tender-specific criteria at the source.",105),85,922);
 ctx.fillStyle="#b88d3f";ctx.fillRect(110,975,1465,110);
 ctx.fillStyle="#11243b";ctx.font="bold 32px Arial,sans-serif";
 ctx.fillText("Need help filing this bid? Request a quote on GTH PRO",146,1040);
 ctx.fillStyle="#3f5063";ctx.font="19px Arial,sans-serif";
 ctx.fillText("This score reflects answer completeness, not threshold compliance. Check official tender rules before filing.",81,1136);
 downloadTenderReadinessCanvas(canvas);
}
export default function BidReadinessReport(){
 const [details,setDetails]=useState<BidReadinessInput>(defaults);
 const [message,setMessage]=useState("");
 const [score,setScore]=useState<ReturnType<typeof scoreBidReadiness>|null>(null);
 const update=<K extends keyof BidReadinessInput>(key:K,value:BidReadinessInput[K])=>{
  setDetails(old=>({...old,[key]:value}));setScore(null);setMessage("");
 };
 function download(){
  const result=scoreBidReadiness(details);setScore(result);
  if(!result.ok){setMessage(result.error);return;}
  try{makePdf(details,result);setMessage("One-page PDF saved on your device. No details were submitted.");}
  catch{setMessage("PDF download failed. Check browser download permissions and retry.");}
 }
 return <section id="bid-readiness" aria-labelledby="bid-readiness-heading" className="gth-glass mx-auto mt-8 max-w-7xl rounded-3xl border border-[var(--border)] p-5 sm:p-8">
  <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Free tender preparation tool · 100% browser-side</p>
  <h2 id="bid-readiness-heading" className="mt-3 text-2xl font-bold">GTH PRO Bid Readiness Report</h2>
  <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Get an instant one-page self-assessment PDF. This is a preparation checklist, not an official eligibility score. Your turnover and company answers stay in this browser unless you download or share the PDF yourself.</p>
  <div className="mt-5 grid gap-4 sm:grid-cols-3">
   <label className="text-sm font-semibold">Annual turnover (INR lakh)
     <input type="number" inputMode="decimal" min="0" max="100000000" step="0.01" value={details.turnoverLakhs} onChange={e=>update("turnoverLakhs",e.target.value)} className="gth-input mt-2" placeholder="e.g. 150"/>
   </label>
   <label className="text-sm font-semibold">Experience (years)
     <input type="number" inputMode="numeric" min="0" max="100" step="1" value={details.experienceYears} onChange={e=>update("experienceYears",e.target.value)} className="gth-input mt-2" placeholder="e.g. 5"/>
   </label>
   <label className="text-sm font-semibold">Similar completed projects
     <input type="number" inputMode="numeric" min="0" max="100000" step="1" value={details.similarProjects} onChange={e=>update("similarProjects",e.target.value)} className="gth-input mt-2" placeholder="e.g. 3"/>
   </label>
   <label className="text-sm font-semibold sm:col-span-3">MSME registration status
     <select className="gth-input mt-2" value={details.msme} onChange={e=>update("msme",e.target.value as BidReadinessInput["msme"])}>
       <option value="unknown">Choose status</option><option value="registered">Registered MSME</option><option value="not_registered">Not registered</option>
     </select>
   </label>
  </div>
  <div className="mt-5 grid gap-3 sm:grid-cols-3">
   <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={details.gstReady} onChange={e=>update("gstReady",e.target.checked)}/>GST / business documents ready</label>
   <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={details.financialsReady} onChange={e=>update("financialsReady",e.target.checked)}/>Audited financial statements ready</label>
   <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={details.criteriaReviewed} onChange={e=>update("criteriaReviewed",e.target.checked)}/>Exact tender eligibility read</label>
  </div>
  <div className="mt-5 flex flex-wrap items-center gap-3">
   <button type="button" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold" onClick={download}><Download size={17}/>Download 1-page Readiness PDF</button>
   <Link href="/tender/services?service=eligibility_review#service-request" className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm"><ClipboardCheck size={17}/>Request a bid support quote</Link>
  </div>
  {score?.ok&&<div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4" role="status"><strong>Indicative preparation: {score.score}/100 — {score.level}</strong><p className="mt-2 text-xs text-[var(--text-soft)]">Not government eligibility or award probability. Check each tender's mandatory conditions and exemptions.</p></div>}
  {message&&<p role="status" className="mt-3 text-sm text-[var(--text-soft)]">{message}</p>}
 </section>;
}
