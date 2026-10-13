export default function RegistryDetails({ property }: { property: Record<string, unknown> }) {
 const fields = [
  ["Registration reference", property.rera_id],
  ["Developer", property.developer || property.builder_name],
  ["District", property.district],
  ["State", property.state],
  ["Country", property.country],
  ["Registration date", property.registration_date],
  ["Recorded completion date", property.completion_date],
  ["Record source", property.ingestion_source],
  ["Official source reference", property.official_source_reference],
 ]
 const rows = fields.filter(([, value]) => typeof value === "string" && value.trim() && !/not provided/i.test(value))
 const officialSource = typeof property.official_source_url === "string" ? property.official_source_url : ""

 if (!rows.length && !officialSource) return <section className="gth-glass rounded-3xl p-6 md:p-8 mt-6"><h2 className="text-2xl font-bold">Project records</h2><p className="text-sm opacity-70 leading-7 mt-4">Developer and registration details have not been provided for this listing. Request the supporting documents from the listing contact.</p></section>

 return <section className="gth-glass rounded-3xl p-6 md:p-8 mt-6">
  <p className="gold-text text-xs uppercase tracking-widest">Project records</p>
  <h2 className="text-2xl font-bold mt-3">Recorded project details</h2>
  <dl className="grid sm:grid-cols-2 gap-5 mt-6">{rows.map(([label, value]) => <div key={String(label)}><dt className="text-sm opacity-70">{String(label)}</dt><dd className="font-medium mt-2 break-words">{String(value)}</dd></div>)}</dl>
  {officialSource && <a href={officialSource} target="_blank" rel="noopener noreferrer" className="gth-btn inline-flex mt-6">Open official MahaRERA source</a>}
  <p className="text-sm opacity-70 mt-6">This public registry record is informational. A registry reference does not represent GTH verification, current availability, pricing or an offer to sell.</p>
 </section>
}
