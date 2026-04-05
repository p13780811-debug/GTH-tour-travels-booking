import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// ENV load
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const pexelsKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY as string;

// Validation
if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase keys missing");
    process.exit(1);
}

if (!pexelsKey) {
    console.error("❌ Pexels API key missing");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ FIX 1: Type added
const delay = (ms: number): Promise<void> =>
    new Promise((res) => setTimeout(res, ms));

// ✅ FIX 2: Proper types
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = 3
): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            return await res.json();
        } catch (err) {
            console.log(`⚠️ Retry ${i + 1}/${retries}`);
            await delay(1000);
        }
    }
    throw new Error("❌ Failed after retries");
}

async function updateDatabaseImages(): Promise<void> {
    console.log("🚀 Starting Image Update...\n");

    const { data: tours, error } = await supabase
        .from('tours')
        .select('id, city_slug, title');

    if (error) {
        console.error("❌ DB Fetch Error:", error);
        return;
    }

    let success = 0;
    let failed = 0;

    for (const tour of tours || []) {
        const query = tour.city_slug || tour.title || 'travel';
        console.log(`🔍 ${query}`);

        try {
            const data = await fetchWithRetry(
                `https://api.pexels.com/v1/search?query=${query}&per_page=1`,
                {
                    headers: { Authorization: pexelsKey }
                }
            );

            if (!data.photos || data.photos.length === 0) {
                console.log(`⚠️ No image for ${query}`);
                failed++;
                continue;
            }

            const newUrl = data.photos[0]?.src?.large;

            if (!newUrl) {
                failed++;
                continue;
            }

            const { error: updateError } = await supabase
                .from('tours')
                .update({
                    image_url: `${newUrl}?auto=compress&cs=tinysrgb&w=800`
                })
                .eq('id', tour.id);

            if (updateError) {
                console.error(`❌ Update failed: ${query}`, updateError);
                failed++;
            } else {
                console.log(`✅ Updated: ${query}`);
                success++;
            }

            await delay(400);

        } catch (err: any) { // ✅ FIX 3
            console.error(`❌ Failed for ${query}:`, err?.message || err);
            failed++;
        }
    }

    console.log("\n🏁 DONE");
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);
}

// RUN
updateDatabaseImages();