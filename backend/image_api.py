import requests
from config import PEXELS_API_KEY


def get_city_image(city):

    headers = {
        "Authorization": PEXELS_API_KEY
    }

    url = f"https://api.pexels.com/v1/search?query={city}+luxury+travel&per_page=1"

    try:
        r = requests.get(url, headers=headers)

        if r.status_code == 200:
            data = r.json()

            if data["photos"]:
                return data["photos"][0]["src"]["large"]

    except Exception as e:
        print("Image API error:", e)

    return ""