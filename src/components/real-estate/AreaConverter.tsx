"use client"
import { useId, useState } from "react"
import { AREA_UNITS, convertArea, estimateAreaBasis, type AreaUnit } from "@/lib/real-estate/area"

export default function AreaConverter() {
  const id = useId(), [amount, setAmount] = useState(""), [from, setFrom] = useState<AreaUnit>("sqft"), [to, setTo] = useState<AreaUnit>("sqm")
  const [basis, setBasis] = useState<"carpet" | "built_up">("carpet"), [efficiency, setEfficiency] = useState("")
  const converted = convertArea(Number(amount), from, to), estimated = estimateAreaBasis(Number(amount), basis, Number(efficiency))
  const format = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 3 })
  return <section className="gth-glass rounded-2xl p-5" aria-labelledby={`${id}-title`}>
    <p className="gold-text text-xs uppercase tracking-widest">Understand the space</p><h2 id={`${id}-title`} className="mt-2 text-xl font-semibold">Area & unit converter</h2>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="text-sm">Recorded area<input className="gth-glass mt-2 min-h-11 w-full rounded-lg p-3" type="number" min="0.001" max="1000000000" step="any" value={amount} onChange={e => setAmount(e.target.value)} /></label>
      <label className="text-sm">Measurement basis<select className="gth-glass mt-2 min-h-11 w-full rounded-lg p-3" value={basis} onChange={e => setBasis(e.target.value as typeof basis)}><option value="carpet">Carpet area</option><option value="built_up">Built-up area</option></select></label>
      {(["From", "To"] as const).map(label => <label className="text-sm" key={label}>{label}<select className="gth-glass mt-2 min-h-11 w-full rounded-lg p-3" value={label === "From" ? from : to} onChange={e => (label === "From" ? setFrom : setTo)(e.target.value as AreaUnit)}>{Object.entries(AREA_UNITS).map(([key, unit]) => <option key={key} value={key}>{unit.label}</option>)}</select></label>)}
    </div>
    <p className="mt-4 text-lg font-semibold" aria-live="polite">{converted === null ? "Enter an area to convert units." : `${format(converted)} ${AREA_UNITS[to].label.toLowerCase()} · ${basis === "carpet" ? "carpet" : "built-up"}`}</p>
    <label className="mt-5 block text-sm">Documented carpet / built-up ratio (%) · optional<input className="gth-glass mt-2 min-h-11 w-full rounded-lg p-3" type="number" min="0.01" max="100" step="0.01" value={efficiency} onChange={e => setEfficiency(e.target.value)} /></label>
    {estimated !== null && <p className="mt-3 text-sm" aria-live="polite">Illustrative {basis === "carpet" ? "built-up" : "carpet"} area: {format(estimated)} {AREA_UNITS[from].label.toLowerCase()}</p>}
    <p className="mt-4 text-xs leading-6 opacity-70">Unit conversion preserves the measurement basis. Carpet and built-up areas have no universal conversion ratio. Use the documented ratio for this property; the estimate is not a RERA-certified measurement.</p>
  </section>
}
