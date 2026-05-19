// GTH INJECTION POINT: ENTERPRISE TRUST STRIP
// TrustMatrix — compliance badges + partner logo placeholders, responsive.
import { ShieldCheck, Lock, BadgeCheck, Globe2, Server, Scale } from "lucide-react";

const COMPLIANCE = [
  { icon: ShieldCheck, label: "SOC 2 Type II" },
  { icon: Lock, label: "PCI DSS L1" },
  { icon: BadgeCheck, label: "ISO 27001" },
  { icon: Globe2, label: "GDPR · CCPA" },
  { icon: Server, label: "99.999% SLA" },
  { icon: Scale, label: "IATA Accredited" },
];

const PARTNERS = ["EMIRATES", "MARRIOTT", "AMADEUS", "SABRE", "BOOKING", "AIRBNB", "EUROSTAR", "ACCOR"];

export default function TrustMatrix() {
  return (
    <section className="gth-glass p-6 md:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--gth-gold)]">Trust Matrix</p>
          <h3 className="mt-1 text-xl font-semibold text-[color:var(--gth-text)]">
            Enterprise-grade. Audited. Globally compliant.
          </h3>
        </div>
        <span className="text-xs text-[color:var(--gth-text-soft)]">Trusted by 4,200+ corporate travel desks</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {COMPLIANCE.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="gth-glass-soft flex flex-col items-center justify-center gap-2 px-3 py-4 text-center"
          >
            <Icon className="h-5 w-5 text-[color:var(--gth-gold)]" />
            <span className="text-xs font-medium text-[color:var(--gth-text)]">{label}</span>
          </div>
        ))}
      </div>

      <div className="gth-divider my-6" />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[color:var(--gth-border)] sm:grid-cols-4 lg:grid-cols-8">
        {PARTNERS.map((p) => (
          <div
            key={p}
            className="flex h-14 items-center justify-center bg-white/[0.02] font-mono text-[11px] font-semibold tracking-[0.2em] text-[color:var(--gth-text-soft)] transition hover:bg-white/[0.05] hover:text-[color:var(--gth-text)]"
          >
            {p}
          </div>
        ))}
      </div>
    </section>
  );
}
