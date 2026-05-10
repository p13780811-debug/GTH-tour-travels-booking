import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ========================================================= */
/* 🧠 GTH PRO AI RANK ENGINE V2 */
/* ========================================================= */

function finalRankScore(p: any) {

    let score = p.intelligence_score || 50

    if (p.price_status === "UNDERPRICED") score += 10
    if (p.price_status === "OVERPRICED") score -= 10

    score += (p.city_demand || 0) * 0.2
    score += (p.luxury_index || 0) * 0.1
    score += (p.rating || 0) * 5

    if (p.featured) score += 8

    return Math.min(100, Math.round(score))
}

/* ========================================================= */
/* 🚀 BOOST ENGINE */
/* ========================================================= */

function computeRankBoost(p: any) {

    let score = finalRankScore(p)

    if (p.featured) score += 5

    return score
}

/* ========================================================= */
/* 📦 FETCH ALL PROPERTIES */
/* ========================================================= */

async function fetchAllProperties() {

    let all: any[] = []

    let from = 0

    const limit = 1000

    while (true) {

        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .range(from, from + limit - 1)

        if (error) {
            throw error
        }

        if (!data || data.length === 0) {
            break
        }

        all.push(...data)

        from += limit
    }

    return all
}

/* ========================================================= */
/* 🛡️ DUPLICATE RANK FIX */
/* ========================================================= */

function ensureUniqueRanks(sorted: any[]) {

    const usedRanks = new Set<number>()

    return sorted.map((p, index) => {

        let rank = index + 1

        while (usedRanks.has(rank)) {
            rank++
        }

        usedRanks.add(rank)

        return {
            ...p,
            rank_position: rank
        }
    })
}

/* ========================================================= */
/* ⚡ BULK UPDATE */
/* ========================================================= */

async function bulkUpdateProperties(properties: any[]) {

    const chunkSize = 200

    for (let i = 0; i < properties.length; i += chunkSize) {

        const chunk = properties.slice(i, i + chunkSize)

        for (const p of chunk) {

            const { error } = await supabase
                .from("properties")
                .update({
                    rank_position: p.rank_position,
                    final_score: p.score
                })
                .eq("id", p.id)

            if (error) {

                console.log(`❌ UPDATE FAILED: ${p.id}`, error.message)

            }

        }

        console.log(`⚡ Updated chunk ${i + 1} → ${i + chunk.length}`)
    }
}

/* ========================================================= */
/* 🧠 MAIN RANK ENGINE */
/* ========================================================= */

async function runRankingEngine() {

    console.log("🚀 GTH PRO AUTONOMOUS AI RANK ENGINE STARTED")

    const properties = await fetchAllProperties()

    if (!properties.length) {

        console.log("✅ No properties found")

        return
    }

    console.log(`📦 TOTAL FETCHED: ${properties.length}`)

    const grouped: Record<string, any[]> = {}

    for (const p of properties) {

        const city = p.city || "unknown"

        if (!grouped[city]) {
            grouped[city] = []
        }

        grouped[city].push(p)
    }

    let totalUpdated = 0

    for (const city in grouped) {

        console.log(`\n📍 PROCESSING CITY: ${city}`)

        const ranked = grouped[city]
            .map((p: any) => ({
                ...p,
                score: computeRankBoost(p)
            }))
            .sort((a: any, b: any) => {

                if (b.score !== a.score) {
                    return b.score - a.score
                }

                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })

        const uniqueRanked = ensureUniqueRanks(ranked)

        await bulkUpdateProperties(uniqueRanked)

        totalUpdated += uniqueRanked.length

        console.log(`✅ ${city} ranked successfully (${uniqueRanked.length})`)
    }

    console.log(`\n🏁 RANK ENGINE COMPLETE`)
    console.log(`⚡ TOTAL UPDATED: ${totalUpdated}`)
}

/* ========================================================= */
/* 🧯 SAFE RUNNER */
/* ========================================================= */

runRankingEngine()
    .then(() => {
        console.log("🎯 SYSTEM FINISHED")
        process.exit(0)
    })
    .catch((err) => {
        console.error("💥 SYSTEM FAILURE:", err)
        process.exit(1)
    })