"use client";

// GTH INJECTION POINT: PARTNER ORBIT CLOUD
// PartnerOrbit — orbital partner logo cloud across airlines, hotel chains, MLS, rail.
import { motion } from "framer-motion";
import { Plane, Hotel, Train, Building2 } from "lucide-react";

type Ring = {
  radius: number;
  duration: number;
  reverse?: boolean;
  items: { label: string; icon: typeof Plane }[];
};

const RINGS: Ring[] = [
  {
    radius: 110, duration: 38,
    items: [
      { label: "Emirates", icon: Plane },
      { label: "Qatar", icon: Plane },
      { label: "Singapore", icon: Plane },
      { label: "Lufthansa", icon: Plane },
      { label: "ANA", icon: Plane },
    ],
  },
  {
    radius: 170, duration: 52, reverse: true,
    items: [
      { label: "Marriott", icon: Hotel },
      { label: "Hilton", icon: Hotel },
      { label: "Accor", icon: Hotel },
      { label: "Hyatt", icon: Hotel },
      { label: "Four Seasons", icon: Hotel },
      { label: "IHG", icon: Hotel },
    ],
  },
  {
    radius: 230, duration: 68,
    items: [
      { label: "Zillow MLS", icon: Building2 },
      { label: "Sotheby's", icon: Building2 },
      { label: "Knight Frank", icon: Building2 },
      { label: "Eurostar", icon: Train },
      { label: "SNCF", icon: Train },
      { label: "JR East", icon: Train },
      { label: "Trenitalia", icon: Train },
    ],
  },
];

export default function PartnerOrbit() {
  return (
    <section className="gth-glass relative overflow-hidden p-6 md:p-10">
      <div className="mb-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--gth-gold)]">Partner Orbit</p>
        <h3 className="mt-2 text-2xl font-semibold gth-text-gradient">A constellation of global suppliers</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[color:var(--gth-text-soft)]">
          Direct integrations across airlines, hotel chains, MLS feeds, and rail operators.
        </p>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[560px]">
        {/* center core */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="gth-glass-soft flex h-20 w-20 items-center justify-center">
            <span className="font-mono text-xs font-bold tracking-[0.2em] text-[color:var(--gth-gold)]">GTH</span>
          </div>
        </div>

        {RINGS.map((ring, ri) => (
          <div key={ri} className="absolute inset-0">
            <div
              className="absolute left-1/2 top-1/2 rounded-full border border-dashed"
              style={{
                width: ring.radius * 2, height: ring.radius * 2,
                marginLeft: -ring.radius, marginTop: -ring.radius,
                borderColor: "var(--gth-border)",
              }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2"
              style={{ width: 0, height: 0 }}
              animate={{ rotate: ring.reverse ? -360 : 360 }}
              transition={{ duration: ring.duration, repeat: Infinity, ease: "linear" }}
            >
              {ring.items.map((item, i) => {
                const angle = (i / ring.items.length) * Math.PI * 2;
                const x = Math.cos(angle) * ring.radius;
                const y = Math.sin(angle) * ring.radius;
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    className="absolute"
                    style={{ left: x, top: y, translate: "-50% -50%" }}
                    animate={{ rotate: ring.reverse ? 360 : -360 }}
                    transition={{ duration: ring.duration, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="gth-glass-soft flex items-center gap-1.5 px-2.5 py-1.5 whitespace-nowrap">
                      <Icon className="h-3 w-3 text-[color:var(--gth-gold)]" />
                      <span className="font-mono text-[10px] font-semibold tracking-wide text-[color:var(--gth-text)]">
                        {item.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
