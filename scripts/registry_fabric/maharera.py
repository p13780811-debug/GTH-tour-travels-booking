"""Bounded source reader for the operator-supplied MahaRERA public project-detail route.

No endpoint discovery by brute force, session replay, CAPTCHA handling or credentials.
An unverified/changed public contract stops collection rather than fabricating data.
"""
from __future__ import annotations

import json
import re
import ssl
import time
from urllib import error, request, robotparser
from urllib.parse import urlsplit

from .core import RegistryValidationError

ENDPOINT = (
    "https://maharerait.maharashtra.gov.in/api/"
    "maha-rera-public-view-project-registration-service/public/projectregistartion/"
    "getProjectGeneralDetailsByProjectId"
)
ORIGIN = "https://maharerait.maharashtra.gov.in"
USER_AGENT = "GTH-PRO-Registry-Research/1.0 (+https://gthproglobal.com)"
MAX_RESPONSE_BYTES = 2_000_000


def allowed_by_robots(opener=request.urlopen) -> bool:
    req = request.Request(ORIGIN + "/robots.txt", headers={"User-Agent": USER_AGENT})
    try:
        with opener(req, timeout=20, context=ssl.create_default_context()) as result:
            if result.status != 200 or result.geturl() != ORIGIN + "/robots.txt":
                raise RegistryValidationError("Robots policy was not confirmed")
            content = result.read(100000)
    except (error.URLError, OSError) as exc:
        raise RegistryValidationError("Robots policy unavailable") from exc
    policy = robotparser.RobotFileParser()
    policy.parse(content.decode("utf-8", errors="replace").splitlines())
    return policy.can_fetch(USER_AGENT, ENDPOINT)


def parse_public_detail(data: object, requested_id: int) -> dict:
    if not isinstance(data, dict):
        raise RegistryValidationError("Unsupported endpoint envelope")
    if str(data.get("statusCode", "")) in ("401", "403"):
        raise RegistryValidationError("Public endpoint requires authorization")
    inner = data.get("data", data.get("response", data))
    if not isinstance(inner, dict):
        raise RegistryValidationError("Unsupported endpoint response structure")
    project = inner.get("projectDetails", inner)
    if not isinstance(project, dict) or str(project.get("projectId")) != str(requested_id):
        raise RegistryValidationError("Project ID mismatch or absent")
    registration = project.get("projectRegistartionNo") or project.get("projectRegistrationNo")
    name = project.get("projectName")
    address = project.get("legalAddress") or project.get("projectLandAddressDetails") or {}
    if not isinstance(address, dict):
        raise RegistryValidationError("Unsupported project address structure")
    district = project.get("districtName") or project.get("projectDistrictName") or address.get("districtName")
    if not all(isinstance(x, str) and x.strip() for x in (registration, name, district)):
        raise RegistryValidationError("Missing source-backed project identity or district")
    promoter = inner.get("promoterDetails") or {}
    if not isinstance(promoter, dict):
        raise RegistryValidationError("Unsupported promoter field shape")
    return {
        "rera_id": registration, "project_name": name, "district": district,
        "developer_name": promoter.get("promoterName") or project.get("promoterName"),
        "location": address.get("projectAddressText") or address.get("addressLine1"),
        "official_source_url": ENDPOINT,
    }


def read_public_ids(ids: list[int], *, delay: float = 5.0, opener=request.urlopen):
    if not (1 <= len(ids) <= 100) or len(ids) != len(set(ids)) or any(
        type(i) is not int or not (1 <= i <= 10_000_000) for i in ids
    ):
        raise RegistryValidationError("Provide 1-100 distinct known numeric public project IDs")
    if delay < 5:
        raise RegistryValidationError("Government source pacing must be at least five seconds")
    if not allowed_by_robots(opener=opener):
        raise RegistryValidationError("Government robots policy disallows this request")
    for index, project_id in enumerate(ids):
        if index:
            time.sleep(delay)
        body = json.dumps({"projectId": str(project_id)}).encode("utf-8")
        req = request.Request(ENDPOINT, data=body, method="POST", headers={
            "User-Agent": USER_AGENT, "Accept": "application/json",
            "Content-Type": "application/json",
        })
        try:
            with opener(req, timeout=35, context=ssl.create_default_context()) as response:
                if response.status != 200 or response.geturl() != ENDPOINT:
                    raise RegistryValidationError("Source status/redirect differs from approved endpoint")
                if "json" not in response.headers.get("Content-Type", "").lower():
                    raise RegistryValidationError("Official source did not return JSON")
                raw = response.read(MAX_RESPONSE_BYTES + 1)
        except (error.URLError, OSError) as exc:
            raise RegistryValidationError("Official source request failed; stop without writes") from exc
        if len(raw) > MAX_RESPONSE_BYTES:
            raise RegistryValidationError("Official source response exceeded safe limit")
        try:
            payload = json.loads(raw)
        except (ValueError, UnicodeError) as exc:
            raise RegistryValidationError("Official source returned invalid JSON") from exc
        yield parse_public_detail(payload, project_id)


def load_known_ids(path, *, offset: int, limit: int) -> list[int]:
    from pathlib import Path
    file = Path(path)
    if file.is_symlink() or not file.is_file() or file.stat().st_size > 2_000_000:
        raise RegistryValidationError("Known ID file must be a regular file under 2 MB")
    ids = [x.strip() for x in file.read_text(encoding="utf-8-sig").splitlines() if x.strip()]
    if len(ids) > 100_000 or any(not re.fullmatch(r"[1-9][0-9]{0,6}", x) for x in ids):
        raise RegistryValidationError("Known IDs must be distinct numeric internal project IDs")
    selection = ids[offset:offset + limit]
    if not selection:
        raise RegistryValidationError("Selected known-ID window is empty")
    return [int(x) for x in selection]
