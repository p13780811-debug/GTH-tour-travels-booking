"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, CheckCircle2, ClipboardCheck,
  Download, FilePenLine, FileText, Globe2, HelpCircle, LockKeyhole, Save,
  ShieldAlert, Sparkles, Upload, XCircle
} from "lucide-react";
import {supabase} from "@/lib/supabase";
import {
  buildBidPacket, EMPTY_PROFILE, EMPTY_REQUIREMENTS, evaluateEligibility,
  type BidderProfile, type TenderRequirements
} from "@/lib/tender/eligibility";
import {safeTenderSource} from "@/lib/tender/catalog";
import {EMPTY_PREPARATION,PREBID_CHECKS,parsePreparation,deriveReadiness} from "@/lib/tender/workflow-state";

type Notice={id:string;title:string;buyer:string;source_reference:string;source_url:string;
  eligibility_requirements:TenderRequirements;requirements_verified:boolean;deadline_at:string};
type Saved={id:string;tender_id:string|null;tender_title:string;
  notice_details?:{title:string;buyer:string;source_reference:string;source_url:string;preparation?:unknown};
  readiness?:{status:string;soon:boolean;expired:boolean;blockers:string[]};
  official_notice_changed?:boolean;current_deadline?:string|null;source_accessible_in_catalog?:boolean;
  bidder_profile:BidderProfile;
  requirement_answers:TenderRequirements;draft_text:string;updated_at:string};
const steps=["Tender notice","Business profile","Eligibility conditions","Eligibility result","Documents","Pre-bid & site attendance","Prepare application"] as const;
const textList=(s:string)=>s.split(/[\n,;]/).map(v=>v.trim()).filter(Boolean);
const textInput="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--gold)]";
const fieldLabel="block text-xs font-semibold text-[var(--text-soft)]";
const genericDocs=[
 "Business registration or incorporation proof",
 "Tax registration, if requested by the authority",
 "Financial statements / turnover proof, if requested",
 "Past performance and experience references",
 "Authorised signatory and declaration forms",
];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function safeFileName(s:string){return s.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"tender";}

