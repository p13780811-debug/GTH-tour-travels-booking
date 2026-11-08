"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Clock3,ClipboardCheck} from "lucide-react";
import {NEW_PURSUIT,PURSUIT_KEY,parsePursuits,personalMilestones,pursuitCapacity,type PursuitDecision,type PursuitPlan} from "@/lib/tender/pursuit";
export default function TenderPursuitPlanner({id,deadline}:{id:string;deadline:string}){
 const [plan,setPlan]=useState<PursuitPlan>({...NEW_PURSUIT}),[message,setMessage]=useState(""),[ready,setReady]=useState(false);
 useEffect(()=>{try{const p=parsePursuits(localStorage.getItem(PURSUIT_KEY))[id];if(p)setPlan(p);}catch{setMessage("Device storage is unavailable. You can plan for this session.");}setReady(true);},[id]);
 function save(next:PursuitPlan){
  setPlan(next);
  // Always read before writing: unread older plans are never overwritten.
  try{const plans=parsePursuits(localStorage.getItem(PURSUIT_KEY));if(!plans[id]&&Object.keys(plans).length>=40){setMessage("Your 40-plan device limit is reached. This plan remains in this session.");return;}localStorage.setItem(PURSUIT_KEY,JSON.stringify({version:1,plans:{...plans,[id]:next}}));setMessage("Plan saved on this device.");}
  catch{setMessage("Plan kept for this session. Older saved plans have not been overwritten.");}
 }
 const gap=pursuitCapacity(plan),changed=!!plan.deadlineSnapshot&&Date.parse(plan.deadlineSnapshot)!==Date.parse(deadline);
 return <section aria-labelledby="pursuit-heading" className="mt-9 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]"><ClipboardCheck size={16}/>Your bid decision</p>
  <h2 id="pursuit-heading" className="mt-3 text-2xl font-semibold">Is this the right opportunity for your team?</h2>
  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Record your decision, check preparation capacity and work back from the published deadline. Your decision is separate from official eligibility.</p>
  {changed&&<p role="alert" className="mt-4 rounded-xl border border-[var(--border)] p-4 text-sm">The recorded deadline changed since your review. Recheck the notice and your personal targets.</p>}
  <fieldset disabled={!ready} className="mt-5 grid gap-5 md:grid-cols-2">
   <label className="min-w-0 text-sm font-semibold">Your decision<select aria-label="Your decision" className="gth-input mt-2 w-full min-w-0" value={plan.decision} onChange={e=>save({...plan,decision:e.target.value as PursuitDecision})}><option value="review">Still reviewing</option><option value="pursue">Pursue this opportunity</option><option value="hold">Hold — resolve questions</option><option value="decline">No bid this time</option></select></label>
   <div className="grid grid-cols-2 gap-3"><label className="min-w-0 text-sm font-semibold">Preparation hours needed<input inputMode="decimal" type="number" min="0" max="9999" step="0.25" className="gth-input mt-2 w-full min-w-0" value={plan.requiredHours} onChange={e=>save({...plan,requiredHours:e.target.value})}/></label><label className="min-w-0 text-sm font-semibold">Team hours available<input inputMode="decimal" type="number" min="0" max="9999" step="0.25" className="gth-input mt-2 w-full min-w-0" value={plan.availableHours} onChange={e=>save({...plan,availableHours:e.target.value})}/></label></div>
   <label className="min-w-0 text-sm font-semibold md:col-span-2">Private decision notes<textarea className="gth-input mt-2 w-full min-w-0" rows={3} maxLength={600} value={plan.reason} onChange={e=>save({...plan,reason:e.target.value})}/><span className="mt-2 block text-xs font-normal text-[var(--text-soft)]">Device-only notes. Keep bid prices, credentials and personal IDs out of this field.</span></label>
  </fieldset>
  {gap.known&&<p role="status" className="mt-4 text-sm">{gap.gap>0?`Your estimate has a ${gap.gap.toLocaleString("en")} hour preparation gap. Review scope, staffing or optional support.`:"Your entered preparation hours fit the available hours. This does not confirm qualification or delivery capacity."}</p>}
  <h3 className="mt-6 inline-flex items-center gap-2 text-base font-semibold"><Clock3 size={17}/>Personal work-back targets</h3>
  <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Suggested internal targets, not official pre-bid meetings or authority deadlines. Past targets are labelled so you can adjust your plan.</p>
  <ol className="mt-4 grid gap-3 sm:grid-cols-2">{personalMilestones(deadline).map(task=><li key={task.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4"><p className="text-sm font-semibold">{task.label}</p><p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{new Date(task.at).toLocaleString("en",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"})} UTC{!task.upcoming?" · Target already passed":""}</p></li>)}</ol>
  <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={!ready} onClick={()=>save({...plan,deadlineSnapshot:deadline,reviewedAt:new Date().toISOString()})} className="gth-btn inline-flex min-h-11 items-center justify-center">I reviewed this deadline</button><Link prefetch={false} href={`/tender/assistant?tenderId=${id}`} className="gth-btn inline-flex min-h-11 items-center justify-center">Free preparation assistant</Link><Link prefetch={false} href={`/tender/services?service=document_review&tenderId=${id}`} className="gth-btn inline-flex min-h-11 items-center justify-center">Optional document-review quote</Link></div>
  {message&&<p role="status" className="mt-3 text-xs leading-6 text-[var(--text-soft)]">{message}</p>}
 </section>;
}
