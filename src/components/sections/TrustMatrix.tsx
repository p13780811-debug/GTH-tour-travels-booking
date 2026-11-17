// GTH INJECTION POINT: ENTERPRISE TRUST STRIP
// TrustMatrix — first-party capability descriptions, responsive.
import { ShieldCheck, Lock, BadgeCheck, Globe2, Server, Scale } from "lucide-react";

const COMPLIANCE = [
  { icon: ShieldCheck, label: "Source-aware Research" },
  { icon: Lock, label: "Provider-Operated Checkout" },
  { icon: BadgeCheck, label: "Account-scoped Workflows" },
  { icon: Globe2, label: "Data Transparency" },
  { icon: Server, label: "Global Discovery" },
  { icon: Scale, label: "Independent Handoffs" },
];

const PARTNERS = ["GTH STAYS", "GTH BOOKING", "GTH REAL ESTATE", "GTH TENDERS", "GTH MOBILITY", "GTH EVENTS", "GTH EXPERIENCES", "GTH RESEARCH"];

export default function TrustMatrix() {
  return (
    <section className="gth-glass p-6 md:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--gth-gold)]">GTH PRO Capabilities</p>
          <h3 className="mt-1 text-xl font-semibold text-[color:var(--gth-text)]">
            GTH PRO Global · Connected Enterprise Discovery.
          </h3>
        </div>
        <span className="text-xs text-[color:var(--gth-text-soft)]">Research, handoffs and account-scoped workflows</span>
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
