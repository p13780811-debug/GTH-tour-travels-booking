import Link from "next/link";
import { MapPin, ShieldCheck, TrainFront } from "lucide-react";
import { coverage, type ExplorerProperty } from "@/lib/real-estate/explorer";

type Evidence = Pick<ExplorerProperty, "title" | "slug" | "location" | "city" | "country" | "rera_id" | "verified" | "last_verified_at" | "official_source_url" | "lat" | "lng" | "data_quality_limited" | "inventory_min_price" | "inventory_currency" | "beds" | "sqft">;

export default function LocalityEvidence({ property }: { property: Evidence }) {
  const hasCoordinates = typeof property.lat === "number" && typeof property.lng === "number" &&
    Number.isFinite(property.lat) && Number.isFinite(property.lng) &&
    Math.abs(property.lat) <= 90 && Math.abs(property.lng) <= 180;
  const officialUrl = typeof property.official_source_url === "string" &&
    /^https:\/\/(?:www\.)?maharera\.maharashtra\.gov\.in\//i.test(property.official_source_url)
    ? property.official_source_url : "";
  const verifiedDate = property.verified && property.last_verified_at &&
    !Number.isNaN(Date.parse(property.last_verified_at))
    ? new Date(property.last_verified_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const score = coverage(property as ExplorerProperty).score;
  return <section aria-label="GTH locality and record evidence" className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--text)]">
    <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={19} aria-hidden="true" /> Locality & record intelligence</h2>
    <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">
      Record completeness: <strong>{score}/100</strong> — this measures recorded fields, not safety or regulatory compliance.
    </p>
    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-[var(--border)] p-3">
        <dt className="text-xs text-[var(--text-soft)]">Registration evidence</dt>
        <dd className="mt-1 text-sm font-semibold">{property.rera_id ? "RERA reference recorded" : "RERA reference unavailable"}</dd>
        {property.rera_id && <p className="mt-1 break-all text-xs text-[var(--text-soft)]">{property.rera_id}</p>}
        {officialUrl && <Link href={officialUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs underline">Check official MahaRERA record</Link>}
      </div>
      <div className="rounded-xl border border-[var(--border)] p-3">
        <dt className="text-xs text-[var(--text-soft)]">Review status</dt>
        <dd className="mt-1 text-sm font-semibold">{verifiedDate ? "GTH reviewed · " + verifiedDate : "Independent verification pending"}</dd>
        <p className="mt-1 text-xs text-[var(--text-soft)]">Recorded registration is not automatic verification.</p>
      </div>
      <div className="rounded-xl border border-[var(--border)] p-3">
        <dt className="flex items-center gap-1 text-xs text-[var(--text-soft)]"><MapPin size={13} /> Map evidence</dt>
        <dd className="mt-1 text-sm font-semibold">{hasCoordinates ? "Stored coordinates available" : "Exact coordinates unavailable"}</dd>
        <p className="mt-1 text-xs text-[var(--text-soft)]">Coordinates are not proof of an independently verified site address.</p>
      </div>
      <div className="rounded-xl border border-[var(--border)] p-3">
        <dt className="flex items-center gap-1 text-xs text-[var(--text-soft)]"><TrainFront size={13} /> Metro & airport connectivity</dt>
        <dd className="mt-1 text-sm font-semibold">Not yet independently measured</dd>
        <p className="mt-1 text-xs text-[var(--text-soft)]">No guessed distances, traffic times or route scores.</p>
      </div>
    </dl>
  </section>;
}
