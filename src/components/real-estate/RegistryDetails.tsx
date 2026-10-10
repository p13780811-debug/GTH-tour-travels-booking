export default function RegistryDetails({ property }: { property: Record<string, unknown> }) {
 const fields = [["Registration reference",property.rera_id],["Developer",property.developer || property.builder_name],["District",property.district],["State",property.state],["Country",property.country],["Registration date",property.registration_date],["Recorded completion date",property.completion_date],["Record source",property.ingestion_source]]
 const rows = fields.filter(([,value]) => typeof value === "string" && value.trim() && !value.includes("not provided"))
 if (!rows.length) return null
 return <section className="gth-glass rounded-3xl p-6 md:p-8 mt-6"><p className="gold-text text-xs uppercase tracking-widest">Project records</p><h2 className="text-2xl font-bold mt-3">Recorded project details</h2><dl className="grid sm:grid-cols-2 gap-5 mt-6">{rows.map(([label,value]) => <div key={String(label)}><dt className="text-sm opacity-70">{String(label)}</dt><dd className="font-medium mt-2 break-words">{String(value)}</dd></div>)}</dl><p className="text-sm opacity-70 mt-6">A registry reference does not confirm current availability, pricing or GTH verification.</p></section>
}
