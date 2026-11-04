#!/usr/bin/env python3
"""GTH PRO Real Estate: one-time, opt-in invitations to selected Telegram groups.

Runs independently on GitHub Actions; does not call or deploy GTH PRO website.
Every target receives at most one attempted invitation, with conservative checks
against previously sent invitations across separate runner executions.
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import os
import re
import socket
import sys
from typing import Sequence

INVITATION_LINK = "https://www.gthproglobal.com/real-estate"
INVITATION_TEXT = (
    "Namaste dosto! Main GTH PRO Real Estate portal ka founder hoon. "
    "Mumbai, Navi Mumbai, Thane aur Dombivli ke property owners, builders "
    "aur authorized brokers ko ek invitation dena chahta hoon.\n\n"
    "Aapke paas genuine sale/rent property ya project hai to aap hamare "
    "portal par free listing ke liye details share kar sakte hain. "
    "Hum abhi real, original property inventory build kar rahe hain, "
    "isliye main khud onboarding mein help karunga.\n\n"
    f"Yahan dekhiye: {INVITATION_LINK}\n\n"
    "Interested hain to group mein reply kar sakte hain. Dhanyavaad!"
)
# Explicitly selected groups; NEVER discover, join, DM or scrape members.
INITIAL_GROUPS = ("@maratha_realtors", "@MumbaiPropertyDeals", "@indian_realty")
USERNAME_PATTERN = re.compile(r"@[A-Za-z0-9_]{5,32}\Z")
MIN_SECONDS_BETWEEN_ATTEMPTS = 300
MAX_SENDS_PER_RUN = 3
MARKER_PREFIX = "GTHPRO_ONE_TIME_BROKER_INVITE_V1"
LOG = logging.getLogger("gth-telegram")


def safe_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="backslashreplace")
            except (LookupError, OSError, ValueError):
                pass
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def is_enabled(value: str) -> bool:
    return value.strip().lower() == "true"


def normalize_username(value: str) -> str:
    handle = value.strip()
    if not USERNAME_PATTERN.fullmatch(handle):
        raise ValueError("Target must be an explicit public group @username")
    return handle.lower()


def approved_groups(extra: str = "") -> tuple[str, ...]:
    # New groups must be intentionally added to BROKER_EXTRA_APPROVED_GROUPS.
    handles = list(INITIAL_GROUPS)
    if extra.strip():
        handles.extend(item.strip() for item in extra.split(","))
    names = [normalize_username(name) for name in handles]
    if len(names) != len(set(names)):
        raise ValueError("Duplicate approved group usernames")
    if len(names) > 50:
        raise ValueError("Maximum 50 explicitly approved groups")
    return tuple(names)


def sent_marker(peer_id: int) -> str:
    return f"{MARKER_PREFIX}:{peer_id}"


def message_is_invitation(message: str | None) -> bool:
    return bool(message and "gthproglobal.com/real-estate" in message.lower())


def credentials() -> tuple[int, str, str]:
    """Credentials MUST come only from GitHub Actions Secrets / environment."""
    api_id = int(os.environ["TELEGRAM_API_ID"])
    api_hash = os.environ["TELEGRAM_API_HASH"].strip()
    session = os.environ["TELEGRAM_SESSION_STRING"].strip()
    if api_id <= 0 or not api_hash or not session:
        raise ValueError("Missing or invalid Telegram environment credentials")
    return api_id, api_hash, session


async def connect_safely(client: object) -> None:
    for attempt in range(3):
        try:
            await client.connect()
            return
        except (OSError, ConnectionError, TimeoutError, socket.gaierror) as exc:
            if attempt == 2:
                raise RuntimeError("Telegram connection failed") from exc
            LOG.warning("10054/NameResolution/timeout while connecting; retrying")
            await asyncio.sleep(10 * (attempt + 1))


async def was_already_invited(client: object, entity: object, peer_id: int, me: object) -> bool:
    """Fail closed if cross-run checks cannot complete. Never delete sent evidence."""
    # The account's own prior group messages are the primary durable evidence.
    async for message in client.iter_messages(
        entity, from_user=me, search="gthproglobal.com", limit=50
    ):
        if message_is_invitation(message.raw_text):
            return True

    # Private secondary ledger in Telegram Saved Messages (survives GitHub runners).
    marker = sent_marker(peer_id)
    async for message in client.iter_messages("me", search=MARKER_PREFIX, limit=100):
        if marker in (message.raw_text or ""):
            return True
    return False


async def run(groups: Sequence[str]) -> int:
    from telethon import TelegramClient, utils
    from telethon.errors import FloodWaitError, RPCError
    from telethon.sessions import StringSession

    api_id, api_hash, session = credentials()
    client = TelegramClient(
        StringSession(session), api_id, api_hash,
        connection_retries=3, request_retries=2, retry_delay=5,
        flood_sleep_threshold=0, auto_reconnect=True,
    )
    sent = already_sent = unavailable = 0
    attempts = 0
    try:
        await connect_safely(client)
        if not await client.is_user_authorized():
            raise RuntimeError("TELEGRAM_SESSION_STRING is no longer authorized")
        me = await client.get_me()
        if me is None:
            raise RuntimeError("Telegram account identity missing")

        # Match only exact usernames of joined GROUPS; never broadcast to users.
        dialogs: dict[str, object] = {}
        async for dialog in client.iter_dialogs():
            if dialog.is_group:
                username = getattr(dialog.entity, "username", None)
                if username:
                    dialogs["@" + username.lower()] = dialog.entity

        for name in groups:
            if sent >= MAX_SENDS_PER_RUN:
                break
            entity = dialogs.get(name)
            if entity is None:
                LOG.warning("%s not joined/accessible as public group; skipped", name)
                unavailable += 1
                continue
            peer_id = utils.get_peer_id(entity)
            try:
                seen = await was_already_invited(client, entity, peer_id, me)
            except FloodWaitError:
                LOG.error("FloodWait: stopping immediately")
                return 1
            except (OSError, ConnectionError, TimeoutError, RPCError):
                LOG.error("%s duplicate check unavailable; skipped safely", name)
                unavailable += 1
                continue

            if seen:
                LOG.info("%s already invited before: permanent skip", name)
                already_sent += 1
                continue

            # Five minutes between send ATTEMPTS, including unknown outcomes.
            if attempts:
                LOG.info("Pausing %ss before next send attempt", MIN_SECONDS_BETWEEN_ATTEMPTS)
                await asyncio.sleep(MIN_SECONDS_BETWEEN_ATTEMPTS)
            attempts += 1
            try:
                await client.send_message(entity, INVITATION_TEXT, link_preview=False)
                sent += 1
                LOG.info("%s: Telegram accepted one-time invitation", name)
            except FloodWaitError:
                LOG.error("FloodWait: no retry and no further messages")
                return 1
            except (OSError, ConnectionError, TimeoutError, RPCError):
                # Delivery is uncertain. Do not retry in this execution.
                LOG.error("%s: send failed/unknown; no retry", name)
                unavailable += 1
                continue

            # Ledger failure does not cause retransmission; group history is primary.
            try:
                await client.send_message(
                    "me", sent_marker(peer_id) + " " + name, link_preview=False
                )
            except (OSError, ConnectionError, TimeoutError, RPCError):
                LOG.warning("%s: ledger unavailable; verify original group history", name)

        LOG.info("Results: sent=%d previous=%d unavailable=%d", sent, already_sent, unavailable)
        return 0 if unavailable == 0 else 2
    finally:
        await client.disconnect()


def main() -> int:
    safe_console()
    parser = argparse.ArgumentParser(description="One-time GTH PRO broker invitations")
    parser.add_argument("--dry-run", action="store_true", help="No network or Telegram sends")
    options = parser.parse_args()

    try:
        groups = approved_groups(os.environ.get("BROKER_EXTRA_APPROVED_GROUPS", ""))
        if options.dry_run:
            LOG.info("DRY RUN: no network access; approved groups: %s", ", ".join(groups))
            LOG.info("Invitation preview:\n%s", INVITATION_TEXT)
            return 0
        if not is_enabled(os.environ.get("BROKER_OUTREACH_ENABLED", "")):
            LOG.info("Not activated; one-time invitations disabled by default")
            return 0
        return asyncio.run(run(groups))
    except (KeyError, ValueError, RuntimeError):
        LOG.error("Stopped: missing/invalid credentials or configuration")
        return 1
    except (OSError, ConnectionError, TimeoutError):
        LOG.error("Stopped: DNS/connection reset 10054/network timeout")
        return 1
    except Exception as exc:
        LOG.error("Stopped safely due to %s", type(exc).__name__)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
