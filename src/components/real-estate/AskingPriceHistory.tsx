"use client"

import { useState } from "react"
import { askingPriceChange } from "@/lib/real-estate/asking-price-change"

export type PriceObservation = {
  id: string; inventory_id: string; recorded_at: string; listing_type: string;
  amount: number | string; previous_amount: number | string | null; currency: string;
}

const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 2, signDisplay: "exceptZero" })
const observedDate = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" })
const filters = [["all", "All observations"], ["drops", "Price reductions"], ["rises", "Price increases"]] as const

function money(value: number | string, currency: string, signed = false) {
  if (!/^[A-Z]{3}$/.test(currency) || !Number.isFinite(Number(value))) return "Not supplied"
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2, signDisplay: signed ? "always" : "auto" }).format(Number(value))
}

export default function AskingPriceHistory({ observations }: { observations: readonly PriceObservation[] }) {
  const [filter, setFilter] = useState<typeof filters[number][0]>("all")
  const rows = observations.map(row => ({ row, change: askingPriceChange(row.amount, row.previous_amount) }))
  const visible = rows.filter(({ change }) => filter === "all" || (change && (filter === "drops" ? change.amount < 0 : change.amount > 0)))

  return <section className="mt-6" aria-label="Observed asking prices">
    <h3 className="text-lg font-semibold">Observed asking prices</h3>
    {rows.length === 0 ? <p className="mt-3 text-sm">No published asking-price observations yet.</p> : <>
      <p className="mt-2 text-sm text-[var(--text-soft)]">Changes compare consecutive recorded asking prices for the same unit and currency. Sale and rent observations retain their own labels.</p>
      <div role="group" aria-label="Asking price history filters" className="mt-3 flex flex-wrap gap-2">
        {filters.map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`gth-btn min-h-11 ${filter === key ? "gth-btn-gold" : ""}`}>{label}</button>)}
      </div>
      <p role="status" className="mt-3 text-sm text-[var(--text-soft)]">{visible.length ? `${visible.length} recorded ${visible.length === 1 ? "observation" : "observations"}` : "No recorded observations match this filter."}</p>
      {visible.length > 0 && <div role="region" tabIndex={0} aria-label="Observed asking-price history" className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead><tr>{["Observed (UTC)", "Unit reference", "Purpose", "Asking price", "Prior asking price", "Change"].map(label => <th key={label} scope="col" className="p-3">{label}</th>)}</tr></thead>
          <tbody>{visible.map(({ row, change }) => {
            const time = Date.parse(row.recorded_at)
            return <tr key={row.id} className="border-t border-[var(--border)]">
              <td className="p-3">{Number.isFinite(time) ? observedDate.format(time) : "Date not supplied"}</td>
              <th scope="row" className="p-3 font-normal">{row.inventory_id.slice(0, 8)}</th>
              <td className="p-3">{row.listing_type === "rent" ? "Rent" : row.listing_type === "buy" ? "Sale" : "Not supplied"}</td>
              <td className="p-3">{money(row.amount, row.currency)}</td>
              <td className="p-3">{change && row.previous_amount !== null ? money(row.previous_amount, row.currency) : "No comparable prior price"}</td>
              <td className="p-3">{change ? change.amount === 0 ? "No change" : `${money(change.amount, row.currency, true)} (${percent.format(change.ratio)})` : "—"}</td>
            </tr>
          })}</tbody>
        </table>
      </div>}
    </>}
  </section>
}
