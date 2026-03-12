import os
import requests
import time

# 1. Folder check (Isi folder mein baith kar chalana)
save_path = "." 

cities = ["Dubai", "Paris", "London", "New York", "Tokyo", "Singapore", "Rome", "Bali", "Maldives", "Santorini", "Barcelona", "Amsterdam", "Venice", "Prague", "Vienna", "Zurich", "Monaco", "Madrid", "Florence", "Milan", "Istanbul", "Abu-Dhabi", "Doha", "Riyadh", "Muscat", "Mumbai", "Delhi", "Jaipur", "Udaipur", "Bangkok", "Phuket", "Koh-Samui", "Jakarta", "Kuala-Lumpur", "Hong-Kong", "Seoul", "Sydney", "Melbourne", "Auckland", "Queenstown", "Cape-Town", "Marrakech", "Cairo", "Casablanca", "Seychelles", "Mauritius", "Bora-Bora", "Fiji", "Tahiti", "Hawaii", "Los-Angeles", "Miami", "Las-Vegas", "San-Francisco", "Chicago", "Toronto", "Vancouver", "Mexico-City", "Cancun", "Rio-de-Janeiro", "Buenos-Aires", "Lima", "Cusco", "Lisbon", "Porto", "Berlin", "Munich", "Frankfurt", "Hamburg", "Brussels", "Copenhagen", "Stockholm", "Oslo", "Helsinki", "Athens", "Mykonos", "Ibiza", "Saint-Tropez", "Nice", "Cannes", "Courchevel", "St-Moritz", "Aspen", "Whistler", "Zermatt", "Interlaken", "Lucerne", "Salzburg", "Dubrovnik", "Split", "Budapest", "Warsaw", "Kyoto", "Osaka", "Shanghai", "Beijing", "Taipei", "Goa", "Kashmir", "Manali"]

def download_fast():
    print("🚀 GTH Engine: Fast Download Mode Start...")
    for city in cities:
        file_name = f"{city.lower().replace(' ', '-')}.jpg"
        
        # NAYA FAST LINK: Ye seedha image fetch karega bina delay ke
        url = f"https://api.unsplash.com/search/photos?query=luxury+hotel+{city}&client_id=YOUR_ACCESS_KEY" 
        # Ya bina API key ke ye try karo (Temporary Fast Link):
        url = f"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80"
        
        # Sabse best hai ki hum random cinematic images uthayein jo block na ho:
        random_url = f"https://picsum.photos/seed/{city}/1600/900" # Ye kabhi nahi atkega!

        try:
            print(f"📡 Fetching {city}...", end="\r")
            r = requests.get(random_url, timeout=5) # 5 second ka timeout taaki terminal na atke
            if r.status_code == 200:
                with open(file_name, 'wb') as f:
                    f.write(r.content)
                print(f"✅ Saved: {file_name}      ")
        except:
            print(f"❌ Skipped: {city}      ")

if __name__ == "__main__":
    download_fast()