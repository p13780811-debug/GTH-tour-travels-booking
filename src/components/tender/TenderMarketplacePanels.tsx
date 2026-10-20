import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness,
  CalendarClock, Clock3, FileText, Hammer, Layers3, Package,
  ShieldCheck, Timer, UsersRound
} from "lucide-react";
import type { PublicTender, TenderDiscoveryStats, TenderFilters, TenderSector } from "@/lib/tender/catalog";
import { safeTenderSource } from "@/lib/tender/catalog";
import type { TenderLocale } from "@/lib/tender/localization";
import { countryLabel, dateLabel } from "@/lib/tender/localization";
import { tenderText } from "@/lib/tender/i18n";
import { marketplaceText } from "@/lib/tender/marketplace-copy";
import { tenderFilterHref } from "@/lib/tender/urls";
import { TenderSaveCompare } from "./TenderDiscoveryActions";

const categories = [
  {key:"works",Icon:Hammer},
  {key:"goods",Icon:Package},
  {key:"services",Icon:BriefcaseBusiness},
  {key:"consultancy",Icon:UsersRound},
  {key:"other",Icon:Layers3}
] as const;

export function TenderMarketOverview({
  filters,language,stats,view
}:{
  filters:TenderFilters;language:TenderLocale;stats:TenderDiscoveryStats | null;view:"status"|"categories"
}){
  const m=marketplaceText(language);
  if(!stats) return null;
  const allCount=Object.values(stats.sectors).reduce((a,b)=>a+b,0);
  const importDate=stats.latestImportedAt?new Date(stats.latestImportedAt):null;
  const dateText=importDate && Number.isFinite(importDate.getTime())
    ?new Intl.DateTimeFormat(language,{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(importDate)+" UTC":null;
  const base={...filters,closingWithin:undefined as "7"|undefined};
  return <>
    {view==="status"?<section aria-label={m("live")} className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 md:pt-10">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="relative flex size-3 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--gold)]/40 motion-reduce:animate-none"/>
              <span className="relative inline-flex size-3 rounded-full bg-[var(--gold)]"/>
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text)]">{m("live")}</p>
              <p className="mt-1 text-xs text-[var(--text-soft)]">{m("scheduleShort")}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-[var(--text-soft)]">
            <ShieldCheck size={15} aria-hidden="true"/> {m("source")}
          </span>
        </div>
        <div className="grid gap-0 sm:grid-cols-3">
          <div className="border-b border-[var(--border)] px-5 py-5 sm:border-b-0 sm:border-e sm:px-7">
            <p className="text-xs font-medium text-[var(--text-soft)]">{m("notice")}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{allCount.toLocaleString(language)}</p>
          </div>
          <Link href={tenderFilterHref({...base,closingWithin:"7"},language)}
            className="group border-b border-[var(--border)] px-5 py-5 hover:bg-[var(--bg-soft)] sm:border-b-0 sm:border-e sm:px-7"
            aria-label={m("soon")}>
            <p className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-soft)]">
              <CalendarClock size={15} aria-hidden="true"/>{m("ending")}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-3xl font-bold tracking-tight tabular-nums">
              {stats.closingSoon7.toLocaleString(language)} <ArrowRight size={18} aria-hidden="true" className="text-[var(--gold)] transition-transform group-hover:translate-x-1"/>
            </p>
          </Link>
          <div className="px-5 py-5 sm:px-7">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-soft)]">
              <Clock3 size={15} aria-hidden="true"/>{m("freshness")}
            </p>
            <p className="mt-3 text-sm font-semibold">{dateText??"—"}</p>
          </div>
        </div>
        <p className="border-t border-[var(--border)] px-5 py-3 text-xs leading-6 text-[var(--text-soft)] sm:px-7">{m("schedule")}</p>
      </div>
    </section>:null}
    {view==="categories"?<section aria-labelledby="tender-category-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">{m("notice")}</p>
          <h2 id="tender-category-title" className="mt-2 text-2xl font-semibold">{m("categories")}</h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--text-soft)]">{m("categoryHelp")}</p>
        </div>
        <Link className="gth-btn inline-flex items-center gap-2 justify-center"
          href={tenderFilterHref({...base,sector:""},language)}>
          {m("all")} <span className="tabular-nums">{allCount}</span>
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {categories.map(({key,Icon})=>{
          const count=stats.sectors[key as TenderSector];
          const active=filters.sector===key;
          return <Link key={key}
            href={tenderFilterHref({...base,sector:key},language)}
            aria-current={active?"page":undefined}
            className={"group flex min-h-32 flex-col justify-between rounded-2xl border p-4 transition-colors hover:border-[var(--gold)] sm:p-5 " +
              (active?"border-[var(--gold)] bg-[var(--bg-soft)]":"border-[var(--border)] bg-[var(--card)]")}>
            <span className="flex items-center justify-between">
              <Icon size={21} className="text-[var(--gold)]" aria-hidden="true"/>
              <span className="text-sm font-semibold tabular-nums text-[var(--text-soft)]">{count}</span>
            </span>
            <span className="mt-5 inline-flex items-center justify-between gap-2 text-sm font-semibold">
              {m(key)} <ArrowUpRight size={15} className="shrink-0 text-[var(--gold)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true"/>
            </span>
          </Link>;
        })}
      </div>
      <Link href={tenderFilterHref({...base,closingWithin:"7"},language)}
        className="gth-btn mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-3"><Timer size={19} aria-hidden="true"/>{m("soon")}</span>
        <span className="inline-flex items-center gap-2 text-xs">{m("soonHelp")} <ArrowRight size={16} aria-hidden="true"/></span>
      </Link>
    </section>:null}
  </>;
}

