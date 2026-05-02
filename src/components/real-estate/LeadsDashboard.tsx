"use client";

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LeadsDashboard({ onClose, properties }: any) {
    const [leads, setLeads] = useState<any[]>([])

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from("leads").select("*").order('created_at', { ascending: false })
            setLeads(data || [])
        }
        fetch()
    }, [])

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-">
            {/* 🏰 GTH Luxury Terminal Card */}
            <div className="bg-[#f1f5f9] border border-white p-10 rounded-[40px] w-full max-w-2xl shadow-2xl relative overflow-hidden">

                {/* Header Section */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-950 italic uppercase tracking-tighter">
                            Leads <span className="text-cyan-600">Command Center</span>
                        </h2>
                        <div className="mb-4 text-sm">
                            <p>Total Leads: {leads.length}</p>
                            <p>
                                Boosted Listings: {
                                    properties.filter((p: any) => p.is_featured).length
                                }
                            </p>
                        </div>

                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">GTH_PRO_REVENUE_ENGINE</p>
                    </div>

                    {/* 💰 REVENUE DISPLAY - Exact Logic Added */}
                    <div className="gth-glass950 p-6 rounded-[24px] border-b-4 border-cyan-500 shadow-xl text-right">
                        <p className="text-[8px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-1 italic">Potential Revenue</p>
                        <p className="text-3xl font-black text-white italic">
                            ₹{leads.length * 25}
                        </p>
                        <p className="text-[7px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Calculated @ ₹25/Lead</p>
                    </div>
                </div>

                {/* Leads Scrollable List */}
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-4 custom-scrollbar">
                    {leads.length > 0 ? leads.map(l => (
                        <div key={l.id} className="gth-glass border border-slate-200 p-5 rounded-2xl flex justify-between items-center group hover:border-cyan-500 transition-all shadow-sm">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mobile_Auth_Node</span>
                                <span className="text-xl font-black text-slate-900 tracking-tight">{l.phone}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-500 block">Target_ID: #{l.property_id}</span>
                                <span className="text-[8px] font-mono text-cyan-600 uppercase tracking-tighter">
                                    {new Date(l.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    )) : (
                        <div className="py-10 text-center text-slate-400 font-black uppercase text-xs italic tracking-widest">
                            No Leads Detected in Matrix
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <button
                    onClick={onClose}
                    className="mt-10 w-full gth-glass text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-red-600 transition-all active:scale-95 shadow-2xl"
                >
                    Disconnect Terminal
                </button>
            </div>
        </div>
    )
}