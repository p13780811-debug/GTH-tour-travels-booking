import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// ===================== SUPABASE =====================
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===================== SCORING ENGINE =====================
function calculateScore(p: any, city: any) {
    let score = 50;

    if (!city) return score;

    score += (city.demand_score || 0) * 0.3;

    if (p.property_type === "Villa") score += 10;
    if (p.property_type === "Penthouse") score += 15;

    score += (p.amenities?.length || 0) * 2;
    score += (p.rating || 0) * 5;

    if (p.featured) score += 10;

    return Math.min(100, Math.round(score));
}

// ===================== PRICE ENGINE =====================
function evaluatePrice(p: any, city: any) {
    if (!city) return "UNKNOWN";

    const expected =
        (city.avg_price_per_sqft || 1000) *
        (p.area_sqft || 1000) /
        1000;

    if (p.price > expected * 1.2) return "OVERPRICED";
    if (p.price < expected * 0.8) return "UNDERPRICED";
    return "FAIR";
}

// ===================== CITY MAP =====================
async function getCitiesMap() {
    const { data, error } = await supabase.from("cities").select("*");

    if (error) throw error;

    const map = new Map<string, any>();

    data?.forEach((c: any) => {
        map.set(c.city, c);
    });

    return map;
}

// ===================== MAIN ENGINE =====================
async function runIntelligence() {
    console.log("🚀 GTH PRO INTELLIGENCE ENGINE v4 STARTED");

    // 🔥 fetch data in chunks (safe)
    const PAGE_SIZE = 1000;
    let page = 0;
    let total = 0;

    const cityMap = await getCitiesMap();

    while (true) {
        const { data: properties, error } = await supabase
            .from("properties")
            .select("*")
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
            console.log("❌ Fetch error:", error.message);
            break;
        }

        if (!properties || properties.length === 0) break;

        // ===================== UPDATE LOOP =====================
        for (const p of properties) {
            const city = cityMap.get(p.city);

            const intelligence_score = calculateScore(p, city);
            const price_status = evaluatePrice(p, city);

            const { error: updateError } = await supabase
                .from("properties")
                .update({
                    intelligence_score,
                    price_status,
                    city_demand: city?.demand_score || 0,
                    luxury_index: city?.luxury_index || 0
                })
                .eq("id", p.id); // 🔥 ONLY SAFE WAY

            if (updateError) {
                console.log("❌ Update failed:", updateError.message);
                continue;
            }

            total++;
        }

        console.log(`✅ Processed page ${page + 1}`);

        page++;
    }

    console.log(`🏁 DONE — TOTAL UPDATED: ${total}`);
}

runIntelligence();