"use client";
import {useState} from "react";
import {FileDown} from "lucide-react";
import {downloadComparisonPdf,type ComparisonItem} from "@/lib/client/comparison-pdf";
export default function ComparisonPdfButton({kind,items}:{kind:string;items:ComparisonItem[]}){
 const [status,setStatus]=useState("");
 const available=items.length>=2&&items.length<=3;
 return <div>
  <button type="button" disabled={!available} className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
   onClick={()=>{try{downloadComparisonPdf(kind,items);setStatus("Comparison PDF prepared entirely on this device.");}catch{setStatus("PDF export is unavailable in this browser. Try Chrome or Safari.");}}}>
   <FileDown size={17} aria-hidden="true"/>Download comparison PDF
  </button>
  {!available&&<p className="mt-2 text-xs text-[var(--text-soft)]">Choose 2–3 records for a browser-only PDF.</p>}
  {status&&<p role="status" className="mt-2 text-xs text-[var(--text-soft)]">{status}</p>}
 </div>;
}
