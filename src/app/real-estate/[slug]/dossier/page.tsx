import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PropertyService } from "@/lib/real-estate/propertyService";
import { validPropertySlug } from "@/lib/real-estate/property-seo";
import { getPublishedProjectMedia, projectCover, publishedMediaUrl } from "@/lib/property-media/published-media";
import DossierActions from "@/components/real-estate/DossierActions";
import LocalityEvidence from "@/components/real-estate/LocalityEvidence";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Property Dossier | GTH PRO", robots: { index: false, follow: false } };

export default async function PropertyDossier({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!validPropertySlug(slug)) notFound();
  const property = await PropertyService.getBySlug(slug);
  if (!property) notFound();
  const media = await getPublishedProjectMedia([Number(property.id)]);
  const cover = projectCover(media);
  const isRegistry = Boolean(property.registry_only || property.data_quality_limited || property.source_type === "registry");
  const officialUrl = typeof property.official_source_url === "string" &&
    /^https:\/\/(?:www\.)?maharera\.maharashtra\.gov\.in\//i.test(property.official_source_url)
    ? property.official_source_url : "";
  const canonical = "/real-estate/" + encodeURIComponent(slug);
  const dossierUrl = canonical + "/dossier";
  const facts: [string, string][] = [
    ["Project / property", String(property.title || "Not recorded")],
    ["City", String(property.city || "Not recorded")],
    ["Locality", String(property.location || "Not recorded")],
    ["Registered developer", String(property.developer || property.builder_name || "Not recorded")],
    ["RERA registration", String(property.rera_id || "Not recorded")],
    ["Record type", isRegistry ? "Registered project record; not an active listing" : "Published property record"],
    ["Pricing", isRegistry ? "Request current inventory and pricing" : String(property.formatted_price || "Price on request")],
    ["Last reviewed", property.verified && property.last_verified_at ? String(property.last_verified_at).slice(0,10) : "Not independently confirmed"],
  ];
  return <main className="gth-container min-h-screen bg-[var(--bg)] py-8 text-[var(--text)] print:py-0">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
      <Link href={canonical} className="text-sm underline">← Back to property</Link>
      <DossierActions title={String(property.title)} url={typeof process.env.NEXT_PUBLIC_SITE_URL === "string" && /^https:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL) ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "") + dossierUrl : "https://gthproglobal.com" + dossierUrl} printMode />
    </div>
    <article className="mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-9 print:border-0 print:p-0">
      <header className="border-b border-[var(--border)] pb-6">
        <p className="text-xs font-bold tracking-widest text-[var(--gold)]">GTH PRO • GLOBAL TECHNICAL HUB</p>
        <h1 className="mt-4 text-3xl font-bold leading-tight">{property.title}</h1>
        <p className="mt-3 text-sm text-[var(--text-soft)]">Luxury property research dossier · Source-aware record summary</p>
        <p className="mt-3 text-xs text-[var(--text-soft)]">Generated on {new Date().toLocaleDateString("en-IN", { timeZone:"UTC", day:"numeric", month:"short", year:"numeric" })} · Not an ownership certificate or legal due-diligence report</p>
      </header>
      {cover && <figure className="mt-6">
        <img src={publishedMediaUrl(cover.id)} alt={String(property.title) + " approved " + cover.media_type} className="max-h-80 w-full rounded-xl object-contain" />
        <figcaption className="mt-2 text-xs text-[var(--text-soft)]">
          {cover.media_type === "render" ? "Reviewed architectural render; not a site photograph." : "Rights-reviewed published project image."}
          {cover.attribution ? " Credit: " + cover.attribution : ""}
        </figcaption>
      </figure>}
      <h2 className="mt-8 text-xl font-semibold">Recorded project facts</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">{facts.map(([label,value]) =>
        <div key={label} className="rounded-xl border border-[var(--border)] p-3">
          <dt className="text-xs text-[var(--text-soft)]">{label}</dt>
          <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
        </div>
      )}</dl>
      {property.description && <section className="mt-6">
        <h2 className="text-lg font-semibold">Source summary</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-7">{String(property.description).slice(0,1400)}</p>
      </section>}
      <LocalityEvidence property={property} />
      <section className="mt-8 border-t border-[var(--border)] pt-5">
        <h2 className="text-lg font-semibold">Next steps</h2>
        <p className="mt-2 text-sm leading-7">Ask for current inventory, documentation, ownership status and site access directly from authorized parties. Verify regulatory status through the official portal.</p>
        {officialUrl && <a href={officialUrl} className="mt-3 block break-all text-sm underline">Official MahaRERA source: {officialUrl}</a>}
        <p className="mt-3 text-sm">GTH PRO contact: <a className="underline" href="mailto:official@gthproglobal.com">official@gthproglobal.com</a></p>
        <p className="mt-2 break-all text-xs text-[var(--text-soft)]">Property reference: https://gthproglobal.com{canonical}</p>
      </section>
      <footer className="mt-8 border-t border-[var(--border)] pt-4 text-xs leading-6 text-[var(--text-soft)]">
        GTH PRO displays source-backed research information. Registry data does not establish active inventory, current pricing, seller authority, title, or transaction readiness.
      </footer>
    </article>
  </main>;
}
