"""The operator-supplied public detail endpoint. No login, token or hidden route discovery."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from pydantic import ValidationError

from .models import DISTRICTS, OFFICIAL_HOSTS, IngestionError, key, normalize, text

ENDPOINT = ("https://maharerait.maharashtra.gov.in/api/"
    "maha-rera-public-view-project-registration-service/public/projectregistartion/"
    "getProjectGeneralDetailsByProjectId")


def first(objects, names):
    """Only named public fields; never recursively copy an API response."""
    values = [obj[name] for obj in objects if isinstance(obj, dict)
              for name in names if obj.get(name) not in (None, "")]
    if any(isinstance(v, (dict, list, bool)) for v in values):
        raise IngestionError("Public field changed to an unsupported structure")
    if len({text(v, 1500).casefold() for v in values}) > 1:
        raise IngestionError("Conflicting public identity fields in the endpoint response")
    return values[0] if values else None


def parse_detail(payload, requested_id, response_bytes):
    if not isinstance(payload, dict):
        raise IngestionError("Public endpoint response envelope is unsupported")
    if str(payload.get("statusCode", payload.get("code", ""))) in {"401", "403"}:
        raise IngestionError("Public endpoint requires authorization; collection stopped")
    envelope = payload
    # Known wrappers are unwrapped once. Arbitrary nested data is not harvested.
    for wrapper in ("data", "response"):
        if wrapper in payload:
            envelope = payload[wrapper]
            if envelope is None and payload.get("success") is True:
                return None, "missing"
            break
    if not isinstance(envelope, dict):
        raise IngestionError("Public endpoint did not return a supported project object")
    project = envelope.get("projectDetails", envelope)
    if not isinstance(project, dict):
        raise IngestionError("Public project detail structure is unsupported")
    identity = first([project, envelope], ("projectId",))
    if str(identity) != str(requested_id):
        raise IngestionError("Returned projectId does not match the requested public project")
    rera = first([project], ("projectRegistartionNo", "projectRegistrationNo", "reraId"))
    name = first([project], ("projectName",))
    if not rera or not name:
        raise IngestionError("Public response lacks a registered project identity")
    # Legal address objects are explicitly scoped; contacts/bank/personnel are never read.
    addresses = [project, envelope]
    for parent in (project, envelope):
        for field in ("legalAddress", "projectAddress", "projectLandAddressDetails"):
            if isinstance(parent.get(field), dict):
                addresses.append(parent[field])
    district = first(addresses, ("districtName", "projectDistrictName"))
    if key(district) not in {key(d) for d in DISTRICTS}:
        if district:
            return None, "outside_districts"
        raise IngestionError("Project district is missing; registration prefix alone is not location evidence")
    locality = first(addresses, ("villageName",)) or first(addresses, ("talukaName",))
    promoter = envelope.get("promoterDetails", {})
    raw = {"project_name": name, "rera_id": rera, "district": district,
           "locality": locality, "address": first(addresses, ("projectAddressText", "addressLine1")),
           "developer_name": first([promoter, project], ("promoterName",)),
           "property_type": first([project], ("projectTypeName",)),
           "source_url": ENDPOINT}
    try:
        result = normalize(raw)
    except (ValidationError, IngestionError):
        raise IngestionError("Public project identity or district mapping failed validation") from None
    result.registry_evidence = {"kind": "official_endpoint_record", "exact_detail_match": False,
        "project_id": int(requested_id), "request_method": "POST", "request_payload": {"projectId": str(requested_id)},
        "source_url": ENDPOINT, "source_sha256": hashlib.sha256(response_bytes).hexdigest(),
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "scope": "Public registry facts; independent identity and GTH/AI review pending"}
    return result, "accepted"


class EndpointCollector:
    def __init__(self, http):
        self.http = http

    def fetch(self, project_id):
        self.http.check_robots(ENDPOINT, OFFICIAL_HOSTS)
        raw, content_type, final_url = self.http.request(ENDPOINT, hosts=OFFICIAL_HOSTS,
            method="POST", json_body={"projectId": str(project_id)}, allow_404=True)
        if not raw:
            return None, "missing"
        if "json" not in content_type.casefold() or final_url != ENDPOINT:
            raise IngestionError("Public detail endpoint did not return direct JSON; collection stopped")
        try:
            payload = json.loads(raw)
        except (ValueError, UnicodeError):
            raise IngestionError("Public detail endpoint returned invalid JSON") from None
        return parse_detail(payload, project_id, raw)
