"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useProperties() {
    const [properties, setProperties] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // =========================
    // FETCH
    // =========================
    const fetchProperties = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error) {
            setProperties(data || []);
            setFiltered(data || []);
        }

        setLoading(false);
    };

    // =========================
    // INIT
    // =========================
    useEffect(() => {
        fetchProperties();
    }, []);

    // =========================
    // SMART UPDATE FILTER
    // =========================
    const updateFiltered = (data: any[]) => {
        setFiltered(data);
    };

    return {
        properties,
        filtered,
        setFiltered: updateFiltered,
        loading,
        fetchProperties,
    };
}