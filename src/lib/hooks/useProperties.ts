"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useProperties() {

    /* =========================
       CORE STATE
    ========================= */

    const [properties, setProperties] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [featured, setFeatured] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        total: 0,
        featured: 0,
        luxury: 0,
        affordable: 0,
    });

    /* =========================
       LIVE CACHE
    ========================= */

    const cacheRef = useRef<any[]>([]);

    /* =========================
       SMART SORT ENGINE
    ========================= */

    const sortEngine = (data: any[]) => {

        const now = new Date();

        return [...data].sort((a, b) => {

            const aBoost =
                a.is_featured &&
                a.boost_expiry &&
                new Date(a.boost_expiry) > now;

            const bBoost =
                b.is_featured &&
                b.boost_expiry &&
                new Date(b.boost_expiry) > now;

            /* 🚀 FEATURED FIRST */
            if (aBoost && !bBoost) return -1;
            if (!aBoost && bBoost) return 1;

            /* 💎 PREMIUM IMAGE SCORE */
            const aImage = a.image ? 1 : 0;
            const bImage = b.image ? 1 : 0;

            if (aImage !== bImage) {
                return bImage - aImage;
            }

            /* 🕒 RECENT FIRST */
            return (
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
        });
    };

    /* =========================
       MARKET INTELLIGENCE
    ========================= */

    const buildStats = (data: any[]) => {

        const luxury = data.filter(
            (p) => Number(p.price) >= 100
        ).length;

        const affordable = data.filter(
            (p) => Number(p.price) < 50
        ).length;

        const featuredCount = data.filter(
            (p) => p.is_featured
        ).length;

        setStats({
            total: data.length,
            featured: featuredCount,
            luxury,
            affordable,
        });
    };

    /* =========================
       FETCH ENGINE
    ========================= */

    const fetchProperties = async () => {

        try {

            setLoading(true);

            const { data, error } = await supabase
                .from("properties")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Property Fetch Error:", error);
                return;
            }

            const finalData = sortEngine(data || []);

            cacheRef.current = finalData;

            setProperties(finalData);
            setFiltered(finalData);

            setFeatured(
                finalData.filter((p) => p.is_featured)
            );

            buildStats(finalData);

        } catch (err) {

            console.error("Property Engine Failed:", err);

        } finally {

            setLoading(false);
        }
    };

    /* =========================
       INIT
    ========================= */

    useEffect(() => {
        fetchProperties();
    }, []);

    /* =========================
       REALTIME ENGINE
    ========================= */

    useEffect(() => {

        const channel = supabase
            .channel("gth-property-live")

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "properties",
                },
                async () => {

                    /* ⚡ LIVE REFRESH */
                    await fetchProperties();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, []);

    /* =========================
       SMART FILTER UPDATE
    ========================= */

    const updateFiltered = (data: any[]) => {

        const finalData = sortEngine(data);

        setFiltered(finalData);
    };

    /* =========================
       TRENDING PROPERTIES
    ========================= */

    const trending = useMemo(() => {

        return [...properties]

            .sort((a, b) => {

                const aScore =
                    (a.views || 0) +
                    (a.leads || 0) * 3;

                const bScore =
                    (b.views || 0) +
                    (b.leads || 0) * 3;

                return bScore - aScore;
            })

            .slice(0, 8);

    }, [properties]);

    /* =========================
       AI PICKS
    ========================= */

    const aiPicks = useMemo(() => {

        return [...properties]

            .filter((p) =>
                p.image &&
                p.description &&
                p.location
            )

            .slice(0, 12);

    }, [properties]);

    /* =========================
       RETURN
    ========================= */

    return {

        /* MAIN */
        properties,
        filtered,

        /* PREMIUM */
        featured,
        trending,
        aiPicks,

        /* STATS */
        stats,

        /* STATE */
        loading,

        /* ACTIONS */
        setFiltered: updateFiltered,
        fetchProperties,
    };
}