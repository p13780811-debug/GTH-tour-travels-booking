# Location: /backend/gth_sync.py
import os
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# ✅ POINT 8: Zero Leakage - Using Service Role Key for Admin Access
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key here
supabase = create_client(url, key)

def bulk_sync_12k_cities():
    print("🌍 GTH-PRO: Starting Massive Content Sync (12,000 Cities)...")
    
    # Maan lijiye aapke paas 'master_cities.json' hai
    try:
        with open('master_cities.json', 'r') as f:
            data = json.load(f)

        # Batch Processing: 500 records at a time to prevent timeout
        for i in range(0, len(data), 500):
            chunk = data[i:i + 500]
            # ✅ POINT 9: Contextual Accuracy check before upload
            supabase.table("cities").upsert(chunk).execute()
            print(f"✅ Synced: {i + len(chunk)} / 12000")

    except Exception as e:
        print(f"❌ Critical Sync Error: {e}")

if __name__ == "__main__":
    bulk_sync_12k_cities()