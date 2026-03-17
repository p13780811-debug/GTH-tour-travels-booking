import os
import requests
import time
from dotenv import load_dotenv

# ENV LOAD
load_dotenv(".env.local")

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

# SAVE FOLDER
save_path = "public/images/cities"

if not os.path.exists(save_path):
    os.makedirs(save_path)

# 🌍 Cities list
cities = [
 "goa", "jaipur", "manali", "darjeeling", "digha", "shimla", "ooty", "munnar", "rishikesh", "varanasi",
    "udaipur", "jodhpur", "amritsar", "ladakh", "kasol", "mussoorie", "pondicherry", "andaman", "lakshadweep", "coorg",
    "mumbai", "delhi", "bengaluru", "hyderabad", "chennai", "kolkata", "pune", "ahmedabad", "kochi", "agra",
    "srinagar", "gulmarg", "nainital", "dalhousie", "alleppey", "kovalam", "kanyakumari", "madurai", "mysore", "hampi",
    "khajuraho", "ajanta-ellora", "pushkar", "ranthambore", "jim-corbett", "kanha", "puri", "konark", "shirdi", "tirupati",

"dubai", "bangkok", "bali", "singapore", "phuket", "kuala-lumpur", "tokyo", "seoul", "hong-kong", "macau",
    "maldives", "colombo", "kathmandu", "hanoi", "ho-chi-minh", "jakarta", "manila", "taipei", "beijing", "shanghai",
    "paris", "london", "rome", "barcelona", "amsterdam", "vienna", "prague", "budapest", "lisbon", "athens",
    "zurich", "geneva", "copenhagen", "stockholm", "oslo", "helsinki", "warsaw", "krakow", "edinburgh", "dublin",
    "new-york", "los-angeles", "las-vegas", "miami", "orlando", "san-francisco", "chicago", "toronto", "vancouver", "cape-town"
]


def download_images():

    print("🚀 GTH Image Engine Started\n")

    for city in cities:

        slug = city.lower().replace(" ", "-")
        file_path = os.path.join(save_path, f"{slug}.jpg")

        if os.path.exists(file_path):
            print(f"⏭ Skip: {slug}.jpg already exists")
            continue

        image_url = None

        try:

            print(f"📡 Fetching {city}...")

            # -------------------------
            # 1️⃣ PEXELS
            # -------------------------

            if PEXELS_API_KEY:

                headers = {
                    "Authorization": PEXELS_API_KEY
                }

                pexels_url = f"https://api.pexels.com/v1/search?query={city}+travel&per_page=1"

                r = requests.get(pexels_url, headers=headers, timeout=8)

                if r.status_code == 200:

                    data = r.json()

                    if data.get("photos"):
                        image_url = data["photos"][0]["src"]["large"]
                        print("✔ Image from Pexels")

            # -------------------------
            # 2️⃣ UNSPLASH FALLBACK
            # -------------------------

            if not image_url:

                image_url = f"https://source.unsplash.com/1600x900/?{city},travel"
                print("⚠ Using Unsplash fallback")

            # -------------------------
            # 3️⃣ PICSUM FINAL FALLBACK
            # -------------------------

            img = requests.get(image_url, timeout=8)

            if img.status_code != 200:

                image_url = f"https://picsum.photos/seed/{city}/1600/900"
                print("⚠ Using Picsum fallback")

                img = requests.get(image_url, timeout=8)

            # SAVE IMAGE

            if img.status_code == 200:

                with open(file_path, "wb") as f:
                    f.write(img.content)

                print(f"✅ Saved: {slug}.jpg\n")

            else:
                print(f"❌ Failed: {city}\n")

        except Exception as e:

            print(f"❌ Error with {city}: {e}\n")

        time.sleep(1)

    print("🎉 All downloads complete")


if __name__ == "__main__":
    download_images()