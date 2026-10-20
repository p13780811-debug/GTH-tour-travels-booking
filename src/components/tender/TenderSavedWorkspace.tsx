"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Bookmark, GitCompareArrows, RefreshCw, X } from "lucide-react";
import { useTenderWorkspace } from "./useTenderWorkspace";
import { TenderCsvDownload, TenderDeadlineDownload, TenderSaveCompare } from "./TenderDiscoveryActions";
import { formatTenderBudget, TENDER_ID } from "@/lib/tender/discovery-workspace";
import { safeTenderSource, type PublicTender } from "@/lib/tender/catalog";

type RecordResult = { id: string; item: PublicTender | null; unavailable: boolean };
type Loaded = { key: string; revision: number; rows: RecordResult[] };
function deadline(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(date) + " UTC" : "Check official notice";
}

export default function TenderSavedWorkspace({ initialView }: { initialView: "saved" | "compare" }) {
  const { workspace,update } = useTenderWorkspace();
  const [view,setView] = useState(initialView);
  const [revision,setRevision] = useState(0);
  const [loaded,setLoaded] = useState<Loaded>({key:"",revision:-1,rows:[]});
  const [message,setMessage] = useState("");
  const ids = view === "saved" ? workspace.saved : workspace.comparison;
  const key = ids.join(",");
  const loading = ids.length > 0 && (loaded.key !== key || loaded.revision !== revision);
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    let disposed = false;
    const timer = setTimeout(() => controller.abort(),20000);
    async function load() {
      const selected = key.split(",").filter(id => TENDER_ID.test(id)).slice(0,40);
      const rows: RecordResult[] = [];
      // Bound public API concurrency; never send a bulk privileged database query.
      for (let start = 0; start < selected.length; start += 4) {
        const batch = await Promise.all(selected.slice(start,start + 4).map(async id => {
          try {
            const response = await fetch(`/api/tender/${encodeURIComponent(id)}`,{cache:"no-store",signal:controller.signal});
            if (response.status === 404) return {id,item:null,unavailable:false};
            if (!response.ok) throw new Error("Unavailable");
            const value: PublicTender = await response.json();
            if (value.id !== id || !Number.isFinite(Date.parse(value.deadline_at))) throw new Error("Invalid record");
            // A deadline can pass between the server read and browser display.
            return {id,item:Date.parse(value.deadline_at) > Date.now() ? value : null,unavailable:false};
          } catch { return {id,item:null,unavailable:true}; }
        }));
        rows.push(...batch);
        if (disposed) return;
      }
      clearTimeout(timer);
      if (!disposed) setLoaded({key,revision,rows});
    }
    void load();
    return () => { disposed = true; clearTimeout(timer); controller.abort(); };
  },[key,revision]);
  const rows = loading || !key ? [] : loaded.rows;
  const current = rows.flatMap(row => row.item ? [row.item] : []);
  function remove(id: string) {
    const persisted = update(value => ({...value,[view === "saved" ? "saved" : "comparison"]:value[view === "saved" ? "saved" : "comparison"].filter(item => item !== id)}));
    setMessage(persisted ? "Removed from this device's list." : "Removed for this tab session. Browser storage is unavailable.");
  }
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 md:py-12">
      <Link href="/tender" className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4"><ArrowLeft size={16} aria-hidden="true"/>Tender discovery</Link>
      <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Your procurement workspace</p>
      <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Keep the right opportunities in view.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Compare official notice details and plan your next step. Saved IDs stay on this browser; current availability is checked again from the public catalog.</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Tender workspace views" className="flex flex-wrap gap-3">
          <button type="button" aria-pressed={view === "saved"} onClick={() => setView("saved")} className="gth-btn inline-flex items-center justify-center gap-2"><Bookmark size={16} aria-hidden="true"/>{view === "saved" ? "✓ " : ""}Saved ({workspace.saved.length})</button>
          <button type="button" aria-pressed={view === "compare"} onClick={() => setView("compare")} className="gth-btn inline-flex items-center justify-center gap-2"><GitCompareArrows size={16} aria-hidden="true"/>{view === "compare" ? "✓ " : ""}Comparison ({workspace.comparison.length}/3)</button>
        </nav>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={loading || !ids.length} onClick={() => setRevision(value => value + 1)} className="gth-btn inline-flex items-center justify-center gap-2"><RefreshCw size={15} aria-hidden="true"/>Refresh notices</button>
          <TenderCsvDownload notices={current} label="Export this view (.csv)"/>
        </div>
      </div>
      {message ? <p role="status" className="mt-4 text-sm text-[var(--text-soft)]">{message}</p> : null}
      {loading ? <p role="status" className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm">Checking current public notices…</p> : null}
      {!ids.length ? <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7">
        <h2 className="text-lg font-semibold">{view === "saved" ? "Your shortlist starts here." : "Choose two or three tenders to compare."}</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Use Save or Compare on any tender card. No account is needed for this device-only workspace.</p>
        <Link href="/tender" className="gth-btn gth-btn-gold mt-5 inline-flex items-center justify-center gap-2">Find opportunities <ArrowUpRight size={16} aria-hidden="true"/></Link>
      </section> : null}
      {!loading && view === "compare" && ids.length === 1 ? <p role="status" className="mt-6 text-sm text-[var(--text-soft)]">Select at least one more tender from discovery for a side-by-side comparison.</p> : null}
      {!loading && view === "compare" && current.length >= 2 ? <section aria-label="Tender comparison" className="mt-7 min-w-0">
        <p className="mb-3 text-xs leading-6 text-[var(--text-soft)]">Estimated values retain their original currencies. No exchange-rate conversion or eligibility ranking is applied.</p>
        <div className="max-w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)]" tabIndex={0} role="region" aria-label="Comparison table; scroll horizontally on small screens">
          <table className="w-full min-w-[44rem] border-collapse text-start text-sm">
            <caption className="sr-only">Current official-source tender comparison</caption>
            <thead><tr><th scope="col" className="p-4 text-start">Notice details</th>{current.map(tender => <th scope="col" className="max-w-sm p-4 text-start align-top" key={tender.id}><Link href={`/tender/${tender.id}`} className="break-words font-semibold underline underline-offset-4">{tender.title}</Link></th>)}</tr></thead>
            <tbody>{[
              ["Buyer",(tender: PublicTender) => tender.buyer],
              ["Country / region",(tender: PublicTender) => [tender.country_code,tender.region].filter(Boolean).join(" · ")],
              ["Category",(tender: PublicTender) => tender.sector],
              ["Deadline",(tender: PublicTender) => deadline(tender.deadline_at)],
              ["Estimated value",(tender: PublicTender) => formatTenderBudget(tender.estimated_value,tender.currency)],
              ["Official source",(tender: PublicTender) => tender.source_name],
              ["Reference",(tender: PublicTender) => tender.source_reference],
              ["Qualification criteria",(tender: PublicTender) => tender.requirements_verified ? "Reviewed source criteria recorded; inspect conditions" : "Not independently reviewed in this catalog"],
            ].map(([label,value]) => <tr className="border-t border-[var(--border)]" key={String(label)}><th scope="row" className="p-4 text-start align-top font-medium">{String(label)}</th>{current.map(tender => <td key={tender.id} className="max-w-sm break-words p-4 align-top leading-6 text-[var(--text-soft)]">{(value as (t: PublicTender) => string)(tender)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section> : null}
      {!loading ? <div className="mt-7 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map(row => <article key={row.id} className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        {row.item ? <>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">{row.item.country_code} · {row.item.sector}</p>
          <h2 className="mt-3 break-words text-base font-semibold leading-7"><Link href={`/tender/${row.id}`} className="hover:underline">{row.item.title}</Link></h2>
          <p className="mt-2 break-words text-sm text-[var(--text-soft)]">{row.item.buyer}</p>
          <p className="mt-3 text-xs leading-6">Deadline: <strong>{deadline(row.item.deadline_at)}</strong></p>
          <p className="text-xs leading-6 text-[var(--text-soft)]">{row.item.source_name} · {row.item.source_reference}</p>
          <TenderSaveCompare id={row.id} title={row.item.title}/>
          <div className="mt-4 flex flex-wrap gap-3"><TenderDeadlineDownload tender={row.item}/><Link href={`/tender/assistant?tenderId=${row.id}`} className="gth-btn gth-btn-gold inline-flex items-center justify-center gap-2">Prepare bid <ArrowUpRight size={15} aria-hidden="true"/></Link></div>
          {safeTenderSource(row.item.source_url) ? <a href={safeTenderSource(row.item.source_url)!} target="_blank" rel="noopener noreferrer nofollow" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">Official notice <ArrowUpRight size={15} aria-hidden="true"/></a> : null}
        </> : <>
          <h2 className="text-base font-semibold">{row.unavailable ? "Notice temporarily unavailable" : "Notice is no longer in the active public catalog"}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{row.unavailable ? "Try Refresh notices. Your saved ID has been retained." : "It may have closed, been withdrawn or stopped being public. Check the issuing authority before proceeding."}</p>
          <p className="mt-3 break-all text-xs text-[var(--text-soft)]">Saved ID: {row.id}</p>
          <button type="button" onClick={() => remove(row.id)} className="gth-btn mt-4 inline-flex items-center justify-center gap-2"><X size={15} aria-hidden="true"/>Remove from this list</button>
        </>}
      </article>)}</div> : null}
      <p className="mt-8 text-xs leading-6 text-[var(--text-soft)]">This workspace does not submit bids or send deadline notifications. Download a calendar reminder or continue in the guided assistant for eligibility screening, document planning and private drafts.</p>
    </div>
  </main>;
}
