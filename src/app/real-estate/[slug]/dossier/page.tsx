import { notFound } from "next/navigation";
import Link from "next/link";
import { PropertyService } from "@/lib/real-estate/propertyService";
import { validPropertySlug } from "@/lib/real-estate/property-seo";
import PrintDossier from "@/components/real-estate/PrintDossier";
export const dynamic = "force-dynamic";
export const metadata = { title: "Property dossier | GTH PRO", robots: { index: false, follow: false } };
export default async function DossierPage({params}: {params: Promise<{slug:string}>}) {
 const {slug} = await params;
 if (!validPropertySlug(slug)) notFound();
 const property = await PropertyService.getBySlug(slug);
 if (!property) notFound();
 const title = String(property.title || "Property");
 const city = String(property.city || property.location || "Not recorded");
 const reference = typeof property.rera_id === "string" ? property.rera_id : "";
 const source = typeof property.official_source_url === "string" && /^https:\/\//.test(property.official_source_url) ? property.official_source_url : "";
 const pageUrl = "/real-estate/" + encodeURIComponent(slug);
 return <main className="mx-auto max-w-3xl px-5 py-10 text-[var(--text)]">
  <nav className="print:hidden"><Link href={pageUrl} className="underline">← Return to project</Link></nav>
  <header className="mt-8 border-b border-[var(--border)] pb-6"><p className="text-xs font-bold tracking-widest text-[var(--gold)]">GTH PRO · PROPERTY RESEARCH DOSSIER</p><h1 className="mt-3 text-3xl font-bold">{title}</h1><p className="mt-2">{city}</p></header>
  <section className="mt-6 space-y-4 text-sm leading-7">
   <p><strong>Registry reference:</strong> {reference || "Not recorded"}</p>
   <p><strong>Current inventory:</strong> Not independently confirmed by this export. Visit the current project page for published inventory and enquiries.</p>
   <p><strong>Source:</strong> {source ? <a className="underline break-all" href={source} rel="noopener noreferrer">{source}</a> : "Official source not supplied"}</p>
   <p><strong>Contact:</strong> official@gthproglobal.com</p>
   <p className="border-t border-[var(--border)] pt-4 text-xs">Research summary, not a legal title report, financial recommendation, verified site inspection or booking confirmation. Confirm all details with the relevant authorities and provider. Photographs are intentionally omitted unless rights-cleared for redistribution.</p>
  </section>
  <PrintDossier title={title} url={pageUrl}/>
 </main>;
}
