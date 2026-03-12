import requests
from supabase import create_client
import os
from dotenv import load_dotenv

# load env
load_dotenv("../.env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
PEXELS_KEY = os.getenv("PEXELS_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_city_image(city):

    try:

        url = f"https://api.pexels.com/v1/search?query={city}%20travel&per_page=1"

        headers = {
            "Authorization": PEXELS_KEY
        }

        r = requests.get(url, headers=headers)
        data = r.json()

        if data["photos"]:
            return data["photos"][0]["src"]["large"]

    except:
        pass

    return "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg"


def insert_city_data(city):

    city_image = get_city_image(city)

    hotels = [

        {
            "name": f"{city} Grand Hotel",
            "city": city,
            "image_url": city_image,
            "price": "$250",
            "affiliate_link": "https://tp.media/r?marker=417668&u=https://www.booking.com"
        },

        {
            "name": f"{city} Beach Resort",
            "city": city,
            "image_url": city_image,
            "price": "$180",
            "affiliate_link": "https://tp.media/r?marker=417668&u=https://www.booking.com"
        },

        {
            "name": f"{city} Luxury Palace",
            "city": city,
            "image_url": city_image,
            "price": "$420",
            "affiliate_link": "https://tp.media/r?marker=417668&u=https://www.booking.com"
        }

    ]

    activities = [

        {
            "title": f"{city} City Tour",
            "city": city,
            "price": "$45",
            "image_url": city_image,
            "affiliate_link": "https://tp.media/r?marker=417668"
        },

        {
            "title": f"{city} Adventure Experience",
            "city": city,
            "price": "$70",
            "image_url": city_image,
            "affiliate_link": "https://tp.media/r?marker=417668"
        }

    ]

    tours = [

        {
            "title": f"{city} Guided Tour",
            "city": city,
            "price": "$60",
            "image_url": city_image,
            "affiliate_link": "https://tp.media/r?marker=417668"
        }

    ]

    for h in hotels:

        try:
            supabase.table("hotels").insert(h).execute()
            print("Hotel saved:", h["name"])
        except Exception as e:
            print("Hotel error:", e)

    for a in activities:

        try:
            supabase.table("activities").insert(a).execute()
            print("Activity saved:", a["title"])
        except Exception as e:
            print("Activity error:", e)

    for t in tours:

        try:
            supabase.table("tours").insert(t).execute()
            print("Tour saved:", t["title"])
        except Exception as e:
            print("Tour error:", e)


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


for city in cities:

    print("Processing:", city)

    try:
        insert_city_data(city)
    except Exception as e:
        print("City failed:", city, e)


print("IMPORT FINISHED")