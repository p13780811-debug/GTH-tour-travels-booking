import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env.local"))

GEMINI_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_PRO_KEY")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_INGESTION_KEY = os.getenv("SUPABASE_INGESTION_KEY")
TRAVELPAYOUTS_TOKEN = (
    os.getenv("TRAVELPAYOUTS_API_TOKEN")
    or os.getenv("TRAVELPAYOUTS_TOKEN")
    or os.getenv("AVIASALES_API_TOKEN")
)
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

INGESTION_ENABLED = os.getenv("GTH_INGESTION_ENABLED", "").strip().lower() in {
    "1",
    "true",
    "yes",
}


def require_ingestion_settings():
    if not INGESTION_ENABLED:
        raise RuntimeError(
            "Offline ingestion is disabled. Set GTH_INGESTION_ENABLED=true only for an intentional admin/import run."
        )
    if not SUPABASE_URL or not SUPABASE_INGESTION_KEY:
        raise RuntimeError(
            "Offline ingestion requires NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_INGESTION_KEY."
        )
    return SUPABASE_URL, SUPABASE_INGESTION_KEY
