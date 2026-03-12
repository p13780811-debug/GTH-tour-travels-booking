import time
from cities import cities
from ai_engine import generate_city_batch
from supabase_db import save_destination
from image_api import get_city_image
BATCH_SIZE = 15

print("Cities Loaded:", cities)
print("🚀 GTH Engine Started\n")

batch = []

for city in cities:

    batch.append(city)

    if len(batch) == BATCH_SIZE:

        print(f"⚡ Processing batch: {batch}")

        ai_data = generate_city_batch(batch)

        # safety check
        if not ai_data:
            print("❌ AI returned no valid data — skipping batch")
            batch = []
            continue

        for item in ai_data:

            data = {
                "name": item["name"],
                "description": item["description"],
                "seo_title": item["seo_title"],
                "seo_description": item["seo_description"],
                "image_url": f"get_city_image(city){item['name'].lower().replace(' ','-')}.jpg",
                "partner_link": f"https://tp.media/r?marker=YOURID&city={item['name']}"
            }

            save_destination(data)

        print("✅ Batch saved\n")

        batch = []

        time.sleep(40)