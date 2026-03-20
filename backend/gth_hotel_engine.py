import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# 1. SETUP: .env load karna
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# Credentials jo aapki photo mein the
TP_TOKEN = os.getenv("TRAVELPAYOUTS_API_TOKEN")

def get_hotel_offers_v3(iata_code):
    print(f"🚀 Fetching LIVE Hotel Offers for: {iata_code}...")
    
    # Ye naya V3 Endpoint hai jo Travelpayouts ab recommend karta hai
    url = f"https://api.travelpayouts.com/v3/hotels/prices"
    
    # Parameters: IATA code use karein (jaise 'DEL', 'BOM')
    params = {
        "code": iata_code,
        "currency": "inr",
        "checkIn": "2026-05-20",
        "checkOut": "2026-05-25",
        "token": TP_TOKEN,
        "limit": 5
    }

    try:
        # Headers wahi rakhein jo Flights mein chal rahe hain
        headers = {"Accept-Encoding": "gzip, deflate"}
        
        res = requests.get(url, params=params, headers=headers, timeout=20)
        
        print(f"📡 Status Code: {res.status_code}")

        if res.status_code == 200:
            data = res.json()
            if not data:
                print("⚠️ API Connected but no data returned.")
                return []
            
            # Data parsing
            results = []
            for item in data:
                hotel_id = item.get("hotel_id")
                # Photo generation logic
                photo_url = f"https://photos.hotellook.com/image_v2/crop/{hotel_id}/1/600/400.jpg"
                
                results.append({
                    "name": item.get("hotel_name", "Unknown Hotel"),
                    "price": item.get("price", 0),
                    "photo": photo_url,
                    "location": iata_code
                })
            return results
        else:
            print(f"❌ API Failed: {res.status_code} - {res.text[:100]}")
            return []

    except Exception as e:
        print(f"❌ Crash: {e}")
        return []

# --- TEST ---
if __name__ == "__main__":
    # Test with Delhi (DEL)
    hotel_list = get_hotel_offers_v3("DEL")
    
    if hotel_list:
        print(f"\n✅ Total {len(hotel_list)} Hotels Found!")
        for h in hotel_list:
            print(f"HOTEL: {h['name']} | PRICE: ₹{h['price']}")
            print(f"IMAGE: {h['photo']}")
            print("-" * 20)
    else:
        print("\n❌ Data fetch nahi ho paya.")