function budget(value:number|null,currency:string|null,locale:TenderLocale):string|null {
  if(typeof value!=="number"||!Number.isFinite(value)||value<=0||!currency||!/^[A-Z]{3}$/.test(currency))return null;
  try{return new Intl.NumberFormat(locale,{style:"currency",currency,maximumFractionDigits:0}).format(value)}
  catch{return null}
}

export function TenderMarketCard({tender,language}:{
  tender:PublicTender;language:TenderLocale;
}){
  const m=marketplaceText(language);
  const t=tenderText(language);
  const price=budget(tender.estimated_value,tender.currency,language);
  const hours=(Date.parse(tender.deadline_at)-Date.now())/3600000;
  const urgent=hours>0&&hours<=72;
  const closingDays=Math.max(0,Math.ceil(hours/24));
  const original=safeTenderSource(tender.source_url);
  return <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-colors hover:border-[var(--gold)] sm:p-6">
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 font-semibold">
        <span aria-hidden="true" className="size-2 rounded-full bg-[var(--gold)]"/>
        {m("open")}
      </span>
      {urgent?<span className="rounded-full border border-[var(--gold)] px-3 py-1 font-semibold text-[var(--text)]">{m("urgency")}</span>:null}
      <span className="rounded-full border border-[var(--border)] px-3 py-1 font-medium">{countryLabel(tender.country_code,language)}</span>
    </div>
    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--text-soft)]">
      <span className="flex items-center gap-2"><BadgeCheck size={16} aria-hidden="true"/>{tender.source_name}</span>
      <span className="capitalize">{m(tender.sector)}</span>
    </div>
    <h3 className="mt-4 break-words text-lg font-semibold leading-7">
      <Link href={"/tender/"+tender.id} className="hover:underline">{tender.title}</Link>
    </h3>
    <p className="mt-2 line-clamp-2 text-sm font-medium text-[var(--text-soft)]">{tender.buyer}</p>
    {tender.region?<p className="mt-1 text-xs text-[var(--text-soft)]">{tender.region}</p>:null}
    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{tender.summary||m("original")}</p>
    <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[var(--bg)] p-4">
      <div>
        <p className="inline-flex items-center gap-1.5 text-xs text-[var(--text-soft)]"><CalendarClock size={14} aria-hidden="true"/>{t("deadline")}</p>
        <p className="mt-2 text-sm font-semibold tabular-nums">{dateLabel(tender.deadline_at,language)}</p>
        {hours>0?<p className="mt-1 text-xs text-[var(--text-soft)]">{closingDays} {m("days")}</p>:null}
      </div>
      <div>
        <p className="text-xs text-[var(--text-soft)]">{price?m("budget"):m("source")}</p>
        <p className="mt-2 break-words text-sm font-semibold">{price??tender.source_name}</p>
      </div>
    </div>
    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--text-soft)]"><ShieldCheck size={14} aria-hidden="true"/>{m("deadlineNote")}</p>
    <TenderSaveCompare id={tender.id} title={tender.title}/>
    <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
      <Link href={"/tender/"+tender.id}
        className="gth-btn inline-flex items-center gap-2 justify-center">
        <FileText size={16} aria-hidden="true"/>{t("view")}
      </Link>
      {original?<a href={original} target="_blank" rel="noopener noreferrer nofollow"
        className="gth-btn inline-flex items-center gap-2 justify-center">
        {m("openOriginal")} <ArrowUpRight size={16} aria-hidden="true"/>
      </a>:null}
      <Link href={"/tender/assistant?tenderId="+encodeURIComponent(tender.id)}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--text)]">{t("eligibility")} <ArrowRight size={16} aria-hidden="true"/></Link>
    </div>
  </article>;
}
