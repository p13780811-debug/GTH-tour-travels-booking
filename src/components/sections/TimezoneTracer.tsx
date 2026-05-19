"use client";
// GTH INJECTION POINT: GLOBAL POP NETWORK TRACER
// TimezoneTracer — animated arcs connecting GTH points-of-presence with synchronized local times.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type POP = { code: string; city: string; tz: string; x: number; y: number };

// Coords on a 1000x500 equirectangular-ish canvas.
const POPS: POP[] = [
  { code: "SFO", city: "San Francisco", tz: "America/Los_Angeles", x: 130, y: 215 },
  { code: "JFK", city: "New York", tz: "America/New_York", x: 290, y: 210 },
  { code: "LHR", city: "London", tz: "Europe/London", x: 490, y: 180 },
  { code: "DXB", city: "Dubai", tz: "Asia/Dubai", x: 620, y: 240 },
  { code: "BLR", city: "Bengaluru", tz: "Asia/Kolkata", x: 705, y: 270 },
  { code: "SIN", city: "Singapore", tz: "Asia/Singapore", x: 790, y: 305 },
  { code: "HND", city: "Tokyo", tz: "Asia/Tokyo", x: 870, y: 220 },
  { code: "SYD", city: "Sydney", tz: "Australia/Sydney", x: 905, y: 380 },
];

const ARCS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [2, 4], [1, 3], [0, 2],
];

function arcPath(a: POP, b: POP) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.25;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

export default function TimezoneTracer() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (tz: string) =>
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz, hour12: false }).format(now);

  return (
    <div className="gth-glass relative overflow-hidden p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--gth-text)]">TimezoneTracer</h3>
          <p className="text-xs text-[color:var(--gth-text-soft)]">Synchronized GTH POP network · {POPS.length} regions</p>
        </div>
        <span className="rounded-full border border-[color:var(--gth-border)] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[color:var(--gth-text-soft)]">
          UTC {now.toISOString().slice(11, 16)}
        </span>
      </div>

      <div className="relative aspect-[2/1] w-full">
        <svg viewBox="0 0 1000 500" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="arc-grad" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--gth-accent)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--gth-gold)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--gth-accent)" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="pop-glow">
              <stop offset="0%" stopColor="var(--gth-gold)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--gth-gold)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* faint grid */}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="500" stroke="var(--gth-border)" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="var(--gth-border)" />
          ))}

          {ARCS.map(([i, j], idx) => (
            <g key={idx}>
              <path d={arcPath(POPS[i], POPS[j])} fill="none" stroke="var(--gth-border-strong)" strokeWidth="1" />
              <motion.path
                d={arcPath(POPS[i], POPS[j])}
                fill="none"
                stroke="url(#arc-grad)"
                strokeWidth="2"
                strokeDasharray="60 400"
                initial={{ strokeDashoffset: 460 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: idx * 0.3 }}
              />
            </g>
          ))}

          {POPS.map((p) => (
            <g key={p.code}>
              <circle cx={p.x} cy={p.y} r="22" fill="url(#pop-glow)" />
              <motion.circle
                cx={p.x} cy={p.y} r="4"
                fill="var(--gth-gold)"
                animate={{ r: [4, 7, 4], opacity: [0.9, 0.5, 0.9] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              />
            </g>
          ))}
        </svg>

        {/* POP labels overlay */}
        {POPS.map((p) => (
          <div
            key={p.code}
            className="absolute -translate-x-1/2 translate-y-2 text-center"
            style={{ left: `${(p.x / 1000) * 100}%`, top: `${(p.y / 500) * 100}%` }}
          >
            <div className="font-mono text-[10px] font-bold text-[color:var(--gth-gold)]">{p.code}</div>
            <div className="font-mono text-[10px] text-[color:var(--gth-text)] tabular-nums">{fmt(p.tz)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
