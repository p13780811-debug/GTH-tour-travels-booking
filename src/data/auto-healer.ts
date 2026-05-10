import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

/* ========================================================= */
/* 🧠 GTH PRO AUTO HEALER ENGINE */
/* ========================================================= */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ========================================================= */
/* 🌍 CITY RATE MAP */
/* ========================================================= */

const cityRateMap: Record<string, number> = {

    Mumbai: 25000,
    Delhi: 18000,
    Bangalore: 14000,
    Hyderabad: 12000,
    Kolkata: 9000,
    Chennai: 11000,
    Pune: 10000,

    Dubai: 2000,
    Bangkok: 450,
    Singapore: 3200,
    London: 5500,
    Paris: 4800,

    unknown: 8000
}

/* ========================================================= */
/* 🛏️ DEFAULTS */
/* ========================================================= */

const propertyDefaults: Record<string, any> = {

    apartment: {
        beds: 2,
        baths: 2,
        amenities: ["Lift", "Security", "Parking"]
    },

    villa: {
        beds: 4,
        baths: 4,
        amenities: ["Pool", "Garden", "Parking"]
    },

    commercial: {
        beds: 0,
        baths: 2,
        amenities: ["Parking", "Power Backup"]
    },

    plot: {
        beds: null,
        baths: null,
        amenities: ["Road Access"]
    },

    default: {
        beds: 2,
        baths: 2,
        amenities: ["Security"]
    }
}

/* ========================================================= */
/* 🔥 HELPERS */
/* ========================================================= */

function sleep(ms: number) {

    return new Promise(resolve => setTimeout(resolve, ms))
}

function isEmpty(v: any) {

    return (
        v === null ||
        v === undefined ||
        v === "" ||
        v === "00" ||
        v === 0 ||
        v === "unknown"
    )
}

function normalizeType(type: string = "") {

    const t = type.toLowerCase()

    if (t.includes("villa")) return "villa"
    if (t.includes("plot")) return "plot"
    if (t.includes("commercial")) return "commercial"
    if (t.includes("office")) return "commercial"

    return "apartment"
}

function generatePrice(p: any) {

    const sqft = Number(p.sqft || 1000)

    const city = p.city || "unknown"

    const rate = cityRateMap[city] || cityRateMap["unknown"]

    return Math.round(sqft * rate)
}

function generateDescription(p: any) {

    const type = p.property_type || "Property"

    const city = p.city || "Prime Location"

    const sqft = p.sqft || 1200

    const bhk = p.beds && p.beds > 0 ? `${p.beds} BHK` : p.property_type === 'plot' ? 'Exclusive Land' : 'Premium';

    const adjectives = [
        "Luxury",
        "Premium",
        "Modern",
        "Elegant",
        "Exclusive"
    ]

    const adj =
        adjectives[
        Math.floor(Math.random() * adjectives.length)
        ]

    return `${adj} ${bhk} ${type} in ${city}, featuring ${sqft} sqft with modern amenities, premium interiors, excellent connectivity, and high investment potential.`
}

function needsDescriptionFix(desc: string = "") {

    if (!desc) return true

    if (desc.length < 40) return true

    const repeated =
        /(lorem|test|demo|nice property|good property)/i

    return repeated.test(desc)
}

/* ========================================================= */
/* 🧠 PROPERTY HEALER */
/* ========================================================= */

function healProperty(p: any) {

    const updates: any = {}

    const type = normalizeType(p.property_type)

    const defaults =
        propertyDefaults[type] ||
        propertyDefaults.default

    /* ================= PRICE ================= */

    if (
        isEmpty(p.price)
    ) {

        updates.price = generatePrice(p)
    }

    /* ================= DESCRIPTION ================= */

    if (
        needsDescriptionFix(p.description)
    ) {

        updates.description =
            generateDescription({
                ...p,
                ...updates
            })
    }

    /* ================= TYPE ================= */

    if (
        isEmpty(p.property_type)
    ) {

        updates.property_type = type
    }

    /* ================= BEDS ================= */

    if (
        type !== "plot" &&
        isEmpty(p.beds)
    ) {

        updates.beds = defaults.beds
    }

    /* ================= BATHS ================= */

    if (
        type !== "plot" &&
        isEmpty(p.baths)
    ) {

        updates.baths = defaults.baths
    }

    /* ================= SQFT ================= */

    if (
        isEmpty(p.sqft)
    ) {

        updates.sqft =
            type === "villa"
                ? 2500
                : type === "commercial"
                    ? 1800
                    : 1200
    }

    /* ================= AMENITIES ================= */

    if (
        isEmpty(p.amenities) ||
        !Array.isArray(p.amenities)
    ) {

        updates.amenities = defaults.amenities
    }

    /* ================= STATUS ================= */

    if (
        isEmpty(p.status) ||
        p.status === "unknown"
    ) {

        updates.status = "Available"
    }

    /* ================= VERIFIED ================= */

    if (
        p.verified === null ||
        p.verified === undefined
    ) {

        updates.verified = true
    }

    return updates
}

/* ========================================================= */
/* 📦 FETCH ENGINE */
/* ========================================================= */

async function fetchBatch(from: number, limit: number) {

    const { data, error } = await supabase
        .from("properties")
        .select("*")
        .range(from, from + limit - 1)

    if (error) {
        throw error
    }

    return data || []
}

/* ========================================================= */
/* 🚀 MAIN ENGINE */
/* ========================================================= */

async function runAutoHealer() {

    console.log("🚀 GTH PRO AUTO HEALER STARTED")

    const limit = 1000

    let from = 0

    let totalChecked = 0

    let totalHealed = 0

    let totalErrors = 0

    while (true) {

        const rows = await fetchBatch(from, limit)

        if (!rows.length) {
            break
        }

        console.log(`📦 Processing batch ${from} → ${from + rows.length}`)

        for (const p of rows) {

            totalChecked++

            try {

                const updates = healProperty(p)

                if (
                    Object.keys(updates).length === 0
                ) {

                    continue
                }

                const { error } = await supabase
                    .from("properties")
                    .update(updates)
                    .eq("id", p.id)

                if (error) {

                    totalErrors++

                    console.log(`❌ ${p.id}:`, error.message)

                } else {

                    totalHealed++

                    console.log(`⚡ Healed: ${p.id}`)
                }

                /* ================= RATE LIMIT ================= */

                await sleep(80)

            } catch (err: any) {

                totalErrors++

                console.log(`💥 Failed: ${p.id}`, err.message)
            }
        }

        from += limit
    }

    /* ========================================================= */
    /* 🏁 SUMMARY */
    /* ========================================================= */

    console.log("\n🏁 AUTO HEALER COMPLETE")
    console.log(`📦 Total Checked: ${totalChecked}`)
    console.log(`⚡ Total Healed: ${totalHealed}`)
    console.log(`❌ Errors: ${totalErrors}`)
}

/* ========================================================= */
/* 🧯 SAFE RUNNER */
/* ========================================================= */

runAutoHealer()
    .then(() => {

        console.log("✅ ENGINE FINISHED")

        process.exit(0)
    })
    .catch((err) => {

        console.log("💥 ENGINE FAILURE:", err)

        process.exit(1)
    })