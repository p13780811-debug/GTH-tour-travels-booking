import time
from cities import cities
from ai_engine import generate_city_batch
from supabase_db import save_destination
from image_api import get_city_image
from urllib.parse import quote

BATCH_SIZE = 50

print("Cities Loaded:", cities)
print("🚀 GTH Engine Started\n")

batch = []

for city in cities:

    batch.append(city)

    if len(batch) == BATCH_SIZE:

        print(f"⚡ Processing batch: {batch}")

        ai_data = generate_city_batch(batch)

        if not ai_data:
            print("❌ AI returned no valid data — skipping batch")
            batch = []
            continue

        for item in ai_data:

            # slug generate
            slug = item["name"].lower().replace(" ", "-")

            # 🔹 Fetch image from Pexels
            image = get_city_image(item["name"])

            # 🔹 Fallback image if API fails
            if not image:
                image = "https://api.pexels.com/v1/search?query=${query}&per_page=3&page=${Math.floor(Math.random() * 5) + 1}"

            data = {
                "name": item["name"],
                "slug": slug,
                "country": "Unknown",
                "description": item["description"],
                "seo_title": item["seo_title"],
                "seo_description": item["seo_description"],
                "image_url": image,
                "partner_link": f"https://tp.media/r?marker=417668&city={quote(item['name'])}"
            }

            save_destination(data)

        print("✅ Batch saved\n")

        batch = []

        time.sleep(40)