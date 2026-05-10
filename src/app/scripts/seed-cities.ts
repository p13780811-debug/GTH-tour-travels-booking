import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cities = [
    { name: "Mumbai", country: "India" },
    { name: "Dubai", country: "UAE" },
    { name: "London", country: "UK" },
    { name: "New York", country: "USA" },
    { name: "Singapore", country: "Singapore" },
    { name: "Bangkok", country: "Thailand" },
    { name: "Paris", country: "France" },
    { name: "Tokyo", country: "Japan" }
];

async function run() {
    const { error } = await supabase.from("cities").insert(cities);

    if (error) console.log(error);
    else console.log("🌍 Cities seeded");
}

run();