export default function TenderAssistant({initialTender}:{initialTender:Notice|null}){
  const [step,setStep]=useState(0);
  const [profile,setProfile]=useState<BidderProfile>({...EMPTY_PROFILE});
  const [req,setReq]=useState<TenderRequirements>({...EMPTY_REQUIREMENTS,...(initialTender?.eligibility_requirements||{})});
  const [criteriaVerified,setCriteriaVerified]=useState(Boolean(initialTender?.requirements_verified));
  const [notice,setNotice]=useState({
    id:initialTender?.id||"",title:initialTender?.title||"",buyer:initialTender?.buyer||"",
    source_reference:initialTender?.source_reference||"",source_url:initialTender?.source_url||""
  });
  const [checklist,setChecklist]=useState<string[]>([]);
  // No file contents are read, sent to AI, uploaded or persisted.
  const [documentNames,setDocumentNames]=useState<{name:string,size:number}[]>([]);
  const [documentWarning,setDocumentWarning]=useState("");
  const [prebidReviewed,setPrebidReviewed]=useState<string[]>([]);
  const [officialReviewedAt,setOfficialReviewedAt]=useState<string|null>(null);
  const [selfReportedSubmissionAt,setSelfReportedSubmissionAt]=useState<string|null>(null);
  const [currentDeadline,setCurrentDeadline]=useState<string|null>(initialTender?.deadline_at??null);
  const [sourceChanged,setSourceChanged]=useState(false);
  const prebidQuestions=PREBID_CHECKS;
  function stageLocalFiles(selected:FileList|null){
    const incoming=Array.from(selected??[]).slice(0,10);
    const safe=incoming.filter(f=>/\.(pdf|docx|xlsx|png|jpe?g)$/i.test(f.name)&&f.size>0&&f.size<=10*1024*1024);
    setDocumentNames(safe.map(f=>({name:f.name.slice(0,140),size:f.size})));
    setDocumentWarning(safe.length!==incoming.length||(selected?.length??0)>10
      ?"Some files were excluded: use PDF, DOCX, XLSX, JPG or PNG under 10 MB.":"");
  }
  const [draft,setDraft]=useState("");
  const [question,setQuestion]=useState("");
  const [language,setLanguage]=useState<"en"|"hi-Latn">("hi-Latn");
  const [aiConsent,setAiConsent]=useState(false);
  const [clauses,setClauses]=useState("");
  const [extractBusy,setExtractBusy]=useState(false);
  const [extractMessage,setExtractMessage]=useState("");
  const [aiBusy,setAiBusy]=useState(false);
  const [aiReply,setAiReply]=useState("");
  const [noticeMessage,setNoticeMessage]=useState("");
  const [saveBusy,setSaveBusy]=useState(false);
  const [savedId,setSavedId]=useState<string|null>(null);
  const [savedRows,setSavedRows]=useState<Saved[]>([]);
  const [email,setEmail]=useState("");
  const [authMessage,setAuthMessage]=useState("");
  const report=useMemo(()=>evaluateEligibility(profile,req,criteriaVerified),[profile,req,criteriaVerified]);
  const requiredDocs=req.required_documents?.length?req.required_documents:genericDocs;
  const sourceUrl=safeTenderSource(notice.source_url);
  const preparation={
    ...EMPTY_PREPARATION,
    checked_documents:checklist,
    checked_prebid:prebidReviewed,
    notice_reviewed_at:officialReviewedAt,
    external_submission:selfReportedSubmissionAt?"user_reported" as const:"not_reported" as const,
    external_submission_recorded_at:selfReportedSubmissionAt,
  };
  const readiness=deriveReadiness(preparation,criteriaVerified,currentDeadline);
  function updateProfile(key:keyof BidderProfile,value:string){setProfile(p=>({...p,[key]:value}));}
  function updateReq(next:Partial<TenderRequirements>){
    setReq(prev=>({...prev,...next}));setCriteriaVerified(false);
    setChecklist([]);setSelfReportedSubmissionAt(null);
  }
  async function getToken(){
    const {data,error}=await supabase.auth.getSession();
    if(error||!data.session?.access_token)throw new Error("Sign in first to save private tender drafts.");
    return data.session.access_token;
  }
  function generateDraft(){
    setDraft(buildBidPacket(profile,notice,req,report));
    setStep(6);
    setNoticeMessage("Editable application preparation draft generated. Review all statements before using it.");
  }
  async function askAI(mode:"guide"|"draft"){
    if(!aiConsent){setAiReply("Please opt in before sending limited tender details to the AI provider.");return;}
    if(!question.trim()&&mode==="guide"){setAiReply("Ask a question first.");return;}
    setAiBusy(true);setAiReply("");
    try{
      const context={
        tender:{title:notice.title,buyer:notice.buyer,reference:notice.source_reference},
        requirements:req,screening:report.status,
        bidder:{name:profile.business_name,country:profile.business_country,experience:profile.years_experience,
          turnover:profile.annual_turnover,currency:profile.turnover_currency,
          registrations:profile.registrations,capabilities:profile.capability_statement},
        // No credentials, identity document content, bank account or uploads sent.
      };
      const r=await fetch("/api/tender/assistant",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode,language,context,message:question.trim()||
          "Explain in simple steps how to improve this unsubmitted cover letter and the mandatory checks. Never claim a filing."})});
      const data=await r.json();
      if(!r.ok)throw new Error(data.error||"AI service unavailable");
      setAiReply(data.reply||"No guidance returned.");
    }catch(e){setAiReply(e instanceof Error?e.message:"AI coach unavailable.");}
    finally{setAiBusy(false);}
  }
  async function extractClauses(){
    if(!aiConsent){setExtractMessage("Please consent before sending pasted conditions to the AI provider.");return;}
    setExtractBusy(true);setExtractMessage("");
    try{
      const r=await fetch("/api/tender/extract",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({clauses})});
      const data=await r.json();
      if(!r.ok)throw new Error(data.error||"Could not extract requirements.");
      setReq({...EMPTY_REQUIREMENTS,...data.requirements});
      setCriteriaVerified(false);
      setExtractMessage("Draft conditions extracted. Review each threshold, attachment and exception below against the official document. No eligibility decision has been made.");
    }catch(e){setExtractMessage(e instanceof Error?e.message:"AI extraction unavailable.");}
    finally{setExtractBusy(false);}
  }
  async function saveDraft(){
    setSaveBusy(true);setAuthMessage("");
    try{
      const token=await getToken();
      const r=await fetch("/api/tender/workspaces",{method:"POST",headers:{
        "Content-Type":"application/json","Authorization":`Bearer ${token}`
      },body:JSON.stringify({
        id:savedId,title:notice.title,tenderId:UUID.test(notice.id)?notice.id:null,
        notice:{title:notice.title,buyer:notice.buyer,source_reference:notice.source_reference,source_url:notice.source_url,preparation},
        profile,requirements:req,draft
      })});
      const body=await r.json();if(!r.ok)throw new Error(body.error||"Could not save draft");
      setSavedId(body.id);
      if(body.source_revalidation_required){
        setOfficialReviewedAt(null);setChecklist([]);setPrebidReviewed([]);setSourceChanged(true);
      }
      setAuthMessage(body.source_revalidation_required
        ?"Official source changed: previous document and attendance checks were reset. Review the updated notice and resave."
        :"Preparation progress, document checks and attendance review saved privately. No government bid was submitted.");
    }catch(e){setAuthMessage(e instanceof Error?e.message:"Unable to save.");}
    finally{setSaveBusy(false);}
  }
  async function loadList(){
    setSaveBusy(true);setAuthMessage("");
    try{
      const token=await getToken();
      const r=await fetch("/api/tender/workspaces",{headers:{"Authorization":`Bearer ${token}`},cache:"no-store"});
      const body=await r.json();if(!r.ok)throw new Error(body.error||"Could not load drafts");
      setSavedRows(body.items||[]);setAuthMessage("Private workspace loaded.");
    }catch(e){setAuthMessage(e instanceof Error?e.message:"Unable to load drafts.");}
    finally{setSaveBusy(false);}
  }
  function openSaved(row:Saved){
    setSavedId(row.id);setProfile({...EMPTY_PROFILE,...row.bidder_profile});
    setReq({...EMPTY_REQUIREMENTS,...row.requirement_answers});setCriteriaVerified(false);
    setNotice(prev=>({...prev,...(row.notice_details||{}),title:row.tender_title||prev.title,id:row.tender_id||""}));
    setDraft(row.draft_text||"");setStep(6);setDocumentNames([]);
    let state=EMPTY_PREPARATION;
    try{state=parsePreparation(row.notice_details?.preparation??EMPTY_PREPARATION)}catch{}
    setChecklist(state.checked_documents);setPrebidReviewed(state.checked_prebid);
    setOfficialReviewedAt(state.notice_reviewed_at);
    setSelfReportedSubmissionAt(state.external_submission==="user_reported"?state.external_submission_recorded_at:null);
    setCurrentDeadline(row.current_deadline??state.deadline_snapshot);
    setSourceChanged(Boolean(row.official_notice_changed));
    setNoticeMessage(row.official_notice_changed
      ?"Official catalog notice has changed since this preparation was saved. Recheck the deadline and every amendment."
      :"Private preparation restored. Verify all current official conditions before bidding.");
  }
  async function requestOtp(){
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setAuthMessage("Enter a valid email address.");return;}
    setSaveBusy(true);setAuthMessage("");
    try{
      const {error}=await supabase.auth.signInWithOtp({email:email.trim(),
        options:{emailRedirectTo:window.location.href.split("#")[0]}});
      if(error)throw error;
      setAuthMessage("Check email for your sign-in link. Return here, then save your draft.");
    }catch{setAuthMessage("Unable to send a sign-in link at the moment.");}
    finally{setSaveBusy(false);}
  }
  function downloadDraft(){
    if(!draft.trim())return;
    const blob=new Blob([draft],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`gth-tender-${safeFileName(notice.source_reference)}-draft.txt`;
    a.click();URL.revokeObjectURL(url);
  }
  return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <Link href="/tender" className="inline-flex min-h-10 items-center gap-2 text-sm text-[var(--text-soft)]">
          <ArrowLeft size={16}/> Tender discovery
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
          GTH PRO · Tender Preparation Assistant
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Prepare your tender, one step at a time.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
          Check your stated eligibility, find missing documents and prepare an editable bid response.
          AI guidance is optional. Your completed packet is not a submission to any government portal.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-xs text-[var(--text-soft)]">
          <ShieldAlert size={15} aria-hidden="true"/> Never enter passwords, OTPs, Aadhaar/PAN, bank account details or confidential prices here.
        </div>
      </div>
    </section>
    <div className="mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <nav aria-label="Tender assistant steps" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {steps.map((label,i)=><button key={label} type="button" onClick={()=>{setStep(i);setNoticeMessage("");}}
          aria-current={step===i?"step":undefined}
          className={`inline-flex min-h-12 shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${step===i?"border-[var(--gold)] bg-[var(--card)] text-[var(--text)]":"border-[var(--border)] bg-[var(--bg)] text-[var(--text-soft)] hover:border-[var(--gold)]"}`}>
          <span className="text-xs text-[var(--gold)]">0{i+1}</span> {label}
        </button>)}
      </nav>
      <div className="min-w-0 space-y-5">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">Step {step+1} of {steps.length}</p>
          <h2 className="mt-2 text-2xl font-semibold">{steps[step]}</h2>
          {step===0&&<div className="mt-6 space-y-4">
            <p className="text-sm leading-7 text-[var(--text-soft)]">Start with the exact tender notice. If you opened this from a reviewed GTH PRO listing, basic details are already filled.</p>
            <label className={fieldLabel}>Tender title
              <input className={textInput} maxLength={240} value={notice.title} onChange={e=>setNotice(p=>({...p,title:e.target.value}))} placeholder="Exact title from official notice"/></label>
            <label className={fieldLabel}>Issuing authority
              <input className={textInput} maxLength={180} value={notice.buyer} onChange={e=>setNotice(p=>({...p,buyer:e.target.value}))} placeholder="Department / buyer"/></label>
            <label className={fieldLabel}>Tender reference
              <input className={textInput} maxLength={160} value={notice.source_reference} onChange={e=>setNotice(p=>({...p,source_reference:e.target.value}))} placeholder="Official reference number"/></label>
            <label className={fieldLabel}>Official notice URL
              <input className={textInput} maxLength={2048} value={notice.source_url} onChange={e=>setNotice(p=>({...p,source_url:e.target.value}))} placeholder="https://..."/></label>
            <p className="text-xs leading-6 text-[var(--text-soft)]">
              {initialTender?"This record comes from the public tender catalog. Confirm the latest amendments.":"You entered these details manually; GTH PRO has not verified the notice."}
            </p>
            {sourceUrl&&<a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--text)]">Open original notice <ArrowRight size={16}/></a>}
            <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm">
              <input type="checkbox" checked={Boolean(officialReviewedAt)}
                onChange={e=>setOfficialReviewedAt(e.target.checked?new Date().toISOString():null)}
                className="size-4 accent-amber-600"/>
              I personally checked the current official notice and corrigenda (self-declaration, not GTH verification).
            </label>
            {sourceChanged?<p role="alert" className="rounded-xl border border-[var(--gold)] p-4 text-sm font-semibold">
              Official tender data was updated since your saved preparation. Review the new deadline, amendments and eligibility again.
            </p>:null}
            {currentDeadline?<p className="text-xs text-[var(--text-soft)]">Current catalog deadline (UTC): {new Date(currentDeadline).toLocaleString("en-GB",{timeZone:"UTC"})}</p>:null}
          </div>}
          {step===1&&<div className="mt-6">
            <p className="mb-5 text-sm leading-7 text-[var(--text-soft)]">Enter only general business facts. Use verifiable figures and exact names of registrations.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["business_name","Business / organisation name","Company name"],
                ["contact_name","Contact person (optional)","Contact name"],
                ["business_country","Registered country (ISO-2)","IN"],
                ["years_experience","Years of relevant experience","5"],
                ["annual_turnover","Annual turnover","1000000"],
                ["turnover_currency","Turnover currency (ISO-3)","INR"],
              ] as const).map(([key,label,placeholder])=><label key={key} className={fieldLabel}>{label}
                <input className={textInput} placeholder={placeholder} maxLength={key==="business_name"?160:key==="contact_name"?120:24}
                  value={profile[key]} onChange={e=>updateProfile(key,e.target.value)}/></label>)}
            </div>
            <label className={fieldLabel+" mt-5"}>Registrations held (one per line)
              <textarea rows={3} className={textInput} maxLength={1500} value={profile.registrations} onChange={e=>updateProfile("registrations",e.target.value)} placeholder="Enter labels only, not licence numbers or ID scans"/></label>
            <label className={fieldLabel+" mt-5"}>Documents available (one per line)
              <textarea rows={3} className={textInput} maxLength={1500} value={profile.available_documents} onChange={e=>updateProfile("available_documents",e.target.value)} placeholder="Company registration proof, audited statements..."/></label>
            <label className={fieldLabel+" mt-5"}>Your capabilities / relevant work
              <textarea rows={4} className={textInput} maxLength={3000} value={profile.capability_statement} onChange={e=>updateProfile("capability_statement",e.target.value)} placeholder="Describe actual completed work, services and strengths. No unsupported claims."/></label>
          </div>}
          {step===2&&<div className="mt-6 space-y-4">
            <p className="text-sm leading-7 text-[var(--text-soft)]">Only official tender conditions can establish eligibility. Enter the actual requirements from its latest published documents; do not guess thresholds.</p>
            <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <p className="text-sm font-semibold">Optional: extract requirements from tender text with AI</p>
              <p className="text-xs leading-6 text-[var(--text-soft)]">Paste the eligibility section copied from an official document. Do not paste identity proofs, personal identifiers, bank details, passwords or confidential pricing. Extraction may miss clauses.</p>
              <label className={fieldLabel}>Official eligibility clauses (text only)
                <textarea rows={5} className={textInput} maxLength={10000} value={clauses} onChange={e=>setClauses(e.target.value)} placeholder="Paste official eligibility paragraphs here..."/></label>
              <label className="flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-amber-600" checked={aiConsent} onChange={e=>setAiConsent(e.target.checked)}/>
                I agree to send my pasted eligibility text to the Gemini AI provider. This does not verify it.
              </label>
              <button type="button" disabled={!aiConsent||extractBusy||clauses.trim().length<60} onClick={extractClauses}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold disabled:opacity-40">
                <Sparkles size={16}/> {extractBusy?"Extracting…":"Extract draft requirements"}
              </button>
              {extractMessage&&<p role="status" className="text-xs leading-6 text-[var(--text-soft)]">{extractMessage}</p>}
            </div>
            <div className={`rounded-xl border p-4 text-sm ${criteriaVerified?"border-[var(--gold)]":"border-[var(--border)]"}`}>
              {criteriaVerified?"These conditions were marked reviewed in the tender catalog. Editing them changes the comparison to unverified manual criteria.":"Manual or unverified conditions: any result will require independent review."}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={fieldLabel}>Minimum years of experience
                <input className={textInput} type="number" min="0" max="150" value={req.min_experience_years??""} onChange={e=>updateReq({min_experience_years:e.target.value===""?null:Number(e.target.value)})} placeholder="Leave empty if not stated"/></label>
              <label className={fieldLabel}>Minimum annual turnover
                <input className={textInput} type="number" min="0" value={req.min_annual_turnover??""} onChange={e=>updateReq({min_annual_turnover:e.target.value===""?null:Number(e.target.value)})} placeholder="Only if officially specified"/></label>
              <label className={fieldLabel}>Turnover currency
                <input className={textInput} maxLength={3} value={req.turnover_currency||""} onChange={e=>updateReq({turnover_currency:e.target.value.toUpperCase()})} placeholder="INR"/></label>
              <label className={fieldLabel}>Eligible business countries (ISO-2 codes)
                <input className={textInput} value={(req.eligible_countries||[]).join(", ")} onChange={e=>updateReq({eligible_countries:textList(e.target.value).map(x=>x.toUpperCase())})} placeholder="IN, AE — only when restricted"/></label>
            </div>
            <label className={fieldLabel}>Mandatory registrations (one per line)
              <textarea rows={3} className={textInput} value={(req.required_registrations||[]).join("\n")} onChange={e=>updateReq({required_registrations:textList(e.target.value)})} placeholder="Exact names from the notice"/></label>
            <label className={fieldLabel}>Mandatory documents (one per line)
              <textarea rows={4} className={textInput} value={(req.required_documents||[]).join("\n")} onChange={e=>updateReq({required_documents:textList(e.target.value)})} placeholder="Exact document names required"/></label>
            <p className="text-xs leading-6 text-[var(--text-soft)]">A missing requirement does not mean that requirement is waived. Special technical criteria, financial history, consortium rules and EMD can require manual review.</p>
          </div>}
          {step===3&&<div className="mt-6 space-y-5">
            <div role="status" className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Screening result — not a final verdict</p>
              <h3 className="mt-2 text-xl font-semibold">{
                report.status==="potential_match"?"Potential match — verify evidence":
                report.status==="not_meeting_stated_conditions"?"Some stated conditions not met":
                report.status==="insufficient_criteria"?"Official eligibility criteria not provided":
                "Needs human and official document review"
              }</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{report.warning}</p>
            </div>
            {report.checks.length?report.checks.map((c,i)=><article key={i} className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-4">
              {c.result==="meets"?<CheckCircle2 className="mt-1 shrink-0 text-green-600" size={19}/>:
                c.result==="gap"?<XCircle className="mt-1 shrink-0 text-red-500" size={19}/>:
                <HelpCircle className="mt-1 shrink-0 text-[var(--gold)]" size={19}/>}
              <div><p className="text-sm font-semibold">{c.label} — {c.result==="meets"?"Declared match":c.result==="gap"?"Gap":"Unknown"}</p><p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">{c.detail}</p></div>
            </article>):<p className="text-sm leading-7 text-[var(--text-soft)]">No official eligibility conditions available yet. Open the notice and enter exact criteria in Step 3.</p>}
            <button type="button" onClick={()=>setStep(2)} className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">Review conditions</button>
          </div>}
          {step===4&&<div className="mt-6 space-y-4">
            <p className="text-sm leading-7 text-[var(--text-soft)]">{req.required_documents?.length?"Checklist based on the entered tender requirements.":"General preparation suggestions only, not a list of mandatory documents for this tender."} Check off items when you have independently reviewed them.</p>
            {requiredDocs.map(name=><label key={name} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-amber-600" checked={checklist.includes(name)} onChange={e=>setChecklist(prev=>e.target.checked?[...prev,name]:prev.filter(x=>x!==name))}/>
              <span className="text-sm leading-6">{name}</span>
            </label>)}
            <p className="text-sm text-[var(--text-soft)]">{checklist.filter(n=>requiredDocs.includes(n)).length} of {requiredDocs.length} reviewed on this device (not uploaded).</p>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <p className="text-sm font-semibold">Stage tender-specific files locally (optional)</p>
              <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">
                No upload, file processing, identity verification or AI transfer. File names are only displayed in this tab.
                Compare them with the latest authority-issued forms yourself.
              </p>
              <input type="file" multiple accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" className="mt-4 block w-full text-sm"
                onChange={e=>{stageLocalFiles(e.target.files);e.target.value="";}}/>
              {documentWarning&&<p role="alert" className="mt-2 text-xs text-[var(--text-soft)]">{documentWarning}</p>}
              <p className="mt-3 text-xs text-[var(--text-soft)]">{documentNames.length} files staged on this device (not saved).</p>
              {documentNames.length>0&&<ul className="mt-2 space-y-1 text-xs text-[var(--text-soft)]">
                {documentNames.map((file,i)=><li key={i} className="break-all">{file.name} ({Math.round(file.size/1024)} KB)</li>)}
              </ul>}
            </div>
          </div>}
          {step===5&&<div className="mt-6 space-y-4">
            <p className="text-sm leading-7 text-[var(--text-soft)]">
              Meeting attendance, site visit, EMD and clarifications are tender-specific.
              None is treated as mandatory unless the latest official tender states so. Mark checks only after reviewing that notice.
            </p>
            {prebidQuestions.map(question=><label key={question.id} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <input type="checkbox" className="mt-1 size-4 accent-amber-600"
                checked={prebidReviewed.includes(question.id)}
                onChange={e=>setPrebidReviewed(a=>e.target.checked?[...a,question.id]:a.filter(item=>item!==question.id))}/>
              <span className="text-sm leading-6">{question.label}</span>
            </label>)}
            <p role="status" className="text-xs text-[var(--text-soft)]">{prebidReviewed.length} of {prebidQuestions.length} checked locally.
              Attendance has not been verified or submitted to the issuing authority.</p>
            {sourceUrl&&<a className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline" href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
              Check original authority notice <ArrowRight size={16}/>
            </a>}
          </div>}
          {step===6&&<div className="mt-6 space-y-5">
            <p className="text-sm leading-7 text-[var(--text-soft)]">Auto-fill a working response from your declared answers. Missing facts stay clearly marked; you must verify and edit it before using any official portal.</p>
            <button type="button" onClick={generateDraft} className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
              <FilePenLine size={17}/> Generate editable bid draft
            </button>
            <label className={fieldLabel}>Your application preparation draft
              <textarea rows={17} className={textInput+" font-mono text-xs leading-6"} value={draft} maxLength={12000} onChange={e=>setDraft(e.target.value)} placeholder="Click Generate editable bid draft"/></label>
            <div className="flex flex-wrap gap-3">
              <button disabled={!draft.trim()} type="button" onClick={downloadDraft} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold disabled:opacity-40">
                <Download size={16}/> Download .txt draft
              </button>
              <button disabled={!draft.trim()} type="button" onClick={async()=>{try{await navigator.clipboard.writeText(draft);setNoticeMessage("Draft copied.");}catch{setNoticeMessage("Copy unavailable; select the text manually.");}}} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold disabled:opacity-40">
                <ClipboardCheck size={16}/> Copy draft
              </button>
              {sourceUrl&&<a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">Open official portal <ArrowRight size={16}/></a>}
            </div>
            <p className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-xs leading-6 text-[var(--text-soft)]">
              No submission, fee payment or document upload is performed here. Final entry and submission on the official portal require your review and explicit action.
            </p>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <p className="font-semibold">Live preparation readiness — {readiness.status.replaceAll("-"," ")}</p>
              {readiness.blockers.length>0?<ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--text-soft)]">
                {readiness.blockers.map(item=><li key={item}>{item}</li>)}
              </ul>:<p className="mt-2 text-xs text-[var(--text-soft)]">Checklist prepared for your final independent authority review.</p>}
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" className="mt-1 size-4 accent-amber-600" checked={Boolean(selfReportedSubmissionAt)}
                  onChange={e=>setSelfReportedSubmissionAt(e.target.checked?new Date().toISOString():null)}/>
                I personally submitted this bid at the official portal. Save as my own report, NOT a GTH-confirmed submission.
              </label>
            </div>
          </div>}
          {readiness.soon&&!readiness.expired?<p role="alert" className="mt-4 rounded-xl border border-[var(--gold)] p-4 text-sm">
            Deadline is approaching within 72 hours. Recheck the official portal immediately; the countdown may not include corrigenda.
          </p>:null}
          {noticeMessage&&<p role="status" className="mt-5 rounded-xl border border-[var(--border)] p-3 text-sm">{noticeMessage}</p>}
          <div className="mt-7 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
            <button type="button" disabled={step===0} onClick={()=>{setStep(Math.max(0,step-1));setNoticeMessage("");}} className="min-h-11 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold disabled:opacity-30">Back</button>
            <button type="button" disabled={step===steps.length-1} onClick={()=>{setStep(Math.min(steps.length-1,step+1));setNoticeMessage("");}} className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-40">Next step <ArrowRight size={16}/></button>
          </div>
        </section>

        <section aria-labelledby="tender-ai-heading" className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]"><Sparkles size={16}/> Optional AI coach</p>
          <h2 id="tender-ai-heading" className="mt-3 text-xl font-semibold">Ask a question about your next tender step</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">AI explains steps and may suggest wording. It cannot certify eligibility, create documents you do not have, or submit bids. Requires a configured Gemini API key.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <label className={fieldLabel}>Response language
              <select className={textInput} value={language} onChange={e=>setLanguage(e.target.value as "en"|"hi-Latn")}><option value="hi-Latn">Hindi (English letters)</option><option value="en">English</option></select>
            </label>
          </div>
          <label className={fieldLabel+" mt-4"}>Your question
            <textarea rows={3} className={textInput} maxLength={1500} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Mujhe EMD aur technical bid kaise prepare karna hai?"/></label>
          <label className="mt-4 flex items-start gap-3 text-xs leading-6 text-[var(--text-soft)]">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-amber-600" checked={aiConsent} onChange={e=>setAiConsent(e.target.checked)}/>
            I agree to send only the typed business summary, tender conditions and question to the Gemini AI provider for this request. No files are uploaded.
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={aiBusy||!aiConsent||!question.trim()} onClick={()=>askAI("guide")} className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-40"><Sparkles size={16}/> {aiBusy?"Thinking…":"Ask AI Coach"}</button>
            <button type="button" disabled={aiBusy||!aiConsent} onClick={()=>askAI("draft")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold disabled:opacity-40">Get drafting advice</button>
          </div>
          {aiReply&&<div role="status" className="mt-5 whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 text-sm leading-7">{aiReply}</div>}
        </section>

        <section aria-labelledby="save-heading" className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]"><LockKeyhole size={16}/> Private workspace</p>
          <h2 id="save-heading" className="mt-3 text-xl font-semibold">Save and resume your tender preparation</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Optional sign-in. Signed-in drafts and preparation progress are stored in an existing owner-only RLS table. Never add confidential IDs, bank details, passwords or documents. Your current form stays in this browser tab unless you explicitly save.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button disabled={saveBusy} type="button" onClick={saveDraft} className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-50"><Save size={16}/> Save private draft</button>
            <button disabled={saveBusy} type="button" onClick={loadList} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold disabled:opacity-50"><BookOpen size={16}/> Load my saved drafts</button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className={fieldLabel}>Need to sign in? Email address
              <input type="email" className={textInput} maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"/></label>
            <button disabled={saveBusy} type="button" onClick={requestOtp} className="min-h-11 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold disabled:opacity-50">Email sign-in link</button>
          </div>
          {authMessage&&<p role="status" className="mt-4 rounded-xl border border-[var(--border)] p-3 text-sm">{authMessage}</p>}
          {savedRows.length>0&&<div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">Your private drafts</p>
            {savedRows.map(row=><button key={row.id} type="button" onClick={()=>openSaved(row)}
              className="flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border border-[var(--border)] px-4 py-3 text-left text-sm hover:border-[var(--gold)]">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{row.tender_title||"Untitled tender"}</span>
                <span className="mt-1 block text-xs text-[var(--text-soft)]">
                  {row.official_notice_changed?"Source changed — review needed · ":
                    row.readiness?.expired?"Saved deadline expired · ":
                    row.readiness?.soon?"Closing within 72h · ":""}
                  {row.readiness?.status==="user-reported-external-submission"
                    ?"User-reported external submission (unverified)":
                    "Private preparation · "+(row.readiness?.blockers.length??0)+" checks need review"}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-[var(--text-soft)]">Resume →</span>
            </button>)}
          </div>}
        </section>
      </div>
    </div>
  </div>;
}
