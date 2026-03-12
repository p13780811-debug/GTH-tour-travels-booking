import requests
from config import TRAVELPAYOUTS_TOKEN

def get_hotels(city):

    url = "https://engine.hotellook.com/api/v2/cache.json"

    params = {
        "location": city,
        "currency": "usd",
        "limit": 5,
        "token": TRAVELPAYOUTS_TOKEN
    }

    try:
        r = requests.get(url, params=params)

        if r.status_code == 200:
            data = r.json()

            hotels = []

            for h in data[:5]:

                hotels.append({
                    "name": h.get("hotel_name"),
                    "price": h.get("price_from"),
                    "stars": h.get("stars"),
                    "rating": h.get("rating")
                })

            return hotels

    except Exception as e:
        print("Hotel API error:", e)

    return []