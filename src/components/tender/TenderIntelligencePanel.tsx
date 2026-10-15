"use client";

import {useMemo,useState} from "react";
import {buildTenderDeadlineCalendar} from "@/lib/tender/calendar";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BookCheck, BriefcaseBusiness, CalendarClock,
  CheckCircle2, ClipboardCheck, FileCheck2, FileSearch, FileUp,
  HelpCircle, Layers3, ShieldAlert
} from "lucide-react";
import {
  prepareTenderIntelligence,type TenderBriefInput,type ReviewStage
} from "@/lib/tender/intelligence";

type ActiveFile={name:string;size:number;type:string;key:string};
const SIZE_LIMIT=10*1024*1024;
const EXT=/\.(pdf|docx|xlsx|png|jpe?g)$/i;
const copy={
  en:{heading:"Tender Intelligence Workspace",support:"Industry discovery · qualifications · documents · pre-bid attendance",
    preview:"Preparation suggestions from the notice title and summary, not official legal requirements.",
    industries:"Industry signals",signal:"Keyword-based suggestions — verify the actual procurement classification.",
    none:"No reliable industry signal. Read the official technical schedules.",
    official:"Reviewed requirements",missing:"Official structured qualification criteria not yet available",
    mandatory:"Reviewed source requirements",suggested:"Document preparation planner",progress:"Reviewed locally",
    docs:"Local document staging",safe:"Files stay on this device in the current session. Names and sizes are shown for planning only; no upload, malware scan, OCR, or validation occurs.",
    attendance:"Pre-bid attendance & site visits",checks:"Qualification & submission checks",
    verify:"Confirm on official portal",unknown:"Not established by this source data",
    reviewed:"I checked the official notice",upload:"Choose files (PDF, DOCX, XLSX, images; 10 MB each)",
    associate:"Associate staged document",notlinked:"Not associated",staged:"Selected files on this device",
    ready:"Prepared for manual review",notproof:"Checklist progress is not evidence of eligibility, bidder attendance or successful submission.",
    launch:"Start guided eligibility & application",source:"Open official tender notice",new:"Recheck the latest corrigenda and time zone before bidding.",
    rejected:"Unsupported or oversized files were excluded. Use PDF, DOCX, XLSX, JPG or PNG under 10 MB.",
    noFiles:"No local documents selected",manual:"Select a document you reviewed",disclaimer:"GTH PRO never auto-submits bids or certifies qualifications."
  },
  hi:{heading:"टेंडर इंटेलिजेंस वर्कस्पेस",support:"इंडस्ट्री · पात्रता · दस्तावेज़ · प्री-बिड मीटिंग",
    preview:"ये टेंडर के शीर्षक से तैयारी के सुझाव हैं, सरकारी पात्रता शर्तें नहीं।",
    industries:"इंडस्ट्री संकेत",signal:"शब्दों पर आधारित सुझाव — असली कैटेगरी जाँचें।",
    none:"इंडस्ट्री की पुष्टि नहीं हुई। असली नोटिस देखें।",official:"जाँची गई शर्तें",
    missing:"आधिकारिक पात्रता की संरचित शर्तें उपलब्ध नहीं हैं",
    mandatory:"आधिकारिक शर्तें",suggested:"दस्तावेज़ तैयारी सूची",progress:"इस डिवाइस पर समीक्षा",
    docs:"लोकल दस्तावेज़ तैयारी",safe:"फाइल इस डिवाइस पर ही रहती है। अपलोड, OCR या दस्तावेज़ सत्यापन नहीं होता।",
    attendance:"प्री-बिड मीटिंग और साइट विजिट",checks:"पात्रता और सबमिशन जाँच",
    verify:"आधिकारिक पोर्टल पर जाँचें",unknown:"इस डेटा से पुष्टि नहीं हुई",
    reviewed:"आधिकारिक नोटिस जाँचा",upload:"फाइल चुनें (PDF, DOCX, XLSX, फोटो; अधिकतम 10 MB)",
    associate:"दस्तावेज़ जोड़ें",notlinked:"कोई फाइल नहीं",staged:"इसी डिवाइस पर चुनी गई फाइलें",
    ready:"रिव्यू के लिए तैयार",notproof:"चेकलिस्ट पूरी होना पात्रता या टेंडर जमा होने का प्रमाण नहीं है।",
    launch:"पात्रता और आवेदन सहायक खोलें",source:"असली टेंडर नोटिस देखें",new:"समय सीमा और बदलाव असली पोर्टल से जाँचें।",
    rejected:"कुछ फाइल फॉर्मेट/साइज मान्य नहीं हैं।",noFiles:"कोई फाइल नहीं चुनी",manual:"समीक्षा की गई फाइल चुनें",
    disclaimer:"GTH PRO टेंडर अपने आप जमा नहीं करता।"
  }
} as const;
type Locale=keyof typeof copy;
export default function TenderIntelligencePanel({notice,sourceUrl,language="en",tenderId}:{
  notice:TenderBriefInput;sourceUrl:string|null;language?:string;tenderId:string
}){
  const t=copy[(language==="hi"?"hi":"en") as Locale];
  const intelligence=useMemo(()=>prepareTenderIntelligence(notice),[notice]);
  const [reviewed,setReviewed]=useState<Record<string,boolean>>({});
  const [files,setFiles]=useState<ActiveFile[]>([]);
  const [links,setLinks]=useState<Record<string,string>>({});
  const [fileError,setFileError]=useState("");
  const allSteps=[
    ...intelligence.tasks.map(t=>t.id),
    ...intelligence.attendance.map(t=>t.id),
    ...intelligence.bidSteps.map(t=>t.id)
  ];
  const completed=allSteps.filter(id=>reviewed[id]).length;
  function selectFiles(input:FileList|null){
    const chosen=Array.from(input??[]).slice(0,10);
    const allowed=chosen.filter(f=>EXT.test(f.name)&&f.size>0&&f.size<=SIZE_LIMIT);
    setFileError(allowed.length!==chosen.length||(input?.length??0)>10?t.rejected:"");
    setFiles(allowed.map((f,index)=>({
      name:f.name.slice(0,140),size:f.size,type:f.type,key:String(index)+"-"+f.name+"-"+f.size
    })));
    setLinks({});
  }
  function checkbox(task:{id:string;title:string;description?:string;source?:"reviewed"|"suggested";required?:boolean;purpose?:string}){
    const id=task.id;
    return <div key={id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={Boolean(reviewed[id])} onChange={e=>setReviewed(s=>({...s,[id]:e.target.checked}))}
          className="mt-1 size-4 shrink-0 accent-amber-600" aria-label={t.reviewed+": "+task.title}/>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {task.title}
            {task.source==="reviewed"&&task.required?<span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-soft)]">{t.official}</span>:null}
          </span>
          <span className="mt-1 block text-xs leading-6 text-[var(--text-soft)]">{task.purpose??task.description}</span>
        </span>
      </label>
      {files.length&&"purpose" in task?<div className="mt-3 pl-7">
        <label className="block text-xs font-medium text-[var(--text-soft)]">{t.associate}
          <select aria-label={t.associate+": "+task.title} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-sm text-[var(--text)]"
            value={links[id]??""} onChange={e=>setLinks(prev=>({...prev,[id]:e.target.value}))}>
            <option value="">{t.notlinked}</option>
            {files.map(f=><option key={f.key} value={f.key}>{f.name}</option>)}
          </select>
        </label>
      </div>:null}
    </div>;
  }
  function saveDeadlineReminder(){
    const ics=buildTenderDeadlineCalendar({
      id:tenderId,title:notice.title,deadline_at:notice.deadline_at,
      source_name:notice.source_name,source_url:sourceUrl??""
    });
    if(!ics)return;
    const file=new Blob([ics],{type:"text/calendar;charset=utf-8"});
    const objectUrl=URL.createObjectURL(file);
    const anchor=document.createElement("a");
    anchor.href=objectUrl;
    anchor.download="gth-tender-"+tenderId.replace(/[^a-z0-9-]/gi,"").slice(0,50)+"-deadline.ics";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }
  function stage(title:string,items:ReviewStage[]){
    return <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{t.unknown}. {t.verify}.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{items.map(checkbox)}</div>
    </section>;
  }
  return <section aria-labelledby="procurement-intelligence" className="mt-12 space-y-6">
    <div>
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold)]">
        <BadgeCheck size={16} aria-hidden="true"/> GTH PRO · Procurement Intelligence
      </p>
      <h2 id="procurement-intelligence" className="mt-3 text-2xl font-semibold">{t.heading}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{t.support}</p>
      <p className="mt-1 text-xs text-[var(--text-soft)]">{t.preview}</p>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <h3 className="inline-flex items-center gap-2 text-lg font-semibold"><Layers3 size={19} aria-hidden="true"/>{t.industries}</h3>
        {intelligence.signals.length?<div className="mt-5 flex flex-wrap gap-2">
          {intelligence.signals.map(signal=><span key={signal.id} className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold">{signal.label}</span>)}
        </div>:<p className="mt-4 text-sm text-[var(--text-soft)]">{t.none}</p>}
        <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">{t.signal}</p>
      </article>
      <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <h3 className="inline-flex items-center gap-2 text-lg font-semibold"><BriefcaseBusiness size={19} aria-hidden="true"/>{t.official}</h3>
        <p className="mt-4 text-sm font-semibold">{intelligence.criteriaStatus==="officially-reviewed"?t.official:t.missing}</p>
        <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">{t.preview}</p>
      </article>
    </div>
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-lg font-semibold"><ClipboardCheck size={19} aria-hidden="true"/>{t.suggested}</h3>
        <span role="status" className="text-xs font-semibold tabular-nums text-[var(--text-soft)]">{completed} / {allSteps.length} {t.progress}</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--bg)]" role="progressbar"
        aria-label={t.progress} aria-valuenow={completed} aria-valuemin={0} aria-valuemax={allSteps.length}>
        <div className="h-full rounded-full bg-[var(--gold)] transition-[width]" style={{width:(completed/Math.max(1,allSteps.length))*100+"%"}}/>
      </div>
      <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">{t.notproof}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{intelligence.tasks.map(checkbox)}</div>
      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><FileUp size={18} aria-hidden="true"/>{t.docs}</div>
        <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{t.safe}</p>
        <label className="mt-4 block text-xs font-semibold">{t.upload}
          <input type="file" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" multiple
            onChange={e=>{selectFiles(e.target.files);e.target.value="";}}
            className="mt-2 block w-full text-sm file:me-4 file:rounded-xl file:border file:border-[var(--border)] file:bg-[var(--card)] file:px-4 file:py-3 file:font-semibold"/>
        </label>
        {fileError?<p role="alert" className="mt-3 text-xs text-[var(--text-soft)]">{fileError}</p>:null}
        <p className="mt-3 text-xs text-[var(--text-soft)]">{t.staged}: {files.length||t.noFiles}</p>
        {files.length?<ul className="mt-3 space-y-1 text-xs text-[var(--text-soft)]">
          {files.map(f=><li key={f.key} className="break-all"><FileCheck2 size={14} className="me-2 inline" aria-hidden="true"/>{f.name} ({Math.round(f.size/1024)} KB)</li>)}
        </ul>:null}
      </div>
    </article>
    {stage(t.attendance,intelligence.attendance)}
    {stage(t.checks,intelligence.bidSteps)}
    <div className="flex flex-wrap gap-3">
      {intelligence.noticeStatus==="accepting-notices"?<button type="button" onClick={saveDeadlineReminder}
        className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold">
        <CalendarClock size={17} aria-hidden="true"/> Save deadline reminder (.ics)
      </button>:null}
      <Link href={"/tender/assistant?tenderId="+encodeURIComponent(tenderId)}
        className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
        <BookCheck size={17} aria-hidden="true"/>{t.launch} <ArrowRight size={16} aria-hidden="true"/>
      </Link>
      {sourceUrl?<a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow"
        className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold">
        <FileSearch size={17} aria-hidden="true"/>{t.source}<ArrowUpRight size={16} aria-hidden="true"/>
      </a>:null}
    </div>
    <p className="inline-flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]"><ShieldAlert size={16} className="mt-1 shrink-0" aria-hidden="true"/>{t.disclaimer} {t.new}</p>
  </section>;
}
