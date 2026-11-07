export default function RegistryDetails({ property }: { property: Record<string, unknown> }) {
 const fields = [
  ["Registration reference", property.rera_id],
  ["Developer", property.developer || property.builder_name],
  ["City", property.city],
  ["District", property.district],
  ["State", property.state],
  ["Country", property.country],
  ["Registration date", property.registration_date],
  ["Recorded completion date", property.completion_date],
  ["Record source", property.ingestion_source],
  ["Official source reference", property.official_source_reference],
  ["Last source verification recorded", property.last_verified_at],
 ]
 const rows = fields.filter(([, value]) => typeof value === "string" && value.trim() && !/not provided/i.test(value))
 const officialSource = typeof property.official_source_url === "string" ? property.official_source_url : ""
 const isHistoricRegistry = property.source_type === "registry" && typeof property.ingestion_source === "string" &&
  /maharera/i.test(property.ingestion_source)
 const isGenericOfficialSearch = /^https:\/\/(?:www\.)?maharera\.maharashtra\.gov\.in\/projects-search-result\/?$/.test(officialSource)
 const reference=typeof property.rera_id==="string"&&/^P[0-9]{11}$/.test(property.rera_id)?property.rera_id:""

 if (!rows.length && !officialSource) return <section className="gth-glass rounded-3xl p-6 md:p-8 mt-6"><h2 className="text-2xl font-bold">Project records</h2><p className="text-sm opacity-70 leading-7 mt-4">Developer and registration details have not been provided for this listing. Request the supporting documents from the listing contact.</p></section>

 return <section className="gth-glass rounded-3xl p-6 md:p-8 mt-6">
  <p className="gold-text text-xs uppercase tracking-widest">Project records</p>
  <h2 className="text-2xl font-bold mt-3">Recorded project details</h2>
  <dl className="grid sm:grid-cols-2 gap-5 mt-6">{rows.map(([label, value]) => <div key={String(label)}><dt className="text-sm opacity-70">{String(label)}</dt><dd className="font-medium mt-2 break-words">{String(value)}</dd></div>)}</dl>
  {isHistoricRegistry && <p className="mt-6 text-sm leading-7 text-[var(--text-soft)]">
    This record comes from an imported MahaRERA data snapshot, not a live approval or possession-status feed.
    Current registration, extensions, corrections and possession must be checked on the official portal.
  </p>}
  {officialSource && <div className="mt-6">
    <a href={officialSource} target="_blank" rel="noopener noreferrer" className="gth-btn inline-flex">
      {isGenericOfficialSearch ? "Open MahaRERA project search" : "Open official MahaRERA source"}
    </a>
    {isGenericOfficialSearch && reference && <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">
      Search on the official portal using registration number <strong>{reference}</strong>.
      This link opens the search page, not an individually verified project-detail deep link.
    </p>}
  </div>}
  <p className="text-sm opacity-70 mt-6">This public registry record is informational. A registry reference does not represent GTH verification, current availability, pricing or an offer to sell.</p>
 </section>
}
