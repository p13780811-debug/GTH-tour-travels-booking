"use client"

import { useId, useState } from "react"
import { COMMUTE_MODES, commuteDirections, hasCommuteOrigin, type CommuteMode } from "@/lib/real-estate/commute"

type Property = { slug: string; title: string; lat?: number; lng?: number }

export default function CommutePlanner({ properties }: { properties: readonly Property[] }) {
  const titleId = useId()
  const [destination, setDestination] = useState("")
  const [mode, setMode] = useState<CommuteMode>("driving")
  const field = "mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]"
  const routes = properties.map(property => ({
    property, href: commuteDirections(property.lat, property.lng, destination, mode),
  }))
  const hasMappedProperty = properties.some(property => hasCommuteOrigin(property.lat, property.lng))

  return <section aria-labelledby={titleId} className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
    <h3 id={titleId} className="text-lg font-semibold">Check your commute</h3>
    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Use the same destination to check routes from each property. Google Maps receives the destination and stored property coordinates when you open a route.</p>
    {hasMappedProperty ? <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="min-w-0 text-sm">Destination<input type="text" autoComplete="off" maxLength={180} placeholder="Workplace, station or landmark" className={field} value={destination} onChange={event => setDestination(event.target.value)} /></label>
        <label className="text-sm">Travel mode<select className={field} value={mode} onChange={event => setMode(event.target.value as CommuteMode)}>{COMMUTE_MODES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      </div>
      {destination.trim() && <ul className="mt-4 grid gap-2">{routes.map(({ property, href }) => <li key={property.slug} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <span className="min-w-0 break-words font-semibold">{property.title}</span>
        {href ? <a className="gth-btn inline-flex min-h-11 items-center" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open route from ${property.title} in Google Maps`}>Open route in Google Maps ↗</a> : <span className="text-[var(--text-soft)]">Route unavailable for these inputs.</span>}
      </li>)}</ul>}
      <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">Confirm the exact entrance and compare travel times at the time you normally commute.</p>
    </> : <p className="mt-3 text-sm text-[var(--text-soft)]">A route needs recorded property coordinates.</p>}
  </section>
}
