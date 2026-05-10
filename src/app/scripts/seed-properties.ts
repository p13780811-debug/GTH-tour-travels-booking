import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";

import {
    generateAIPropertyDescription,
    generateSEOKeywords
} from "./generate-ai-data";

dotenv.config();

// ===================== SUPABASE =====================
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===================== CONSTANTS =====================
const cities = [
    "Mumbai",
    "Dubai",
    "London",
    "New York",
    "Singapore",
    "Bangkok",
    "Paris",
    "Tokyo"
];

const propertyImages = [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    "https://images.unsplash.com/photo-1494526585095-c41746248156",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750"
];

const TOTAL = 10000;
const BATCH_SIZE = 500;

// ===================== SLUG SAFETY =====================
const slugSet = new Set<string>();

function uniqueSlug(title: string, i: number) {
    const base = faker.helpers.slugify(title.toLowerCase());
    let slug = `${base}-${i}-${faker.string.alphanumeric(4)}`;

    while (slugSet.has(slug)) {
        slug = `${base}-${i}-${faker.string.alphanumeric(6)}`;
    }

    slugSet.add(slug);
    return slug;
}

// ===================== BHK → BEDROOMS =====================
function bhkToBedrooms(bhk: string) {
    switch (bhk) {
        case "1BHK": return 1;
        case "2BHK": return 2;
        case "3BHK": return 3;
        case "4BHK": return 4;
        case "Penthouse": return 5;
        default: return 2;
    }
}

// ===================== GENERATOR =====================
function generateProperty(i: number) {
    const city = faker.helpers.arrayElement(cities);

    const bhk = faker.helpers.arrayElement([
        "1BHK",
        "2BHK",
        "3BHK",
        "4BHK",
        "Penthouse"
    ]);

    const title = `${faker.helpers.arrayElement([
        "Emerald",
        "Sapphire",
        "Imperial",
        "Sky",
        "Royal",
        "Crystal"
    ])} ${city} ${faker.helpers.arrayElement([
        "Heights",
        "Manor",
        "Villas",
        "Residency",
        "Tower"
    ])}`;

    const description = generateAIPropertyDescription(title, city);
    const keywords = generateSEOKeywords(city);

    return {
        // ================= CORE =================
        title,
        slug: uniqueSlug(title, i),

        location: city,
        city,
        state: faker.location.state(),
        country: "Global",

        // ================= PROPERTY DETAILS (SQL MATCHED) =================
        property_type: faker.helpers.arrayElement([
            "Apartment",
            "Villa",
            "Penthouse"
        ]),

        status: faker.helpers.arrayElement([
            "available",
            "sold",
            "pending"
        ]),

        bedrooms: bhkToBedrooms(bhk),              // ✅ FIXED
        bathrooms: faker.number.int({ min: 1, max: 5 }), // ✅ ADDED
        area_sqft: faker.number.int({ min: 500, max: 6000 }), // ✅ ADDED

        listing_type: faker.helpers.arrayElement(["Buy", "Rent"]),

        price: faker.number.int({ min: 50, max: 2500 }),

        // ================= MEDIA =================
        image: faker.helpers.arrayElement(propertyImages),

        gallery: [
            faker.helpers.arrayElement(propertyImages),
            faker.helpers.arrayElement(propertyImages),
            faker.helpers.arrayElement(propertyImages)
        ],

        // ================= FEATURES (JSONB) =================
        amenities: faker.helpers.arrayElements(
            ["Pool", "Gym", "Parking", "Smart Home", "Security", "Garden", "Lift", "Club House"],
            faker.number.int({ min: 3, max: 6 })
        ),

        // ================= RATINGS =================
        rating: faker.number.float({
            min: 3.5,
            max: 5,
            fractionDigits: 1
        }),

        review_count: faker.number.int({ min: 10, max: 5000 }),

        featured: faker.datatype.boolean(),

        // ================= AGENT =================
        agent_name: faker.person.fullName(),
        agent_phone: faker.phone.number(),

        // ================= AI FIELDS =================
        description,
        seo_keywords: keywords
    };
}

// ===================== SEED ENGINE =====================
async function seed() {
    console.log("🚀 GTH PRO SQL-ALIGNED SEED STARTED...");

    let batch: any[] = [];

    for (let i = 1; i <= TOTAL; i++) {
        batch.push(generateProperty(i));

        // 🔥 batch insert
        if (batch.length === BATCH_SIZE || i === TOTAL) {
            const { error } = await supabase
                .from("properties")
                .insert(batch);

            if (error) {
                console.log(`❌ Batch failed at ${i}:`, error.message);
                return;
            }

            console.log(`✅ Inserted: ${i}/${TOTAL}`);
            batch = [];
        }
    }

    console.log("🏁 SEED COMPLETE — SQL SCHEMA PERFECTLY MATCHED");
}

seed();

seed().catch((err) => {
    console.error("❌ Fatal Error during seed:", err);
});