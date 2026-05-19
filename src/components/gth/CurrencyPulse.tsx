// GTH INJECTION POINT: LIVE FX STREAM
// CurrencyPulse — compact live FX widget with delta indicators + sparkline.
// Data source: Lovable Cloud `fx_rates` table (graceful mock fallback until enabled).
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Activity } from "lucide-react";

type FxRow = { pair: string; rate: number; series: number[] };

const SEED: FxRow[] = [
    { pair: "USD/EUR", rate: 0.9234, series: [0.918, 0.921, 0.92, 0.924, 0.922, 0.925, 0.9234] },
    { pair: "USD/GBP", rate: 0.7891, series: [0.792, 0.79, 0.788, 0.791, 0.787, 0.79, 0.7891] },
    { pair: "USD/JPY", rate: 154.21, series: [153.1, 153.6, 154.0, 154.4, 154.1, 154.3, 154.21] },
    { pair: "USD/AED", rate: 3.6725, series: [3.671, 3.673, 3.672, 3.674, 3.673, 3.672, 3.6725] },
    { pair: "EUR/INR", rate: 91.42, series: [90.8, 91.0, 91.2, 91.5, 91.3, 91.4, 91.42] },
];

function Spark({ data }: { data: number[] }) {
    const { d, up } = useMemo(() => {
        const min = Math.min(...data), max = Math.max(...data);
        const range = max - min || 1;
        const pts = data.map((v, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 24 - ((v - min) / range) * 22 - 1;
            return `${x},${y}`;
        });
        return { d: `M ${pts.join(" L ")}`, up: data[data.length - 1] >= data[0] };
    }, [data]);
    return (
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-6 w-20">
            <path d={d} fill="none" stroke={up ? "var(--gth-success)" : "var(--gth-danger)"} strokeWidth="1.5" />
        </svg>
    );
}

export default function CurrencyPulse() {
    const [rows, setRows] = useState<FxRow[]>(SEED);

    // GTH INJECTION POINT: SUPABASE FX SUBSCRIPTION
    // Replace with: supabase.from('fx_rates').select(...) + realtime channel.
    useEffect(() => {
        const t = setInterval(() => {
            setRows((prev) =>
                prev.map((r) => {
                    const drift = (Math.random() - 0.5) * r.rate * 0.0015;
                    const next = +(r.rate + drift).toFixed(r.rate > 10 ? 2 : 4);
                    return { ...r, rate: next, series: [...r.series.slice(1), next] };
                }),
            );
        }, 2200);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="gth-glass p-5">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[color:var(--gth-gold)]" />
                    <h3 className="text-sm font-semibold tracking-wide text-[color:var(--gth-text)]">CurrencyPulse</h3>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--gth-text-soft)]">Live · GTH FX</span>
            </div>
            <ul className="space-y-2">
                {rows.map((r) => {
                    const delta = r.series[r.series.length - 1] - r.series[0];
                    const pct = (delta / r.series[0]) * 100;
                    const up = delta >= 0;
                    return (
                        <motion.li
                            key={r.pair}
                            layout
                            className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/[0.03] transition"
                        >
                            <span className="font-mono text-xs text-[color:var(--gth-text-soft)]">{r.pair}</span>
                            <Spark data={r.series} />
                            <span className="font-mono text-sm text-[color:var(--gth-text)] tabular-nums w-20 text-right">
                                {r.rate}
                            </span>
                            <span
                                className={`flex items-center gap-1 font-mono text-xs tabular-nums w-16 justify-end ${up ? "text-[color:var(--gth-success)]" : "text-[color:var(--gth-danger)]"
                                    }`}
                            >
                                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {pct.toFixed(2)}%
                            </span>
                        </motion.li>
                    );
                })}
            </ul>
        </div>
    );
}
