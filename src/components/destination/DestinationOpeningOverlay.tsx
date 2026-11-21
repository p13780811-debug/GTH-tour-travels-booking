"use client";
import type {MouseEvent} from "react";

/** Never intercept a link opened in a new tab or with a modifier key. */
export function isNormalDestinationNavigation(event:MouseEvent<HTMLAnchorElement>):boolean{
 return !event.defaultPrevented && event.button===0 &&
  !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey &&
  (!event.currentTarget.target || event.currentTarget.target==="_self");
}

/** Short-lived transition cover: the previous footer must not masquerade as
 * the destination page during a slow Next.js / Supabase route transition.
 * No timers, redirects, global CSS, navigation changes or provider requests.
 */
export default function DestinationOpeningOverlay({city}:{city:string}){
 return <div role="status" aria-live="polite" aria-busy="true"
   className="fixed inset-0 z-[200] flex min-h-dvh items-center justify-center bg-[var(--bg)] px-5 text-[var(--text)]">
   <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7 text-center shadow-lg">
     <div className="mx-auto mb-5 h-2 w-24 animate-pulse rounded-full bg-[var(--gold)]"/>
     <h2 className="text-xl font-semibold">Opening {city}…</h2>
     <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
       Your destination guide is loading. No need to search again.
     </p>
   </div>
 </div>;
}
