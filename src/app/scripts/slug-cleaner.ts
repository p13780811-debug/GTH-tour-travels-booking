import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

/* =========================================================
   🚀 GTH PRO SURGICAL SLUG ENGINE V2
   Safe • SEO Clean • Duplicate Proof • Fast
========================================================= */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* =========================================================
   ⚙️ CONFIG
========================================================= */

const FETCH_LIMIT = 1000
const PARALLEL_BATCH = 25

/* =========================================================
   🧠 HELPERS
========================================================= */

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}

/* =========================================================
   🧼 CLEANER
========================================================= */

function clean(text: string = "") {

    return String(text || "property")
        .toLowerCase()
        .trim()

        // remove special chars
        .replace(/[^a-z0-9\s-]/g, "")

        // spaces -> hyphen
        .replace(/\s+/g, "-")

        // multiple hyphens
        .replace(/-+/g, "-")

        // trim edges
        .replace(/^-|-$/g, "")

        // max SEO length
        .slice(0, 80)
}

/* =========================================================
   🔥 BUILD CLEAN SLUG
========================================================= */

function buildSlug(row: any) {

    const base =
        clean(
            row.title ||
            row.slug ||
            "luxury-property"
        )

    // unique stable suffix
    const suffix =
        String(row.id)

    return `${base}-${suffix}`
}

/* =========================================================
   📦 FETCH BLOCK
========================================================= */

async function fetchRows(
    from: number,
    limit: number
) {

    const { data, error } =
        await supabase
            .from("properties")
            .select("id,title,slug,verified")
            .range(from, from + limit - 1)
            .order("id", {
                ascending: true,
            })

    if (error) {
        throw error
    }

    return data || []
}

/* =========================================================
   ⚡ PROCESS BATCH
========================================================= */

async function processBatch(
    rows: any[]
) {

    const results = await Promise.allSettled(

        rows.map(async (row) => {

            const newSlug =
                buildSlug(row)

            // skip unchanged
            if (row.slug === newSlug) {

                return {
                    skipped: true,
                    id: row.id,
                }
            }

            const { error } =
                await supabase
                    .from("properties")
                    .update({
                        slug: newSlug,
                        updated_at:
                            new Date().toISOString(),
                    })
                    .eq("id", row.id)

            if (error) {

                return {
                    success: false,
                    id: row.id,
                    error: error.message,
                }
            }

            return {
                success: true,
                id: row.id,
                slug: newSlug,
            }
        })
    )

    return results
}

/* =========================================================
   🚀 MAIN ENGINE
========================================================= */

async function run() {

    console.log(
        "\n🚀 GTH SURGICAL SLUG ENGINE V2 STARTED\n"
    )

    let from = 0

    let checked = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    const started = Date.now()

    while (true) {

        const rows =
            await fetchRows(
                from,
                FETCH_LIMIT
            )

        if (!rows.length) {
            break
        }

        console.log(
            `📦 BLOCK ${from} → ${from + rows.length}`
        )

        checked += rows.length

        /* =====================================
           SPLIT INTO SAFE PARALLEL GROUPS
        ===================================== */

        for (
            let i = 0;
            i < rows.length;
            i += PARALLEL_BATCH
        ) {

            const chunk =
                rows.slice(
                    i,
                    i + PARALLEL_BATCH
                )

            const results =
                await processBatch(chunk)

            for (const result of results) {

                if (
                    result.status === "fulfilled"
                ) {

                    const value =
                        result.value as any

                    if (value.skipped) {

                        skipped++

                    } else if (
                        value.success
                    ) {

                        updated++

                        console.log(
                            `⚡ ${value.id} → ${value.slug}`
                        )

                    } else {

                        errors++

                        console.log(
                            `❌ ${value.id}: ${value.error}`
                        )
                    }

                } else {

                    errors++

                    console.log(
                        "💥 Promise Failed"
                    )
                }
            }

            // anti rate-limit
            await sleep(50)
        }

        from += FETCH_LIMIT

        const elapsed =
            (
                (Date.now() - started) /
                1000
            ).toFixed(1)

        console.log(
            `⏱️ ${elapsed}s | ✅ ${updated} | ⏭️ ${skipped} | ❌ ${errors}\n`
        )
    }

    /* =====================================================
       🏁 FINAL SUMMARY
    ===================================================== */

    const totalTime =
        (
            (Date.now() - started) /
            1000
        ).toFixed(1)

    console.log("\n🏁 ENGINE COMPLETE\n")

    console.log(`📦 Checked: ${checked}`)
    console.log(`⚡ Updated: ${updated}`)
    console.log(`⏭️ Skipped: ${skipped}`)
    console.log(`❌ Errors: ${errors}`)
    console.log(`🕒 Time: ${totalTime}s\n`)
}

/* =========================================================
   🧯 SAFE RUNNER
========================================================= */

run()
    .then(() => {

        console.log(
            "✅ SLUG ENGINE FINISHED\n"
        )

        process.exit(0)
    })
    .catch((err) => {

        console.log(
            "\n💥 ENGINE FAILURE:",
            err
        )

        process.exit(1)
    })