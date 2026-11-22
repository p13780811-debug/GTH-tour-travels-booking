"""Existing GTH PRO offline ingestion boundary with bounded, scoped SEO updates."""
from __future__ import annotations

from config import require_ingestion_settings


def _ingestion_client():
    # Do not use the browser/public anon key for privileged draft writes.
    from supabase import create_client
    url, key = require_ingestion_settings()
    return create_client(url, key)


def read_destination_page(client, *, cursor="", limit=100, pending_only=False):
    """One bounded keyset query; never count/scan all destinations in one request."""
    if not 1 <= limit <= 200:
        raise ValueError("DB read page size out of range")
    q = (client.table("destinations")
         .select("id,name,slug,country,country_code,is_active,description,seo_title,seo_description")
         .eq("is_active", True).order("id").limit(limit))
    if pending_only:
        # Server-side filter prevents each scheduled run from rescanning completed cities.
        # Never modify approval/indexability flags; this selects missing draft fields only.
        q = q.or_("seo_title.is.null,seo_title.eq.,seo_description.is.null,seo_description.eq.,description.is.null,description.eq.")
    if cursor:
        q = q.gt("id", cursor)
    data = q.execute().data
    if not isinstance(data, list) or len(data) > limit:
        raise RuntimeError("Invalid bounded DB page")
    return data


def pending_seo_draft(row):
    if not isinstance(row, dict) or not isinstance(row.get("id"), str):
        return False
    return not (isinstance(row.get("seo_title"), str) and row["seo_title"].strip()
                and isinstance(row.get("seo_description"), str) and row["seo_description"].strip()
                and isinstance(row.get("description"), str) and len(row["description"].strip()) >= 270)


def _replaceable_description(value):
    if not isinstance(value, str) or not value.strip():
        return True
    return value.startswith((
        "Destination reference sourced from the official country/city directory.",
        "Explore local services, reviewed venues and country-level opportunities.",
        "Explore destination information and confirm planning details with providers.",
    ))


def save_seo_draft(client, city, draft):
    """Only set missing SEO fields on the exact unchanged row; never set approval flags."""
    if city.get("id") != draft.get("id"):
        raise ValueError("Mismatched draft city ID")
    changes = {}
    if not str(city.get("seo_title") or "").strip():
        changes["seo_title"] = draft["seo_title"]
    if not str(city.get("seo_description") or "").strip():
        changes["seo_description"] = draft["seo_description"]
    if _replaceable_description(city.get("description")):
        changes["description"] = draft["description"]
    if not changes:
        return False
    q = (client.table("destinations").update(changes)
         .eq("id", city["id"]).eq("slug", city["slug"])
         .eq("name", city["name"]).eq("is_active", True))
    # Optimistic concurrency prevents overwriting editorial changes made mid-run.
    for key in changes:
        old = city.get(key)
        q = q.is_(key, "null") if old is None else q.eq(key, old)
    data = q.select("id").execute().data
    if not isinstance(data, list) or len(data) != 1:
        raise RuntimeError("City changed concurrently; draft was not overwritten")
    return True


def save_destination(data):
    """Original create-only entry point; retained for legacy import callers."""
    if not isinstance(data, dict):
        raise ValueError("Destination payload must be an object.")
    name = data.get("name")
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 120:
        raise ValueError("Destination name is required and must be at most 120 characters.")
    client = _ingestion_client()
    try:
        existing = client.table("destinations").select("id").eq("name", name.strip()).limit(1).execute()
        if existing.data:
            return False
        client.table("destinations").insert(data).execute()
        return True
    except Exception as exc:
        raise RuntimeError("Destination write failed.") from exc
