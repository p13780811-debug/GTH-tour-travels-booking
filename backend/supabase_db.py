from supabase import create_client

from config import require_ingestion_settings


def _ingestion_client():
    url, key = require_ingestion_settings()
    return create_client(url, key)


def save_destination(data):
    if not isinstance(data, dict):
        raise ValueError("Destination payload must be an object.")

    name = data.get("name")
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 120:
        raise ValueError("Destination name is required and must be at most 120 characters.")

    supabase = _ingestion_client()

    try:
        existing = (
            supabase.table("destinations")
            .select("id")
            .eq("name", name.strip())
            .limit(1)
            .execute()
        )

        if existing.data:
            print("Destination already exists:", name.strip())
            return False

        supabase.table("destinations").insert(data).execute()
        print("Destination saved:", name.strip())
        return True
    except Exception as exc:
        raise RuntimeError("Destination write failed.") from exc
