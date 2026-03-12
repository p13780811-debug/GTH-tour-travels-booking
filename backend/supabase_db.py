from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def save_destination(data):

    try:

        existing = supabase.table("destinations") \
            .select("id") \
            .eq("name", data["name"]) \
            .execute()

        if existing.data:
            print("⚠️ Already exists:", data["name"])
            return

        supabase.table("destinations").insert(data).execute()

        print("✅ Saved:", data["name"])

    except Exception as e:

        print("❌ Supabase Error:", e)