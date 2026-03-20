import os
import requests
from dotenv import load_dotenv
from supabase import create_client
from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

load_dotenv()

# --- SECURITY: ZERO LEAKAGE ---
TP_TOKEN = os.getenv("TRAVELPAYOUTS_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------------------
# FETCH FLIGHT PRICE (V3 API)
# ---------------------------
def get_flight_price(iata_code):
    try:
        url = (
            f"https://api.travelpayouts.com/aviasales/v3/prices_for_dates"
            f"?origin=DEL&destination={iata_code}&currency=inr&token={TP_TOKEN}&unique=true"
        )

        res = requests.get(url, timeout=15)

        # DEBUG INFO
        print("FLIGHT URL:", url)
        print("FLIGHT STATUS:", res.status_code)

        if res.status_code != 200:
            print("Flight API failed:", res.text[:200])
            return 0

        if not res.text:
            print("Flight API returned empty response")
            return 0

        data = res.json()

        flights = data.get("data", [])

        if flights and isinstance(flights, list):
            return flights[0].get("price", 0)

        return 0

    except Exception as e:
        print(f"Flight Error for {iata_code}: {e}")
        return 0

# ---------------------------
# FETCH HOTEL PRICE (Hotellook)
# ---------------------------
def get_hotel_price(location_id):
    try:
        url = (
            f"https://engine.hotellook.com/api/v2/static/hotels.json"
            f"?location={location_id}&currency=inr&token={TP_TOKEN}&limit=1"
        )

        res = requests.get(url, timeout=15)

        # DEBUG INFO
        print("HOTEL URL:", url)
        print("HOTEL STATUS:", res.status_code)

        if res.status_code != 200:
            print("Hotel API failed:", res.text[:200])
            return 0

        if not res.text:
            print("Hotel API returned empty response")
            return 0

        data = res.json()

        if isinstance(data, list) and len(data) > 0:
            hotel = data[0]
            return hotel.get("priceAvg", hotel.get("price_avg", 0))

        return 0

    except Exception as e:
        print(f"Hotel Error for ID {location_id}: {e}")
        return 0

# ---------------------------
# MAIN SYNC (The Luxury Hub)
# ---------------------------
def start_sync():
    print("🚀 GTH PRO: MEGA SYNC STARTED")
    # Yahan hum Cities.py se import kar sakte hain ya direct list use karein
    from cities import CITIES_MASTER 

    for city in CITIES_MASTER[:3]: # Testing 3 cities
        name = city["name"]
        code = city["iata_code"]
        loc_id = city["tp_location_id"]

        print(f"🔎 Processing {name}...")

        f_price = get_flight_price(code)
        h_price = get_hotel_price(loc_id)
        
        # Luxury Content Polish
        image = f"https://images.unsplash.com/photo-1506012733048-59311aa6e30f?auto=format&fit=crop&w=1600&q=80&luxury-travel-{name}"
        
        payload = {
            "city_name": name,
            "iata_code": code,
            "flight_price": f_price,
            "hotel_price": h_price,
            "hero_image": image,
            "seo_blog": f"Luxury deals for {name}: Flights ₹{f_price}, Hotels ₹{h_price}.",
            "status": "ORIGINAL_LIVE"
        }

        try:
            # Upsert ensures data refresh without duplication
            supabase.table("gth_pro_mega_hub").upsert(
    payload,
    on_conflict="iata_code"
).execute()
            print(f"✅ {name} SYNCED (Flight: {f_price}, Hotel: {h_price})")
        except Exception as e:
            print(f"❌ Supabase Error for {name}: {e}")

if __name__ == "__main__":
    start_sync()