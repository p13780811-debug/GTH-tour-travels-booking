"use client";

import { useEffect, useState } from "react";
import { PropertyService } from "@/lib/real-estate/propertyService";

export default function PropertyDetailClient({ slug }: { slug: string }) {
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        load();
    }, [slug]);

    async function load() {
        try {
            setLoading(true);
            setError(null);

            const data = await PropertyService.getBySlug(slug);

            if (!data) {
                setError("Property not found");
                return;
            }

            setProperty(data);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load property");
        } finally {
            setLoading(false);
        }
    }

    // =========================
    // LOADING STATE
    // =========================
    if (loading) {
        return (
            <div className="p-10 text-center text-gray-500">
                Loading property details...
            </div>
        );
    }

    // =========================
    // ERROR STATE
    // =========================
    if (error) {
        return (
            <div className="p-10 text-center text-red-500">
                {error}
            </div>
        );
    }

    // =========================
    // NULL SAFETY
    // =========================
    if (!property) return null;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">

            <img
                src={property.image || "/placeholder.jpg"}
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
                alt={property.title}
            />

            <h1 className="text-3xl font-black mt-6 text-slate-900">
                {property.title}
            </h1>

            <p className="text-slate-500 mt-2">
                {property.location}
            </p>

            <p className="text-green-600 text-xl font-bold mt-4">
                ₹ {property.price}
            </p>

            <div className="mt-6 text-slate-700 leading-relaxed">
                {property.description || "No description available"}
            </div>

        </div>
    );
}