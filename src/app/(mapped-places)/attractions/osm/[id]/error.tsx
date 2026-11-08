"use client";
export default function OsmPlaceError({reset}:{reset:()=>void}){
 return <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-16 text-[var(--text)]">
  <h1 className="text-2xl font-bold">Place details are temporarily unavailable</h1>
  <p role="status" className="mt-4 text-sm leading-7 text-[var(--text-soft)]">The source did not respond in time. This does not mean the place was removed. Please try again.</p>
  <button onClick={reset} className="gth-btn-gold mt-6 min-h-11 rounded-xl px-5 py-3 text-sm">Try again</button>
  <a href="/attractions" className="ml-4 inline-flex min-h-11 items-center text-sm underline">Browse attractions</a>
 </main>;
}
