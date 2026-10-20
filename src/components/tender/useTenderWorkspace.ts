"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { EMPTY_TENDER_WORKSPACE, parseTenderWorkspace, TENDER_WORKSPACE_KEY, type TenderDiscoveryWorkspace } from "@/lib/tender/discovery-workspace";

const CHANGE = "gth-tender-discovery-change";
// Browser-only fallback, never read or written during server rendering.
let sessionValue: string | null = null;
let memoryOnly = false;
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
    const next = JSON.stringify(change(parseTenderWorkspace(snapshot())));
    let persisted = true;
    try { window.localStorage.setItem(TENDER_WORKSPACE_KEY,next); }
    catch { persisted = false; memoryOnly = true; }
    sessionValue = next;
    window.dispatchEvent(new Event(CHANGE));
    return persisted;
  },[]);
  return {workspace,update};
}
