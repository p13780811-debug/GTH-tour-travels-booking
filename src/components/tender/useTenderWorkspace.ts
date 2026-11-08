"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { EMPTY_TENDER_WORKSPACE, parseTenderWorkspace, TENDER_WORKSPACE_KEY, type TenderDiscoveryWorkspace } from "@/lib/tender/discovery-workspace";

const CHANGE = "gth-tender-discovery-change";
// Browser-only fallback, never read or written during server rendering.
let sessionValue: string | null = null;
let memoryOnly = false;
const pending: Array<(value:TenderDiscoveryWorkspace)=>TenderDiscoveryWorkspace> = [];
function snapshot() {
  if (memoryOnly) return sessionValue;
  try { return window.localStorage.getItem(TENDER_WORKSPACE_KEY); }
  catch { return sessionValue; }
}
function subscribe(listener: () => void) {
  const storage = (event: StorageEvent) => { if (!event.key || event.key === TENDER_WORKSPACE_KEY) listener(); };
  window.addEventListener("storage",storage);
  window.addEventListener(CHANGE,listener);
  return () => { window.removeEventListener("storage",storage); window.removeEventListener(CHANGE,listener); };
}
const serverSnapshot = () => null;

export function useTenderWorkspace() {
  const raw = useSyncExternalStore(subscribe,snapshot,serverSnapshot);
  const workspace = useMemo(() => raw ? parseTenderWorkspace(raw) : EMPTY_TENDER_WORKSPACE,[raw]);
  const update = useCallback((change: (value: TenderDiscoveryWorkspace) => TenderDiscoveryWorkspace): boolean => {
    let base:TenderDiscoveryWorkspace;
    try{
      base=parseTenderWorkspace(window.localStorage.getItem(TENDER_WORKSPACE_KEY));
      for(const operation of pending)base=operation(base);
    }catch{
      const next=change(parseTenderWorkspace(sessionValue));
      pending.push(change);sessionValue=JSON.stringify(next);memoryOnly=true;
      window.dispatchEvent(new Event(CHANGE));return false;
    }
    const next=JSON.stringify(change(base));
    let persisted=true;
    try{window.localStorage.setItem(TENDER_WORKSPACE_KEY,next);pending.length=0;memoryOnly=false;}
    catch{persisted=false;memoryOnly=true;pending.push(change);}
    sessionValue=next;
    window.dispatchEvent(new Event(CHANGE));
    return persisted;
  },[]);
  return {workspace,update};
}
