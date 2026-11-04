#!/usr/bin/env python3
"""Permission-based, scheduled Telegram outreach for GTH PRO Real Estate.

No outgoing message without explicit enable flag, admin-approved group IDs,
valid account authentication, and cross-run duplicate detection.
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import os
import re
import socket
import sys
from datetime import datetime, timedelta, timezone
from typing import Sequence

SITE_URL = "https://www.gthproglobal.com/real-estate"
OUTREACH_MESSAGE = (
    "Namaste dosto! Main GTH PRO Real Estate ka founder hoon. "
    "Mumbai, Navi Mumbai, Thane ya Dombivli side mein agar aap owner, "
    "builder ya authorized broker hain aur genuine sale/rent property "
    "list karna chahte hain, to hamare portal par listing submit karna "
    "free hai. Photos, property details aur listing rights ke saath "
    "submission hoti hai; publication se pehle review hota hai.\n\n"
    f"Link: {SITE_URL}\n\n"
    "Kisi ko property list karne mein help chahiye to reply kar sakte hain. "
    "Thanks! - GTH PRO"
)
MIN_INTERVAL_SECONDS = 300
COOLDOWN_DAYS = 14
MAX_TARGETS = 3
TARGET_PATTERN = re.compile(r"-\d{5,20}\Z")
LOG = logging.getLogger("gth-broker-outreach")


def configure_output() -> None:
    # Avoid cp1252 UnicodeEncodeError on Windows consoles.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="backslashreplace")
            except (ValueError, OSError, LookupError):
                pass
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def parse_approved_ids(value: str) -> list[int]:
    if not value.strip():
        return []
    items = [entry.strip() for entry in value.split(",")]
    if any(not TARGET_PATTERN.fullmatch(item) for item in items):
        raise ValueError("Use comma-separated numeric Telegram group peer IDs")
    if len(items) != len(set(items)):
        raise ValueError("Approved target list contains duplicates")
    if len(items) > MAX_TARGETS:
        raise ValueError(f"Maximum {MAX_TARGETS} approved groups per run")
    return [int(item) for item in items]


def enabled(value: str) -> bool:
    return value.strip().lower() == "true"


def has_recent_post(last_date: datetime | None, now: datetime) -> bool:
    if last_date is None:
        return False
    if last_date.tzinfo is None:
        raise ValueError("Telegram history timestamp missing timezone")
    return now - last_date.astimezone(timezone.utc) < timedelta(days=COOLDOWN_DAYS)


def load_credentials() -> tuple[int, str, str]:
    """Never use files, defaults, or hardcoded Telegram credentials."""
    api_id = int(os.environ["TELEGRAM_API_ID"])
    api_hash = os.environ["TELEGRAM_API_HASH"].strip()
    session_string = os.environ["TELEGRAM_SESSION_STRING"].strip()
    if api_id <= 0 or not api_hash or not session_string:
        raise ValueError("Telegram authentication is not configured")
    return api_id, api_hash, session_string


async def connect_with_retries(client: object, attempts: int = 3) -> None:
    # Only retry connections, never an uncertain message send.
    for attempt in range(1, attempts + 1):
        try:
            await client.connect()
            return
        except (OSError, ConnectionError, TimeoutError, socket.gaierror) as exc:
            if attempt == attempts:
                raise RuntimeError("Telegram connection failed") from exc
            LOG.warning("10054/Connection/NameResolution timeout; retry %s/%s", attempt, attempts)
            await asyncio.sleep(min(10 * attempt, 30))


async def run_outreach(group_ids: Sequence[int]) -> int:
    from telethon import TelegramClient, utils
    from telethon.errors import FloodWaitError, RPCError
    from telethon.sessions import StringSession

    api_id, api_hash, session_string = load_credentials()
    client = TelegramClient(
        StringSession(session_string), api_id, api_hash,
        connection_retries=3, request_retries=2, retry_delay=5,
        flood_sleep_threshold=0, auto_reconnect=True,
    )
    posted = skipped = 0
    try:
        await connect_with_retries(client)
        if not await client.is_user_authorized():
            raise RuntimeError("StringSession is not authorized")
        me = await client.get_me()
        if me is None:
            raise RuntimeError("Account identity unavailable")

        # Exact ID allowlist + joined-group-only; exclude private chats and channels.
        dialogs = {}
        async for dialog in client.iter_dialogs():
            if dialog.is_group:
                dialogs[utils.get_peer_id(dialog.entity)] = dialog.entity

        attempted_sends = 0
        for index, group_id in enumerate(group_ids, start=1):
            entity = dialogs.get(group_id)
            if entity is None:
                LOG.warning("Target %d not an accessible joined group; skipping", index)
                skipped += 1
                continue
            try:
                history = client.iter_messages(
                    entity, limit=1,
                    search="gthproglobal.com/real-estate", from_user=me,
                )
                try:
                    previous = await history.__anext__()
                except StopAsyncIteration:
                    previous = None
            except FloodWaitError:
                LOG.error("FloodWait during duplicate check: stopping")
                raise
            except (RPCError, OSError, ConnectionError, TimeoutError):
                LOG.error("Cannot verify target %d history; skipping safely", index)
                skipped += 1
                continue

            if has_recent_post(previous.date if previous else None, datetime.now(timezone.utc)):
                LOG.info("Target %d contacted in last %d days; skipped", index, COOLDOWN_DAYS)
                skipped += 1
                continue

            if attempted_sends:
                LOG.info("Waiting %d seconds between group messages", MIN_INTERVAL_SECONDS)
                await asyncio.sleep(MIN_INTERVAL_SECONDS)

            attempted_sends += 1
            try:
                await client.send_message(entity, OUTREACH_MESSAGE, link_preview=False)
                posted += 1
                LOG.info("Target %d: message accepted by Telegram", index)
            except FloodWaitError:
                LOG.error("FloodWait during send; stopping without bypass")
                raise
            except (RPCError, OSError, ConnectionError, TimeoutError):
                # Transport failures might still deliver a message; never retry sends.
                LOG.error("Target %d: failed or unknown delivery; no automatic retry", index)
                skipped += 1
                continue

        LOG.info("Run done: sent=%d skipped=%d approved=%d", posted, skipped, len(group_ids))
        return 0 if skipped == 0 else 2
    finally:
        await client.disconnect()


def main() -> int:
    configure_output()
    parser = argparse.ArgumentParser(description="GTH PRO approved Telegram outreach")
    parser.add_argument("--dry-run", action="store_true", help="No Telegram connection or sending")
    args = parser.parse_args()
    group_ids = parse_approved_ids(os.environ.get("BROKER_APPROVED_GROUP_IDS", ""))

    if args.dry_run:
        LOG.info("DRY RUN: no network; approved targets configured=%d", len(group_ids))
        LOG.info("Preview:\n%s", OUTREACH_MESSAGE)
        return 0

    if not enabled(os.environ.get("BROKER_OUTREACH_ENABLED", "")):
        LOG.info("Disabled: BROKER_OUTREACH_ENABLED is not true")
        return 0
    if not group_ids:
        LOG.warning("Disabled: no admin-approved Telegram group IDs")
        return 0
    try:
        return asyncio.run(run_outreach(group_ids))
    except (KeyError, ValueError, RuntimeError) as exc:
        LOG.error("Configuration/authentication failed: %s", type(exc).__name__)
        return 1
    except (OSError, ConnectionError, TimeoutError):
        LOG.error("Network failure: 10054/timeout/DNS")
        return 1
    except Exception as exc:
        LOG.error("Stopped safely: %s", type(exc).__name__)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
