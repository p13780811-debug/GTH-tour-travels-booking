import requests
from bs4 import BeautifulSoup

def get_activities(city):

    url = f"https://www.google.com/search?q=top+things+to+do+in+{city}"

    headers = {"User-Agent": "Mozilla/5.0"}

    r = requests.get(url, headers=headers)

    soup = BeautifulSoup(r.text, "html.parser")

    activities = []

    for h in soup.select("h3")[:5]:
        activities.append(h.text)

    return activities