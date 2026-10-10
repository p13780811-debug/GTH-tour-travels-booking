export default function RegistryDetails({ property }: { property: Record<string, unknown> }) {
 const fields = [["Registration reference",property.rera_id],["Developer",property.developer || property.builder_name],["District",property.district],["State",property.state],["Country",property.country],["Registration date",property.registration_date],["Recorded completion date",property.completion_date],["Ingestion source",property.ingestion_source]]
 const rows = fields.filter(([,value]) => typeof value === "string" && value.trim() && !value.includes("not provided"))
 if (!rows.length) return null
 return <section className="gth-glass rounded-3xl p-6 mt-6"><h2 className="gold-text text-xl font-bold">Recorded project details</h2><dl className="grid sm:grid-cols-2 gap-4 mt-4">{rows.map(([label,value]) => <div key={String(label)}><dt className="text-sm text-[var(--muted)]">{String(label)}</dt><dd>{String(value)}</dd></div>)}</dl><p className="text-sm text-[var(--muted)] mt-4">A registry reference does not confirm current availability, pricing or GTH verification.</p></section>
}
