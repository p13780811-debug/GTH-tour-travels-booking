"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Check, Download, GitCompareArrows, SearchCheck, X, CalendarClock } from "lucide-react";
import { useTenderWorkspace } from "./useTenderWorkspace";
import { buildTenderCsv, MAX_COMPARED_TENDERS, MAX_SAVED_SEARCHES, MAX_SAVED_TENDERS, safeTenderSearchHref, toggleTenderId } from "@/lib/tender/discovery-workspace";
import { buildTenderDeadlineCalendar } from "@/lib/tender/calendar";
import type { PublicTender } from "@/lib/tender/catalog";

export function downloadTenderFile(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content],{type}));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}

export function TenderSaveCompare({ id, title }: { id: string; title: string }) {
  const { workspace, update } = useTenderWorkspace();
  const [message,setMessage] = useState("");
  const saved = workspace.saved.includes(id.toLowerCase());
  const compared = workspace.comparison.includes(id.toLowerCase());
  function toggle(key: "saved" | "comparison") {
    let reached = false;
    const persisted = update(value => {
      const next = toggleTenderId(value[key],id,key === "saved" ? MAX_SAVED_TENDERS : MAX_COMPARED_TENDERS);
      reached = next.limitReached;
      return {...value,[key]:next.ids};
    });
    setMessage(reached ? `Keep up to ${key === "saved" ? MAX_SAVED_TENDERS : MAX_COMPARED_TENDERS} tenders. Remove one to add another.`
      : persisted ? "" : "Browser storage is unavailable. This change lasts for this tab session only.");
  }
  return <div className="mt-4">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => toggle("saved")} aria-pressed={saved} aria-label={(saved ? "Unsave " : "Save ") + title} className="gth-btn inline-flex items-center justify-center gap-2">
        {saved ? <Check size={15} aria-hidden="true"/> : <Bookmark size={15} aria-hidden="true"/>}{saved ? "Saved" : "Save"}
      </button>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={compared} onChange={() => toggle("comparison")} aria-label={"Compare " + title} className="size-4 accent-[var(--gold)]"/>
        {compared ? "Selected for comparison" : "Compare"}
      </label>
    </div>
    {message ? <p role="status" className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{message}</p> : null}
  </div>;
}

export function TenderCsvDownload({ notices, label = "Export results (.csv)" }: { notices: PublicTender[]; label?: string }) {
  const [message,setMessage] = useState("");
  return <div>
    <button type="button" disabled={!notices.length} className="gth-btn inline-flex items-center justify-center gap-2" onClick={() => {
      try { downloadTenderFile(buildTenderCsv(notices),"gth-tender-notices.csv","text/csv;charset=utf-8"); setMessage("CSV prepared from these public results. Check official notices before bidding."); }
      catch { setMessage("Download unavailable in this browser. Open the official notices individually."); }
    }}><Download size={15} aria-hidden="true"/>{label}</button>
    {message ? <p role="status" className="mt-2 text-xs text-[var(--text-soft)]">{message}</p> : null}
  </div>;
}

export function TenderDeadlineDownload({ tender }: { tender: Pick<PublicTender,"id"|"title"|"deadline_at"|"source_name"|"source_url"> }) {
  const [message,setMessage] = useState("");
  return <div>
    <button type="button" className="gth-btn inline-flex items-center justify-center gap-2" onClick={() => {
      const calendar = buildTenderDeadlineCalendar(tender);
      if (!calendar) { setMessage("This deadline has passed or is unavailable. Recheck the official notice."); return; }
      try { downloadTenderFile(calendar,`gth-tender-${tender.id}-deadline.ics`,"text/calendar;charset=utf-8"); setMessage("Reminder file prepared. Import it into your calendar; this does not schedule an email alert."); }
      catch { setMessage("Calendar download unavailable in this browser."); }
    }}><CalendarClock size={16} aria-hidden="true"/>Save deadline (.ics)</button>
    {message ? <p role="status" className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{message}</p> : null}
  </div>;
}

export function TenderWorkspaceToolbar({ searchHref, searchLabel, notices }: { searchHref: string; searchLabel: string; notices: PublicTender[] }) {
  const { workspace, update } = useTenderWorkspace();
  const [message,setMessage] = useState("");
  const href = safeTenderSearchHref(searchHref);
  const alreadySaved = workspace.searches.some(search => search.href === href);
  function saveSearch() {
    if (!href) { setMessage("Choose valid filters before saving this search."); return; }
    let full = false;
    const persisted = update(value => {
      if (value.searches.some(search => search.href === href)) return value;
      if (value.searches.length >= MAX_SAVED_SEARCHES) { full = true; return value; }
      return {...value,searches:[...value.searches,{href,label:searchLabel.slice(0,120)}]};
    });
    setMessage(full ? "You can keep eight searches. Remove one to save another." : persisted ? "Search saved on this device. It runs again when you open it; no email alerts are enabled." : "Search kept for this tab session only; browser storage is unavailable.");
  }
  return <section aria-label="Your tender workspace" className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h3 className="text-base font-semibold">Your tender workspace</h3><p className="mt-1 text-xs leading-6 text-[var(--text-soft)]">Shortlist, compare and revisit. Saved notices are checked again when you open your workspace.</p></div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/tender/saved" className="gth-btn inline-flex items-center justify-center gap-2"><Bookmark size={15} aria-hidden="true"/>Saved tenders ({workspace.saved.length})</Link>
        <Link href="/tender/saved?view=compare" className="gth-btn inline-flex items-center justify-center gap-2"><GitCompareArrows size={15} aria-hidden="true"/>Compare ({workspace.comparison.length}/3)</Link>
        <button type="button" className="gth-btn inline-flex items-center justify-center gap-2" disabled={alreadySaved} onClick={saveSearch}><SearchCheck size={15} aria-hidden="true"/>{alreadySaved ? "Search saved" : "Save this search"}</button>
        <TenderCsvDownload notices={notices}/>
      </div>
    </div>
    {message ? <p role="status" className="mt-3 text-xs leading-6 text-[var(--text-soft)]">{message}</p> : null}
    {workspace.searches.length ? <ul aria-label="Saved tender searches" className="mt-4 flex flex-wrap gap-3">{workspace.searches.map(search => <li key={search.href} className="flex min-w-0 max-w-full items-center gap-2">
      <Link href={search.href} className="break-words text-sm underline underline-offset-4">{search.label}</Link>
      <button type="button" className="gth-btn inline-flex items-center justify-center" aria-label={"Remove saved search " + search.label} onClick={() => update(value => ({...value,searches:value.searches.filter(item => item.href !== search.href)}))}><X size={14} aria-hidden="true"/></button>
    </li>)}</ul> : null}
    <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">Saved notice IDs and search filters stay on this browser. Private bid drafts use the separate signed-in preparation workspace.</p>
  </section>;
}
