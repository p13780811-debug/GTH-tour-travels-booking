"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

type Option = { label: string; href: string; selected: boolean };

/** Optional app-only filter sheet. Existing website's full-height sidebar is unchanged. */
export default function AppFiltersSheet({ title, options }: { title: string; options: Option[] }) {
  const [open,setOpen]=useState(false);
  const startY=useRef<number|null>(null);
  const toggle=useRef<HTMLButtonElement>(null);
  const panel=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!open)return;
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){setOpen(false);toggle.current?.focus();}
      if(event.key!=="Tab")return;
      const elements=Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')||[]);
      if(!elements.length)return;
      const first=elements[0],last=elements[elements.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    window.addEventListener("keydown",onKey);
    const frame=requestAnimationFrame(()=>panel.current?.focus());
    return()=>{window.removeEventListener("keydown",onKey);cancelAnimationFrame(frame)};
  },[open]);

  const close=()=>{setOpen(false);toggle.current?.focus()};
  return <div className="mx-4 mt-3 sm:mx-6 md:hidden">
    <button ref={toggle} type="button" aria-expanded={open} aria-controls="gth-app-filter-sheet"
      onClick={()=>setOpen(true)}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--text)]">
      <SlidersHorizontal size={16} aria-hidden="true" /> Filter {title}
    </button>
    {open && <div className="fixed inset-0 z-[250] flex items-end" role="presentation">
      <button type="button" aria-label="Close app filters" className="absolute inset-0 bg-black/60" onClick={close}/>
      <div id="gth-app-filter-sheet" ref={panel} role="dialog" aria-modal="true" aria-label={"Filter "+title}
        tabIndex={-1} className="relative max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border border-[var(--border)] bg-[var(--card)] p-5 pb-[calc(20px+env(safe-area-inset-bottom))] text-[var(--text)] outline-none">
        <div className="mb-4 flex cursor-grab touch-pan-y items-center justify-between gap-3 border-b border-[var(--border)] pb-4"
          onTouchStart={event=>{startY.current=event.touches[0]?.clientY??null}}
          onTouchEnd={event=>{
            const start=startY.current;startY.current=null;
            if(start!==null&&event.changedTouches[0]&&event.changedTouches[0].clientY-start>80)close();
          }}>
          <div><span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-[var(--border)]"/>
            <h2 className="text-base font-semibold">{title} filters</h2>
            <p className="mt-1 text-xs text-[var(--text-soft)]">Swipe header down to close</p>
          </div>
          <button type="button" onClick={close} className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--border)]" aria-label="Close filter sheet">
            <X size={18} aria-hidden="true"/>
          </button>
        </div>
        <nav aria-label="App filter categories" className="grid gap-2">
          {options.map((item,index)=><Link key={item.href+"-"+index} href={item.href} onClick={()=>setOpen(false)}
            aria-current={item.selected?"page":undefined}
            className={"flex min-h-12 items-center rounded-xl border px-4 text-sm font-semibold "+
              (item.selected?"border-[var(--gold)] bg-[var(--bg)]":"border-[var(--border)]")}>
              {item.label}
          </Link>)}
        </nav>
      </div>
    </div>}
  </div>;
}
