"use client";

import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import {Bell,CheckCircle,Construction,ExternalLink,OctagonAlert,RefreshCw,TrafficCone} from "lucide-react";
import TrafficVoice from "./TrafficVoice";
import {supabase} from "@/lib/supabase";
import {mobilityHref,type MobilityCity} from "@/lib/mobility/city";
import {REPORT_KINDS,isReportKind,reportsForZone,trafficCityFor,validTrafficZone,type ReportKind,type TrafficFeed,type TrafficReport,type TrafficZone} from "@/lib/mobility/traffic";
import {TRAFFIC_LANGUAGES,trafficLanguage,trafficLabels,type TrafficLanguage} from "@/lib/mobility/traffic-language";
import {officialTrafficSources} from "@/lib/mobility/traffic-sources";
import {trafficDraft} from "@/lib/mobility/traffic-voice";

const control="gth-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold";
const field="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]";
const icons={jam:TrafficCone,closure:Construction,hazard:OctagonAlert,clear:CheckCircle};
const storageKey="gth:mobility:language";

function readLocal(key:string){
  try{return localStorage.getItem(key);}catch{return null;}
}
function saveLocal(key:string,value:string){
  try{localStorage.setItem(key,value);}catch{}
}

export default function DriverTraffic({city}:{city:MobilityCity}){
  const pilot=trafficCityFor(city);
  const [language,setLanguage]=useState<TrafficLanguage>("en");
  const [feed,setFeed]=useState<TrafficFeed|null>(null);
  const [loadError,setLoadError]=useState(false);
  const [zone,setZone]=useState("");
  const [draftZone,setDraftZone]=useState("");
  const [kind,setKind]=useState<ReportKind|null>(null);
  const [feedback,setFeedback]=useState<keyof ReturnType<typeof trafficLabels>|null>(null);
  const [signedIn,setSignedIn]=useState(false);
  const [email,setEmail]=useState("");
  const [sending,setSending]=useState(false);
  const [following,setFollowing]=useState<string|null>(null);
  const [latest,setLatest]=useState<TrafficReport|null>(null);
  const [ownReport,setOwnReport]=useState<string|null>(null);
  const [,redraw]=useState(0);
  const lastAlert=useRef(0);
  const request=useRef<AbortController|null>(null);
  const labels=trafficLabels(language);
  const sources=officialTrafficSources(city);
  const active=reportsForZone(feed?.reports??[],zone);
  const followKey="gth:mobility:follow:"+pilot;
  const reportKey="gth:mobility:report:"+pilot;
  const draftKey="gth:mobility:draft:"+pilot;
  const zoneName=(item:TrafficZone)=>((pilot==="mumbai"&&["hi","mr"].includes(language))||(pilot==="kolkata"&&language==="bn"))?item.localLabel:item.label;
  const zoneLabel=(id:string)=>{const item=feed?.zones.find(z=>z.id===id);return item?zoneName(item):id;};

  useEffect(()=>{
    setLanguage(trafficLanguage(readLocal(storageKey)??navigator.language));
    if(!pilot)return;
    const saved=readLocal(followKey);
    if(saved!==null){setFollowing(saved);setZone(saved);}
    lastAlert.current=Number(readLocal(followKey+":seen"))||Date.now();
    setOwnReport(readLocal(reportKey)||null);
    const [savedZone,savedKind]=readLocal(draftKey)?.split(":")??[];
    if(validTrafficZone(savedZone))setDraftZone(savedZone);
    if(isReportKind(savedKind))setKind(savedKind);
    let active=true;
    void supabase.auth.getSession().then(({data})=>{if(active)setSignedIn(Boolean(data.session));});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setSignedIn(Boolean(session)));
    return ()=>{active=false;subscription.unsubscribe();};
  },[pilot,followKey,reportKey,draftKey]);

  const refresh=useCallback(async()=>{
    if(!pilot||request.current)return;
    const controller=new AbortController();
    request.current=controller;
    const timeout=window.setTimeout(()=>controller.abort("timeout"),8000);
    try{
      const response=await fetch("/api/mobility/traffic?city="+pilot,{signal:controller.signal});
      if(!response.ok)throw new Error();
      const next=await response.json() as TrafficFeed;
      if(!controller.signal.aborted){setFeed(next);setLoadError(false);}
    }catch{
      if(!controller.signal.aborted||controller.signal.reason==="timeout")setLoadError(true);
    }finally{
      window.clearTimeout(timeout);
      if(request.current===controller)request.current=null;
    }
  },[pilot]);

  useEffect(()=>{
    void refresh();
    return ()=>{request.current?.abort();request.current=null;};
  },[refresh]);

  useEffect(()=>{
    if(following===null)return;
    const visibleRefresh=()=>{if(document.visibilityState==="visible")void refresh();};
    const timer=window.setInterval(visibleRefresh,90000);
    document.addEventListener("visibilitychange",visibleRefresh);
    return ()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",visibleRefresh);};
  },[following,refresh]);

  const nextExpiry=Math.min(...[...active,...(latest?[latest]:[])].map(item=>Date.parse(item.expiresAt)).filter(time=>time>Date.now()));
  useEffect(()=>{
    if(!Number.isFinite(nextExpiry))return;
    const timer=window.setTimeout(()=>redraw(count=>count+1),Math.max(nextExpiry-Date.now()+20,20));
    return ()=>window.clearTimeout(timer);
  },[nextExpiry]);

  useEffect(()=>{
    if(following===null||!feed||document.visibilityState!=="visible")return;
    const report=reportsForZone(feed.reports,following).find(item=>Date.parse(item.createdAt)>lastAlert.current);
    if(!report)return;
    lastAlert.current=Date.parse(report.createdAt);
    saveLocal(followKey+":seen",String(lastAlert.current));
    setLatest(report);
    if(!("Notification" in window)||Notification.permission!=="granted"||!("serviceWorker" in navigator))return;
    const tag="mobility:"+report.id;
    void navigator.serviceWorker.getRegistration().then(registration=>registration?.showNotification(labels[report.kind],{
      body:feed.zones.find(item=>item.id===report.zone)?.label??city.name,
      tag,data:{path:mobilityHref(city)+"#driver-alerts"},
    })).catch(()=>{});
  },[feed,following,labels,city,followKey]);

  async function toggleFollow(){
    if(following===zone){
      try{localStorage.removeItem(followKey);}catch{}
      setFollowing(null);setLatest(null);return;
    }
    lastAlert.current=Date.now();
    saveLocal(followKey,zone);saveLocal(followKey+":seen",String(lastAlert.current));
    setFollowing(zone);setLatest(null);
    if("Notification" in window&&"serviceWorker" in navigator){
      try{
        const permission=Notification.permission==="default"?await Notification.requestPermission():Notification.permission;
        if(permission==="granted")await navigator.serviceWorker.register("/sw.js",{scope:"/"});
      }catch{}
    }
  }

  async function signIn(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setSending(true);setFeedback(null);
    try{
      saveLocal(draftKey,draftZone+":"+(kind??""));
      const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.origin+mobilityHref(city)}});
      setFeedback(error?"error":"sent");
    }catch{setFeedback("error");}
    finally{setSending(false);}
  }

  async function changeReport(id?:string){
    if(!signedIn||(!id&&(!kind||!draftZone)))return;
    setSending(true);setFeedback(null);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session){setSignedIn(false);setFeedback("signin");return;}
      const response=await fetch("/api/mobility/traffic",{
        method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},
        body:JSON.stringify(id?{city:pilot,id}:{city:pilot,zone:draftZone,kind}),
      });
      if(!response.ok&&!(id&&response.status===404)){setFeedback(response.status===429?"limited":"error");return;}
      if(id){setOwnReport(null);saveLocal(reportKey,"");setFeed(current=>current?{...current,reports:current.reports.filter(item=>item.id!==id)}:current);}
      else{
        const result=await response.json() as {id:string};
        setOwnReport(result.id);saveLocal(reportKey,result.id);
        saveLocal(draftKey,"");setKind(null);setFeedback("posted");
      }
      void refresh();
    }catch{setFeedback("error");}
    finally{setSending(false);}
  }

  function fillByVoice(value:string){
    const found=trafficDraft(value,feed?.zones??[],language);
    if(found.zone)setDraftZone(found.zone);
    if(found.kind)setKind(found.kind);
    setFeedback(found.zone||found.kind?"review":"error");
  }

  const readout=[labels.title,city.name,labels.parked,
    ...(draftZone||kind?[labels.review,draftZone?zoneLabel(draftZone):labels.zone,kind?labels[kind]:labels.select]:[]),
    ...(active.length?active.slice(0,5).map(item=>zoneLabel(item.zone)+". "+labels[item.kind]):[loadError?labels.error:feed?labels.empty:labels.checking]),
  ].join(". ");

  return <section id="driver-alerts" aria-labelledby="traffic-heading" lang={TRAFFIC_LANGUAGES[language][1]} dir={language==="ur"?"rtl":"ltr"}
    className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 id="traffic-heading" className="text-2xl font-bold">{labels.title} <span className="text-[var(--text-soft)]">· {city.name}</span></h2>
      <label className="min-w-36 text-sm font-semibold">{labels.language}
        <select className={field+" mt-1"} value={language} onChange={event=>{
          const next=trafficLanguage(event.target.value);setLanguage(next);saveLocal(storageKey,next);
        }}>
          {Object.entries(TRAFFIC_LANGUAGES).map(([value,[label,locale]])=><option key={value} value={value} lang={locale}>{label}</option>)}
        </select>
      </label>
    </div>
    {sources.length>0&&<div className="mt-4">
      <h3 className="font-bold">{labels.official}</h3>
      <p className="mt-1 text-sm text-[var(--text-soft)]">{labels.sources}</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {sources.map(source=><li key={source.href}>
          <a href={source.href} target="_blank" rel="noopener noreferrer" className={control+" w-full justify-between"}>
            <span>{labels[source.label]}{source.location&&" · "+source.location}</span><ExternalLink size={16} aria-hidden="true"/>
          </a>
          {source.historical&&<p className="px-2 text-xs text-[var(--text-soft)]" lang="en">Historical reference. Current camera status is unconfirmed.</p>}
        </li>)}
      </ul>
    </div>}
    {!pilot&&<p className="mt-4 text-sm text-[var(--text-soft)]">{labels.unavailable}</p>}
    {pilot&&<div className="mt-5 grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3 sm:p-4">
        <h3 className="font-bold">{labels.community}</h3>
        <p className="text-sm text-[var(--text-soft)]">{labels.notice}</p>
        <label className="block text-sm font-semibold">{labels.zone}
          <select className={field+" mt-1"} value={zone} onChange={event=>setZone(event.target.value)}>
            <option value="">{labels.all}</option>
            {feed?.zones.map(item=><option key={item.id} value={item.id}>{zoneName(item)}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={control} onClick={()=>void refresh()}><RefreshCw size={16} aria-hidden="true"/>{labels.refresh}</button>
          <button type="button" className={control} aria-pressed={following===zone} disabled={!feed}
            onClick={()=>void toggleFollow()}><Bell size={16} aria-hidden="true"/>{following===zone?labels.unfollow:labels.follow}</button>
        </div>
        {latest&&Date.parse(latest.expiresAt)>Date.now()&&<p role="status" className="text-sm font-semibold">{zoneLabel(latest.zone)} · {labels[latest.kind]}</p>}
        {loadError&&<p role="status" className="text-sm">{labels.error}</p>}
        {!loadError&&active.length===0&&<p className="text-sm" role="status">{feed?labels.empty:labels.checking}</p>}
        {active.length>0&&<ul className="max-h-80 space-y-2 overflow-y-auto">
          {active.map(item=>{
            const Icon=icons[item.kind];
            return <li key={item.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
              <Icon size={20} aria-hidden="true"/><span className="text-sm"><strong>{labels[item.kind]}</strong><br/>{zoneLabel(item.zone)}</span>
              <time className="ms-auto text-xs text-[var(--text-soft)]" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleTimeString(TRAFFIC_LANGUAGES[language][1],{hour:"numeric",minute:"2-digit",timeZone:"Asia/Kolkata"})}</time>
            </li>;
          })}
        </ul>}
      </div>
      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3 sm:p-4">
        <h3 className="font-bold">{labels.post}</h3>
        <p className="text-sm text-[var(--text-soft)]">{labels.parked}</p>
        <TrafficVoice key={language} language={language} onTranscript={feed?fillByVoice:undefined} readout={readout}/>
        <label className="block text-sm font-semibold">{labels.zone}
          <select className={field+" mt-1"} value={draftZone} onChange={event=>setDraftZone(event.target.value)} disabled={!feed}>
            <option value="">{labels.select}</option>
            {feed?.zones.map(item=><option key={item.id} value={item.id}>{zoneName(item)}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label={labels.post}>
          {REPORT_KINDS.map(type=>{
            const Icon=icons[type];
            return <button key={type} type="button" className={control+(kind===type?" gth-btn-gold":"")} aria-pressed={kind===type}
              onClick={()=>setKind(type)}><Icon className="shrink-0" size={18} aria-hidden="true"/>{labels[type]}</button>;
          })}
        </div>
        {signedIn?<div className="flex flex-wrap gap-2">
          <button type="button" className={control+" gth-btn-gold disabled:opacity-50"} disabled={sending||!draftZone||!kind}
            onClick={()=>void changeReport()}>{labels.post}</button>
          {ownReport&&<button type="button" className={control} disabled={sending} onClick={()=>void changeReport(ownReport)} lang="en">Withdraw last report</button>}
        </div>:<details>
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">{labels.signin}</summary>
          <form className="space-y-2" onSubmit={signIn}>
            <label className="block text-sm">{labels.email}
              <input type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)}
                className={field+" mt-1"} dir="ltr"/>
            </label>
            <button className={control} disabled={sending} type="submit">{labels.send}</button>
          </form>
        </details>}
        {feedback&&<p role="status" className="text-sm font-semibold">{labels[feedback]}</p>}
      </div>
    </div>}
  </section>;
}
