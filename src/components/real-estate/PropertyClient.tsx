"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
    Sparkles,
    Building2,
    Crown,
    TrendingUp,
    Activity,
    Search,
    ShieldCheck,
    Layers3,
} from "lucide-react";

import { PropertyService } from "@/lib/real-estate/propertyService";
import { parseSearch } from "@/lib/real-estate/searchEngine";

import PropertyGrid from "./PropertyGrid";
import SearchPanel from "./SearchPanel";
import RealEstateHero from "./RealEstateHero";
import AddPropertyModal from "./AddPropertyModal";
import LeadsDashboard from "./LeadsDashboard";
import AIChat from "@/components/AIChat";

export default function PropertyClient() {

    // =========================
    // STATE
    // =========================

    const [properties, setProperties] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [query, setQuery] = useState("");

    const [active, setActive] = useState<any>(null);

    const [showAdd, setShowAdd] = useState(false);
    const [showDash, setShowDash] = useState(false);

    const [loading, setLoading] = useState(true);

    // =========================
    // LOAD
    // =========================

    useEffect(() => {
        load();
    }, []);

    async function load() {

        try {

            setLoading(true);

            const data = await PropertyService.getAll();

            // 🔥 BOOST ENGINE

            const now = new Date();

            const boosted = data.filter(
                (p) =>
                    p.is_featured &&
                    p.boost_expiry &&
                    new Date(p.boost_expiry) > now
            );

            const normal = data.filter(
                (p) =>
                    !p.is_featured ||
                    !p.boost_expiry ||
                    new Date(p.boost_expiry) <= now
            );

            const finalData = [...boosted, ...normal];

            setProperties(finalData);
            setFiltered(finalData);

        } catch (err) {

            console.error("Property load failed", err);

        } finally {

            setLoading(false);
        }
    }

    // =========================
    // SEARCH ENGINE
    // =========================

    function search() {

        const filters = parseSearch(query);

        const result = properties.filter((p) => {

            const price = Number(p.price) || 0;

            return (
                (!filters.city ||
                    p.location?.toLowerCase().includes(filters.city)) &&

                (!filters.type ||
                    p.title?.toLowerCase().includes(filters.type)) &&

                price >= filters.minPrice &&
                price <= filters.maxPrice
            );
        });

        // 🔥 BOOST PRIORITY

        const now = new Date();

        const boosted = result.filter(
            (p) =>
                p.is_featured &&
                p.boost_expiry &&
                new Date(p.boost_expiry) > now
        );

        const normal = result.filter(
            (p) =>
                !p.is_featured ||
                !p.boost_expiry ||
                new Date(p.boost_expiry) <= now
        );

        const finalData = [...boosted, ...normal];

        setFiltered(finalData);
    }

    // =========================
    // STATS
    // =========================

    const stats = useMemo(() => {

        const featured = properties.filter((p) => p.is_featured).length;

        return {
            total: properties.length,
            featured,
            cities: new Set(
                properties.map((p) => p.location)
            ).size,
        };

    }, [properties]);

    // =========================
    // LOADING UI
    // =========================

    if (loading) {
        return (

            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] text-[var(--text)]">

                {/* glow */}

                <div className="absolute inset-0 overflow-hidden">

                    <div className="absolute top-[-180px] left-[-100px] h-[420px] w-[420px] rounded-full bg-[#d4af37]/10 blur-3xl" />

                    <div className="absolute bottom-[-200px] right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />

                </div>

                <div className="relative z-10 flex flex-col items-center">

                    <div className="relative mb-8 flex h-28 w-28 items-center justify-center rounded-[32px] border border-[#d4af37]/20 bg-white/[0.04] backdrop-blur-2xl">

                        <div className="absolute inset-0 rounded-[32px] border border-white/10" />

                        <div className="absolute h-full w-full animate-spin rounded-[32px] border-t-2 border-[#d4af37]" />

                        <Building2
                            size={34}
                            className="text-[#d4af37]"
                        />
                    </div>

                    <h2 className="text-3xl font-black tracking-tight">
                        GTH{" "}

                        <span className="bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-transparent italic">
                            PRIME ESTATE
                        </span>
                    </h2>

                    <p className="mt-3 text-[11px] uppercase tracking-[0.4em] opacity-60 font-bold">
                        Initializing Luxury Property Engine
                    </p>

                </div>
            </div>
        );
    }

    // =========================
    // MAIN UI
    // =========================

    return (

        <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)] transition-all duration-500">

            {/* ========================= */}
            {/* GLOBAL GLOW */}
            {/* ========================= */}

            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute top-[-220px] left-[-120px] h-[520px] w-[520px] rounded-full bg-[#d4af37]/10 blur-3xl" />

                <div className="absolute right-[-180px] top-[20%] h-[460px] w-[460px] rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="absolute bottom-[-220px] left-[20%] h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-3xl" />

            </div>

            {/* ========================= */}
            {/* TOP STATUS BAR */}
            {/* ========================= */}

            <div className="relative z-20 border-b border-white/10 bg-white/[0.03] backdrop-blur-2xl">

                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">

                    {/* brand */}

                    <div className="flex items-center gap-4">

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_30px_rgba(212,175,55,0.35)]">
                            <Crown size={24} />
                        </div>

                        <div>

                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                                GTH{" "}

                                <span className="bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-transparent italic">
                                    PRIME ESTATE
                                </span>
                            </h1>

                            <p className="mt-1 text-[10px] uppercase tracking-[0.35em] opacity-60 font-bold">
                                Luxury AI Real Estate Matrix
                            </p>
                        </div>
                    </div>

                    {/* stats */}

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">

                            <div className="mb-2 flex items-center justify-between">

                                <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 font-bold">
                                    Listings
                                </span>

                                <Layers3
                                    size={15}
                                    className="text-cyan-400"
                                />
                            </div>

                            <h3 className="text-xl font-black">
                                {stats.total}
                            </h3>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">

                            <div className="mb-2 flex items-center justify-between">

                                <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 font-bold">
                                    Featured
                                </span>

                                <Sparkles
                                    size={15}
                                    className="text-[#d4af37]"
                                />
                            </div>

                            <h3 className="text-xl font-black">
                                {stats.featured}
                            </h3>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">

                            <div className="mb-2 flex items-center justify-between">

                                <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 font-bold">
                                    Markets
                                </span>

                                <TrendingUp
                                    size={15}
                                    className="text-emerald-400"
                                />
                            </div>

                            <h3 className="text-xl font-black">
                                {stats.cities}
                            </h3>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">

                            <div className="mb-2 flex items-center justify-between">

                                <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 font-bold">
                                    Engine
                                </span>

                                <Activity
                                    size={15}
                                    className="text-purple-400"
                                />
                            </div>

                            <h3 className="text-xl font-black">
                                LIVE
                            </h3>
                        </div>

                    </div>
                </div>
            </div>

            {/* ========================= */}
            {/* HERO */}
            {/* ========================= */}

            <div className="relative z-10">
                <RealEstateHero
                    query={query}
                    setQuery={setQuery}
                    onSearch={search}
                />
            </div>

            {/* ========================= */}
            {/* SEARCH PANEL */}
            {/* ========================= */}

            <div className="relative z-20 mx-auto mt-[-30px] max-w-7xl px-4 md:px-6">

                <motion.div
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-[32px] border border-white/10 bg-white/[0.04] p-2 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.18)]"
                >
                    <SearchPanel
                        onAdd={() => setShowAdd(true)}
                        onDashboard={() => setShowDash(true)}
                    />
                </motion.div>
            </div>

            {/* ========================= */}
            {/* AI STATUS BAR */}
            {/* ========================= */}

            <div className="relative z-10 mx-auto mt-6 max-w-7xl px-4 md:px-6">

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-2xl">

                    <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_25px_rgba(212,175,55,0.3)]">
                            <Search size={20} />
                        </div>

                        <div>

                            <h3 className="text-lg font-black tracking-tight">
                                AI Property Discovery Engine
                            </h3>

                            <p className="text-sm opacity-60">
                                Personalized recommendations • Premium ranking • Smart filtering
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em]">

                        <ShieldCheck
                            size={14}
                            className="text-emerald-400"
                        />

                        Verified Luxury Network
                    </div>
                </div>
            </div>

            {/* ========================= */}
            {/* PROPERTY GRID */}
            {/* ========================= */}

            <div className="relative z-10">

                <PropertyGrid
                    properties={filtered}
                    setActive={setActive}
                />
            </div>

            {/* ========================= */}
            {/* MODALS */}
            {/* ========================= */}

            <AnimatePresence>

                {showAdd && (
                    <AddPropertyModal
                        onClose={() => setShowAdd(false)}
                        onSave={async (data: any) => {
                            await PropertyService.add(data);
                            await load();
                            setShowAdd(false);
                        }}
                    />
                )}

            </AnimatePresence>

            <AnimatePresence>

                {showDash && (
                    <LeadsDashboard
                        onClose={() => setShowDash(false)}
                        properties={properties}
                    />
                )}

            </AnimatePresence>

            {/* ========================= */}
            {/* AI CHAT LAYER */}
            {/* ========================= */}

            <div className="ai-floating-safe">

                <AIChat
                    properties={properties}
                    setFiltered={setFiltered}
                    setActive={setActive}
                />

            </div>
        </div>
    );
}