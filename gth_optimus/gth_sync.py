import json
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env.local")


def _require_ingestion_client():
    enabled = os.getenv("GTH_INGESTION_ENABLED", "").strip().lower() in {"1", "true", "yes"}
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_INGESTION_KEY")

    if not enabled:
        raise RuntimeError(
            "Bulk sync is disabled. Set GTH_INGESTION_ENABLED=true only for an intentional admin/import run."
        )
    if not url or not key:
        raise RuntimeError(
            "Bulk sync requires NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_INGESTION_KEY."
        )
    return create_client(url, key)


def bulk_sync_cities(source_path="master_cities.json"):
    source = Path(source_path)
    if not source.is_absolute():
        source = Path.cwd() / source

    with source.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if not isinstance(data, list):
        raise ValueError("City source must be a JSON array.")

    supabase = _require_ingestion_client()
    total = len(data)

    for start in range(0, total, 500):
        chunk = data[start : start + 500]
        if not all(isinstance(item, dict) for item in chunk):
            raise ValueError("Every city record must be a JSON object.")
        supabase.table("cities").upsert(chunk).execute()
        print(f"Synced: {start + len(chunk)} / {total}")


if __name__ == "__main__":
    bulk_sync_cities()
