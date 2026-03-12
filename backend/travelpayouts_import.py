import requests
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("../.env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def insert_demo_hotels(city):

    hotels = [
        {
            "name": f"{city} Grand Hotel",
            "city": city,
            "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945",
            "price": "$250",
            "affiliate_link": f"https://tp.media/r?marker=417668&u=https://www.booking.com"
        },
        {
            "name": f"{city} Beach Resort",
            "city": city,
            "image_url": "https://images.unsplash.com/photo-1582719508461-905c673771fd",
            "price": "$180",
            "affiliate_link": f"https://tp.media/r?marker=417668&u=https://www.booking.com"
        },
        {
            "name": f"{city} Luxury Palace",
            "city": city,
            "image_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
            "price": "$420",
            "affiliate_link": f"https://tp.media/r?marker=417668&u=https://www.booking.com"
        }
    ]

    for h in hotels:

        try:
            supabase.table("hotels").insert(h).execute()
            print("Saved:", h["name"])
        except Exception as e:
            print("Error:", e)


cities = [
    "goa", "jaipur", "manali", "darjeeling", "digha", "shimla", "ooty", "munnar", "rishikesh", "varanasi",
    "udaipur", "jodhpur", "amritsar", "ladakh", "kasol", "mussoorie", "pondicherry", "andaman", "lakshadweep", "coorg",
]

for city in cities:

    print("Creating hotels for:", city)

    insert_demo_hotels(city)





