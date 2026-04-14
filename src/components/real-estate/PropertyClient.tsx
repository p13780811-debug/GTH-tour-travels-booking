"use client";

import { useEffect, useState } from "react";
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
    // LOAD DATA
    // =========================
    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            const data = await PropertyService.getAll();

            // 🔥 GTH PRO: BOOST LOGIC ADDED
            const now = new Date();
            const boosted = data.filter(p =>
                p.is_featured && p.boost_expiry && new Date(p.boost_expiry) > now
            );
            const normal = data.filter(p =>
                !p.is_featured || !p.boost_expiry || new Date(p.boost_expiry) <= now
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

        // 🔥 GTH PRO: BOOST LOGIC ADDED IN SEARCH
        const now = new Date();
        const boosted = result.filter(p =>
            p.is_featured && p.boost_expiry && new Date(p.boost_expiry) > now
        );
        const normal = result.filter(p =>
            !p.is_featured || !p.boost_expiry || new Date(p.boost_expiry) <= now
        );
        const finalData = [...boosted, ...normal];

        setFiltered(finalData);
    }

    // =========================
    // LOADING STATE UI
    // =========================
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-white">
                Loading Real Estate Engine...
            </div>
        );
    }

    // =========================
    // MAIN UI
    // =========================
    return (
        <div className="min-h-screen bg-[#0a0f14]">

            {/* HERO */}
            <RealEstateHero
                query={query}
                setQuery={setQuery}
                onSearch={search}
            />

            {/* CONTROL PANEL */}
            <SearchPanel
                onAdd={() => setShowAdd(true)}
                onDashboard={() => setShowDash(true)}
            />

            {/* GRID */}
            <PropertyGrid
                properties={filtered}
                setActive={setActive}
            />

            {/* ADD MODAL */}
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

            {/* DASHBOARD */}
            {showDash && (
                <LeadsDashboard onClose={() => setShowDash(false)} />
            )}

            {/* AI LAYER */}
            <AIChat
                properties={properties}
                setFiltered={setFiltered}
                setActive={setActive}
            />
        </div>
    );
}