"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, UploadCloud, CheckCircle2, AlertTriangle, Download, Layers3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { readApiJson } from "@/lib/api-response";
import { extractListingIntake } from "@/lib/real-estate/listing-intake";
import {
  BULK_MAX_BYTES, BULK_MAX_FILES, BULK_MAX_RECORDS, applyBulkDuplicateWarnings,
  csvTemplate, enrichBulkValues, parseDelimited, rowsFromSheet, validateBulkValues,
  type BulkDraftRow, type BulkDefaults, type BulkListingField, type BulkListingValues,
} from "@/lib/real-estate/bulk-listing";

const EDIT_FIELDS: {name: BulkListingField; label:string;required?:boolean;options?:string[]}[] = [
  {name:"title",label:"Actual project/property name",required:true},
  {name:"country",label:"Country",required:true},
  {name:"city",label:"City",required:true},
  {name:"location",label:"Address/locality",required:true},
  {name:"property_type",label:"Property type",required:true,options:["Apartment","Villa","Penthouse","Commercial","Plot"]},
  {name:"listing_type",label:"Listing purpose",required:true,options:["buy","rent"]},
  {name:"description",label:"Description",required:true},
  {name:"price_amount",label:"Asking price (numeric)"},
  {name:"currency",label:"Currency",options:["INR","AED","USD","GBP","EUR","SGD"]},
  {name:"bedrooms",label:"Bedrooms"},
  {name:"bathrooms",label:"Bathrooms"},
  {name:"area_value",label:"Area"},
  {name:"area_unit",label:"Area unit",options:["sqft","sqm"]},
  {name:"area_basis",label:"Area basis",options:["carpet","built_up","plot"]},
  {name:"possession_status",label:"Possession status",options:["ready_to_move","under_construction","off_plan"]},
  {name:"registry_reference",label:"MahaRERA project number (optional)"},
];
function joinAndRevalidate(source:BulkDraftRow[]):BulkDraftRow[] {
  const normalized=source.map(row=>({
    ...row,missing:validateBulkValues(row.values),
    selected:row.selected&&validateBulkValues(row.values).length===0,
  }));
  return applyBulkDuplicateWarnings(normalized);
}
async function parseFile(file:File,defaults:BulkDefaults):Promise<BulkDraftRow[]> {
  if(file.size<=0||file.size>BULK_MAX_BYTES)throw new Error(file.name+": choose a file up to 8 MB.");
  const name=file.name.toLowerCase();
  if(name.endsWith(".csv")||name.endsWith(".tsv")) {
    const text=await file.text();
    const rows=parseDelimited(text,name.endsWith(".tsv")?"\t":",");
    return rowsFromSheet(rows,file.name,defaults);
  }
  if(name.endsWith(".xlsx")) {
    const head=new Uint8Array(await file.slice(0,4).arrayBuffer());
    if(head[0]!==0x50||head[1]!==0x4b)throw new Error(file.name+": invalid XLSX archive.");
    const {readSheet}=await import("read-excel-file/browser");
    const sheet=await readSheet(file);
    return rowsFromSheet(sheet,file.name,defaults);
  }
  if(name.endsWith(".pdf")) {
    const head=new TextDecoder().decode(await file.slice(0,5).arrayBuffer());
    if(head!=="%PDF-")throw new Error(file.name+": invalid PDF file.");
    const pdfjs=await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
    const loadingTask=pdfjs.getDocument({
      data:new Uint8Array(await file.arrayBuffer()),
    });
    const document=await loadingTask.promise;
    try {
      if(document.numPages>100)throw new Error(file.name+": use batches of up to 100 PDF pages.");
      const drafts:BulkDraftRow[]=[];
      for(let pageNumber=1;pageNumber<=document.numPages;pageNumber++) {
        const page=await document.getPage(pageNumber);
        const textContent=await page.getTextContent();
        const text=textContent.items
          .map(item=>("str" in item?item.str:""))
          .join(" ").replace(/\s+/g," ").trim();
        page.cleanup();
        if(text.length<12)continue;
        const parsed=extractListingIntake(text.slice(0,1200));
        const named=text.match(/\b(?:project|property)\s*(?:name|title)\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9 &.,'()-]{2,100}?)(?=\s{2,}|\s+(?:location|address|city|price|area)\s*[:\-]|$)/i);
        // A descriptive title inferred by AI-style intake is NOT official identity.
        const candidate={...parsed.fields,title:named?.[1]?.trim()||""} as Partial<BulkListingValues>;
        const draft=enrichBulkValues(candidate,defaults);
        const values=draft.values;
        const missing=validateBulkValues(values);
        drafts.push({
          id:file.name+":page-"+pageNumber,source:file.name+" / page "+pageNumber,
          values,missing,selected:false,
          notes:[
            "PDF extraction is a draft. Confirm that this page contains one complete property.",
            "Project identity, price and RERA details are not independently verified.",
            ...draft.notes,
          ],
        });
      }
      if(!drafts.length)throw new Error(file.name+": no selectable text found. Scanned PDFs require a separate OCR/Excel source.");
      return drafts;
    } finally {await loadingTask.destroy();}
  }
  throw new Error("Supported formats: .xlsx, .csv, .tsv, and text-based .pdf.");
}
export default function BulkListingUpload({onNeedLogin}:{onNeedLogin:()=>void}) {
  const [rows,setRows]=useState<BulkDraftRow[]>([]);
  const [files,setFiles]=useState<string[]>([]);
  const [country,setCountry]=useState("India");
  const [purpose,setPurpose]=useState("");
  const [currency,setCurrency]=useState("INR");
  const [role,setRole]=useState("");
  const [agentNumber,setAgentNumber]=useState("");
  const [authority,setAuthority]=useState(false);
  const [detailsConfirmed,setDetailsConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const ready=rows.filter(row=>!row.missing.length);
  const selected=ready.filter(row=>row.selected);
  const invalid=rows.length-ready.length;

  const parseFiles=async(fileList:FileList|null)=>{
    if(!fileList?.length)return;
    if(fileList.length>BULK_MAX_FILES){setError("Select up to 10 files at a time.");return;}
    setBusy(true);setError("");setSuccess("");
    try {
      const defaults={country,listing_type:purpose,currency};
      const extracted:BulkDraftRow[]=[];
      for(const file of Array.from(fileList)) {
        const results=await parseFile(file,defaults);
        extracted.push(...results);
        if(extracted.length>BULK_MAX_RECORDS)throw new Error("Maximum 100 projects per batch. Split the files.");
      }
      if(!extracted.length)throw new Error("No usable property records found.");
      if(rows.length+extracted.length>BULK_MAX_RECORDS)throw new Error("This portfolio would exceed 100 projects. Submit the current ready records first.");
      const fresh=extracted.map(row=>({...row,id:crypto.randomUUID()}));
      setRows(current=>joinAndRevalidate([...current,...fresh]));
      setFiles(current=>[...current,...Array.from(fileList).map(file=>file.name)]);
    }catch(err){setError(err instanceof Error?err.message:"Unable to read file. Please use a CSV/XLSX template.");}
    finally{setBusy(false);}
  };
  const edit=(id:string,key:BulkListingField,value:string)=>{
    setRows(current=>joinAndRevalidate(current.map(row=>{
      if(row.id!==id)return row;
      const values={...row.values,[key]:value};
      return {...row,values,selected:true,notes:row.notes};
    })));
    setError("");setSuccess("");
  };
  const downloadTemplate=()=>{
    const blob=new Blob([csvTemplate()],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="gth-pro-bulk-property-template.csv";
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const submit=async()=>{
    if(busy||!selected.length)return;
    if(!role){setError("Choose your relationship to these listings.");return;}
    if(!authority||!detailsConfirmed){setError("Confirm your authority and review the data first.");return;}
    if(role==="agent"&&selected.some(row=>row.values.country.toLowerCase()==="india")&&!/^A\d{11}$/.test(agentNumber.trim().toUpperCase())){
      setError("India agents must provide their MahaRERA agent registration: A followed by 11 digits.");return;
    }
    setBusy(true);setError("");setSuccess("");
    try{
      const {data}=await supabase.auth.getSession();
      if(!data.session){onNeedLogin();throw new Error("Please sign in before submitting your portfolio. Drafts remain on screen.");}
      const result=await readApiJson<{success:boolean;submitted:number;duplicates:number;status:string}>(
        await fetch("/api/real-estate/submissions/bulk",{
          method:"POST",
          headers:{"Content-Type":"application/json",Authorization:"Bearer "+data.session.access_token},
          body:JSON.stringify({
            submitter_role:role,agent_registration:agentNumber.trim().toUpperCase(),
            authority_confirmed:authority,details_confirmed:detailsConfirmed,
            rows:selected.map(row=>row.values),
          }),
        }),
      );
      setSuccess(result.submitted+" properties submitted to GTH PRO administrator review. "+
        result.duplicates+" previously submitted/duplicate records skipped. None have been automatically published.");
      const sent=new Set(selected.map(row=>row.id));
      setRows(previous=>previous.filter(row=>!sent.has(row.id)));
      setDetailsConfirmed(false);
    }catch(err){setError(err instanceof Error?err.message:"Bulk submission failed. Your drafts are retained.");}
    finally{setBusy(false);}
  };

  return <section className="gth-glass rounded-3xl p-5 md:p-8 mt-6" aria-labelledby="bulk-upload-title">
    <div className="flex items-start gap-3">
      <Layers3 className="gold-text shrink-0 mt-1" size={25} aria-hidden="true"/>
      <div>
        <p className="gold-text text-xs font-semibold uppercase tracking-widest">Developer & Broker Portfolio Onboarding</p>
        <h2 id="bulk-upload-title" className="text-2xl font-bold mt-2">Bulk Upload Your Property Inventory</h2>
        <p className="text-sm opacity-75 mt-3 leading-6">Have 10, 50 or 100 properties? Upload your existing Excel, CSV or selectable-text PDF. Review extracted records, correct any gaps, and send the ready projects together for independent administrator review.</p>
      </div>
    </div>
    <div className="grid md:grid-cols-3 gap-4 mt-6">
      <label className="block text-sm font-medium">Default country
        <input value={country} maxLength={80} onChange={event=>setCountry(event.target.value)} className="gth-glass rounded-xl p-3 w-full mt-2"/>
      </label>
      <label className="block text-sm font-medium">Default listing purpose
        <select value={purpose} onChange={event=>setPurpose(event.target.value)} className="gth-glass bg-[var(--card)] rounded-xl p-3 w-full mt-2">
          <option value="">Use each document&apos;s value</option><option value="buy">For sale</option><option value="rent">For rent</option>
        </select>
      </label>
      <label className="block text-sm font-medium">Default currency
        <select value={currency} onChange={event=>setCurrency(event.target.value)} className="gth-glass bg-[var(--card)] rounded-xl p-3 w-full mt-2">
          {["INR","AED","USD","GBP","EUR","SGD"].map(value=><option key={value}>{value}</option>)}
        </select>
      </label>
    </div>
    <div className="flex flex-wrap items-center gap-3 mt-5">
      <button type="button" onClick={downloadTemplate} disabled={busy} className="gth-btn min-h-11 rounded-xl px-4 inline-flex gap-2 items-center">
        <Download size={16}/> Download Excel-compatible CSV Template
      </button>
      <span className="text-xs opacity-70">Excel: one property per row · PDF: usually one project per page</span>
    </div>
    <label htmlFor="bulk-property-files" className="flex gap-3 items-center gth-glass rounded-2xl p-4 mt-5 cursor-pointer min-h-20">
      <UploadCloud className="gold-text shrink-0" size={23}/>
      <span className="text-sm"><strong>Select property catalogue files</strong><span className="block opacity-70 mt-1">.xlsx · .csv · .tsv · .pdf · up to 8 MB per file · 10 files / 100 records</span></span>
    </label>
    <input id="bulk-property-files" type="file" multiple accept=".xlsx,.csv,.tsv,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
      disabled={busy} className="block w-full mt-2 text-sm" onChange={event=>{void parseFiles(event.target.files);event.target.value="";}}/>
    {files.length>0&&<p className="text-xs opacity-75 mt-2">Loaded into this batch: {files.join(" · ")}</p>}
    <p className="text-xs opacity-70 mt-3">Documents are parsed in your browser; only reviewed property fields are submitted. Scanned PDFs cannot be reliably extracted without OCR. Original catalogues are not retained as evidence—keep your source files.</p>
    {busy&&<p role="status" className="mt-4 text-sm">Processing your portfolio or submitting for review…</p>}
    {error&&<p role="alert" className="mt-4 text-sm">{error}</p>}
    {success&&<p role="status" className="mt-4 text-sm font-semibold">{success}</p>}
    {rows.length>0&&<div className="mt-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h3 className="font-semibold text-lg">Imported portfolio preview</h3>
        <p role="status" className="text-sm">{rows.length} found · {ready.length} ready · {invalid} need correction · {selected.length} selected</p>
      </div>
      <div className="flex gap-3 flex-wrap mt-3">
        <button type="button" className="gth-btn px-4 min-h-11 rounded-xl" disabled={busy} onClick={()=>setRows(current=>current.map(r=>({...r,selected:!r.missing.length})))}>
          Select all ready
        </button>
        <button type="button" className="gth-btn px-4 min-h-11 rounded-xl" disabled={busy} onClick={()=>setRows(current=>current.map(r=>({...r,selected:false})))}>
          Clear selection
        </button>
      </div>
      <div className="space-y-3 mt-4">
        {rows.map((row,index)=><details key={row.id} className="gth-glass rounded-2xl p-4">
          <summary className="cursor-pointer flex flex-wrap items-center gap-3 list-none">
            <input type="checkbox" checked={row.selected&&!row.missing.length} disabled={busy||row.missing.length>0}
              aria-label={"Include "+(row.values.title||"property "+(index+1))}
              onClick={event=>event.stopPropagation()}
              onChange={event=>setRows(prev=>prev.map(item=>item.id===row.id?{...item,selected:event.target.checked}:item))}
              className="h-5 w-5"/>
            {row.missing.length?<AlertTriangle className="shrink-0" size={16}/>:<CheckCircle2 className="gold-text shrink-0" size={16}/>}
            <span className="font-semibold break-words">{index+1}. {row.values.title||"Project name missing"}</span>
            <span className="text-xs opacity-70">{row.values.city||"City missing"} · {row.source}</span>
            <span className="text-xs opacity-80">{row.missing.length?row.missing.length+" corrections needed":"Ready to submit"}</span>
          </summary>
          {row.missing.length>0&&<p className="text-sm mt-3" role="status"><strong>Needs correction:</strong> {row.missing.join(" · ")}</p>}
          {row.notes.length>0&&<p className="text-sm opacity-70 mt-3">{row.notes.join(" ")}</p>}
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            {EDIT_FIELDS.map(({name,label,required,options})=><label key={name} className="text-sm block">
              <span>{label}{required?" *":""}</span>
              {options?
                <select value={row.values[name]} onChange={event=>edit(row.id,name,event.target.value)} disabled={busy} className="gth-glass bg-[var(--card)] rounded-lg w-full p-2.5 mt-1.5">
                  <option value="">Not supplied</option>{options.map(item=><option key={item} value={item}>{item.replaceAll("_"," ")}</option>)}
                </select>:
                name==="description"?
                  <textarea value={row.values[name]} maxLength={5000} rows={4} disabled={busy} onChange={event=>edit(row.id,name,event.target.value)} className="gth-glass rounded-lg w-full p-2.5 mt-1.5"/>:
                  <input value={row.values[name]} maxLength={name==="location"?250:name==="title"?180:80} disabled={busy} onChange={event=>edit(row.id,name,event.target.value)} className="gth-glass rounded-lg w-full p-2.5 mt-1.5"/>
              }
            </label>)}
          </div>
        </details>)}
      </div>
      <div className="gth-glass p-5 rounded-2xl mt-6">
        <h3 className="font-semibold">Submit selected properties for administrator review</h3>
        <p className="text-sm opacity-75 mt-2">Only complete records can be submitted. You remain responsible for accuracy, listing authority and rights. Submission does not equal verification, public display or buyer enquiries.</p>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <label className="text-sm">Your relationship to these properties *
            <select value={role} onChange={event=>setRole(event.target.value)} disabled={busy} className="gth-glass bg-[var(--card)] rounded-xl p-3 w-full mt-2">
              <option value="">Select relationship</option><option value="developer">Developer / promoter</option><option value="agent">Authorized agent / channel partner</option><option value="owner">Property owner</option><option value="other">Other authorized submitter</option>
            </select>
          </label>
          {role==="agent"&&<label className="text-sm">MahaRERA agent registration (required for India)
            <input value={agentNumber} onChange={event=>setAgentNumber(event.target.value)} maxLength={80} disabled={busy} placeholder="A followed by 11 digits" className="gth-glass rounded-xl p-3 w-full mt-2"/>
          </label>}
        </div>
        <label className="flex gap-3 text-sm items-start mt-4"><input className="mt-1" type="checkbox" checked={authority} disabled={busy} onChange={event=>setAuthority(event.target.checked)}/><span>I own these listings or am authorized by their owners/developers to submit them.</span></label>
        <label className="flex gap-3 text-sm items-start mt-3"><input className="mt-1" type="checkbox" checked={detailsConfirmed} disabled={busy} onChange={event=>setDetailsConfirmed(event.target.checked)}/><span>I have reviewed the selected properties and understand that each listing requires independent approval and approved photographs for public display.</span></label>
        <button type="button" disabled={busy||!selected.length||!role||!authority||!detailsConfirmed} onClick={()=>{void submit();}}
          className="gth-btn-gold rounded-xl px-6 py-3 min-h-11 mt-5">
          Submit {selected.length} {selected.length===1?"property":"properties"} for review
        </button>
      </div>
    </div>}
    <div className="mt-4 text-xs opacity-70 flex gap-2 items-start">
      <FileSpreadsheet size={15} aria-hidden="true"/><span>Excel/CSV catalogues can contain up to 100 individual records. Text-based PDFs are extracted page-by-page; layouts with several projects on a page need manual correction. No paid OCR or AI credits are used.</span>
      <FileText size={15} aria-hidden="true" className="shrink-0"/>
    </div>
  </section>;
}
