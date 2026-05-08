"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Phone, TrendingUp, Crown, Activity, CalendarDays, Search, Sparkles } from "lucide-react";

export default function LeadsDashboard({ onClose, properties }: any) {
    const [leads, setLeads] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from("leads")
                .select("*")
                .order("created_at", { ascending: false });

            setLeads(data || []);
        };

        fetch();
    }, []);

    const filteredLeads = useMemo(() => {
        return leads.filter((l) =>
            l.phone?.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, leads]);

    const boostedCount = properties.filter((p: any) => p.is_featured).length;
    const revenue = leads.length * 25;

    return (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-xl flex items-center justify-center p-3 md:p-6">

            {/* MAIN PANEL */}
            <div className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-[34px] border border-white/10 bg-[var(--card)] text-[var(--text)] shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">

                {/* BACKGROUND GLOW */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">

                    <div className="absolute top-[-120px] right-[-80px] h-[280px] w-[280px] rounded-full bg-[#d4af37]/10 blur-3xl" />

                    <div className="absolute bottom-[-120px] left-[-80px] h-[240px] w-[240px] rounded-full bg-cyan-500/10 blur-3xl" />
                </div>

                {/* HEADER */}
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 p-5 md:p-8 border-b border-white/10">

                    {/* LEFT */}
                    <div>

                        <div className="flex items-center gap-3 mb-3">

                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_25px_rgba(212,175,55,0.35)]">
                                <Sparkles size={22} />
                            </div>

                            <div>
                                <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-none">
                                    Leads{" "}
                                    <span className="bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] bg-clip-text text-transparent italic">
                                        Command Center
                                    </span>
                                </h2>

                                <p className="text-[10px] uppercase tracking-[0.35em] opacity-60 mt-2 font-bold">
                                    GTH PRO REAL ESTATE MATRIX
                                </p>
                            </div>
                        </div>

                        {/* SEARCH */}
                        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-4 py-3 max-w-md">

                            <Search size={18} className="opacity-60" />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search leads..."
                                className="bg-transparent outline-none w-full text-sm placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* RIGHT STATS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                        {/* REVENUE */}
                        <div className="min-w-[170px] rounded-3xl border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/15 to-[#b38728]/10 p-5 backdrop-blur-xl">

                            <div className="flex items-center justify-between mb-3">

                                <span className="text-[10px] uppercase tracking-[0.25em] opacity-70 font-bold">
                                    Revenue
                                </span>

                                <TrendingUp size={18} className="text-[#d4af37]" />
                            </div>

                            <h3 className="text-3xl font-black">
                                ₹{revenue}
                            </h3>

                            <p className="text-xs opacity-60 mt-1">
                                ₹25 per lead
                            </p>
                        </div>

                        {/* LEADS */}
                        <div className="min-w-[170px] rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">

                            <div className="flex items-center justify-between mb-3">

                                <span className="text-[10px] uppercase tracking-[0.25em] opacity-70 font-bold">
                                    Total Leads
                                </span>

                                <Activity size={18} className="text-cyan-400" />
                            </div>

                            <h3 className="text-3xl font-black">
                                {leads.length}
                            </h3>

                            <p className="text-xs opacity-60 mt-1">
                                Live database
                            </p>
                        </div>

                        {/* FEATURED */}
                        <div className="min-w-[170px] rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">

                            <div className="flex items-center justify-between mb-3">

                                <span className="text-[10px] uppercase tracking-[0.25em] opacity-70 font-bold">
                                    Featured
                                </span>

                                <Crown size={18} className="text-yellow-400" />
                            </div>

                            <h3 className="text-3xl font-black">
                                {boostedCount}
                            </h3>

                            <p className="text-xs opacity-60 mt-1">
                                Premium listings
                            </p>
                        </div>
                    </div>
                </div>

                {/* LEADS LIST */}
                <div className="relative z-10 overflow-y-auto max-h-[60vh] p-5 md:p-8 space-y-4">

                    {filteredLeads.length > 0 ? (
                        filteredLeads.map((l) => (
                            <div
                                key={l.id}
                                className="group relative rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6 transition-all duration-500 hover:border-[#d4af37]/30 hover:bg-[#d4af37]/[0.05] hover:scale-[1.01]"
                            >

                                {/* glow */}
                                <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-r from-[#d4af37]/5 via-transparent to-cyan-500/5" />

                                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                                    {/* LEFT */}
                                    <div className="flex items-center gap-4">

                                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#bf953f] via-[#fcf6ba] to-[#b38728] text-black shadow-[0_0_20px_rgba(212,175,55,0.25)]">
                                            <Phone size={22} />
                                        </div>

                                        <div>

                                            <p className="text-[10px] uppercase tracking-[0.25em] opacity-60 font-bold mb-1">
                                                Mobile Lead
                                            </p>

                                            <h3 className="text-xl md:text-2xl font-black tracking-tight">
                                                {l.phone}
                                            </h3>

                                            <p className="text-sm opacity-60 mt-1">
                                                Interested in Property #{l.property_id}
                                            </p>
                                        </div>
                                    </div>

                                    {/* RIGHT */}
                                    <div className="flex flex-col items-start md:items-end">

                                        <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-black/20 text-xs font-bold">

                                            <CalendarDays size={14} />

                                            {new Date(l.created_at).toLocaleDateString()}
                                        </div>

                                        <span className="mt-3 text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-bold">
                                            ACTIVE LEAD
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-24 text-center rounded-[30px] border border-dashed border-white/10 bg-white/[0.03]">

                            <h3 className="text-2xl font-black mb-2">
                                No Leads Found
                            </h3>

                            <p className="opacity-60 text-sm">
                                Your incoming leads will appear here
                            </p>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="relative z-10 p-5 md:p-8 border-t border-white/10">

                    <button
                        onClick={onClose}
                        className="w-full rounded-2xl py-4 font-black uppercase tracking-[0.25em] text-sm transition-all duration-500 border border-red-500/20 bg-red-500/10 hover:bg-red-500 hover:text-white hover:scale-[1.01] active:scale-95"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <X size={18} />
                            Disconnect Terminal
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}