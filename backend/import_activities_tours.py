import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("../.env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


cities = [
"dubai", "bangkok", "bali", "singapore", "phuket", "kuala-lumpur", "tokyo", "seoul", "hong-kong", "macau",
    "maldives", "colombo", "kathmandu", "hanoi", "ho-chi-minh", "jakarta", "manila", "taipei", "beijing", "shanghai",
    "paris", "london", "rome", "barcelona", "amsterdam", "vienna", "prague", "budapest", "lisbon", "athens",
    "zurich", "geneva", "copenhagen", "stockholm", "oslo", "helsinki", "warsaw", "krakow", "edinburgh", "dublin",
    "new-york", "los-angeles", "las-vegas", "miami", "orlando", "san-francisco", "chicago", "toronto", "vancouver", "montreal",
    "mexico-city", "cancun", "rio", "sao-paulo", "buenos-aires", "lima", "santiago", "bogota", "panama-city", "havanna",
    "doha", "abu-dhabi", "riyadh", "jeddah", "kuwait-city", "muscat", "amman", "jerusalem", "tel-aviv", "istanbul",
    "cape-town", "johannesburg", "nairobi", "zanzibar", "marrakech", "casablanca", "cairo", "alexandria", "tunis", "addis-ababa",
    "sydney", "melbourne", "brisbane", "perth", "adelaide", "gold-coast", "auckland", "queenstown", "wellington", "christchurch"
"goa","jaipur","manali","darjeeling","digha","shimla","ooty","munnar","rishikesh","varanasi",
"udaipur","jodhpur","amritsar","ladakh","kasol","mussoorie","pondicherry","andaman","lakshadweep","coorg",
"dubai","paris","bali","bangkok","rome","tokyo","singapore","london","new-york","istanbul"

]


def insert_activities(city):

    activities = [

        {
            "title": f"{city} City Tour",
            "city_slug": city,
            "price": "$45",
            "image_url": "https://api.pexels.com/v1/search?query=${query}&per_page=3&page=${Math.floor(Math.random() * 5) + 1}",
            "affiliate_link": "https://tp.media/r?marker=417668"
        },

        {
            "title": f"{city} Adventure Experience",
            "city_slug": city,
            "price": "$70",
            "image_url": "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg",
            "affiliate_link": "https://tp.media/r?marker=417668"
        }

    ]

    for a in activities:

        try:

            check = supabase.table("activities") \
                .select("id") \
                .eq("title", a["title"]) \
                .execute()

            if check.data:
                print("Activity exists:", a["title"])
                continue

            supabase.table("activities").insert(a).execute()

            print("Activity saved:", a["title"])

        except Exception as e:

            print("Activity error:", e)


def insert_tours(city):

    tours = [

        {
            "title": f"{city} Guided Tour",
            "city_slug": city,
            "price": "$60",
            "image_url": "https://images.pexels.com/photos/210243/pexels-photo-210243.jpeg",
            "affiliate_link": "https://tp.media/r?marker=417668"
        }

    ]

    for t in tours:

        try:

            check = supabase.table("tours") \
                .select("id") \
                .eq("title", t["title"]) \
                .execute()

            if check.data:
                print("Tour exists:", t["title"])
                continue

            supabase.table("tours").insert(t).execute()

            print("Tour saved:", t["title"])

        except Exception as e:

            print("Tour error:", e)


for city in cities:

    print("Processing:", city)

    insert_activities(city)

    insert_tours(city)


print("ACTIVITIES + TOURS IMPORT FINISHED")