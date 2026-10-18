"""One credential-free public project probe; never logs raw provider responses."""
import json
import os
import sys
import time
import socket
from urllib.robotparser import RobotFileParser

import requests

ORIGIN = "https://maharerait.maharashtra.gov.in"
PATH = "/api/maha-rera-public-view-project-registration-service/public/projectregistartion/getProjectGeneralDetailsByProjectId"
UA = "GTH-PRO-Registry-Ingest/1.0 (+https://gthproglobal.com)"


def main():
    report = {"supabase_url_configured": bool(os.getenv("SUPABASE_URL")),
              "supabase_writer_configured": bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
              "project_id": 4, "database_writes": 0}
    with requests.Session() as session:
        session.headers.update({"User-Agent": UA, "Accept": "application/json,text/plain;q=0.9"})
        try:
            report["phase"] = "dns"
            socket.getaddrinfo("maharerait.maharashtra.gov.in", 443, type=socket.SOCK_STREAM)
            report["phase"] = "robots"
            robots = session.get(ORIGIN + "/robots.txt", timeout=25, allow_redirects=False)
            report["robots_status"] = robots.status_code
            if robots.status_code not in (200, 404) or (robots.status_code == 200 and "html" in robots.headers.get("Content-Type", "").lower()):
                report["outcome"] = "robots_policy_unavailable"
                return report
            policy = RobotFileParser()
            policy.parse(robots.text.splitlines() if robots.status_code == 200 else [])
            if not policy.can_fetch(UA, ORIGIN + PATH):
                report["outcome"] = "robots_disallowed"
                return report
            time.sleep(max(5, policy.crawl_delay(UA) or policy.crawl_delay("*") or 0))
            report["phase"] = "detail"
            response = session.post(ORIGIN + PATH, json={"projectId": "4"}, timeout=35, allow_redirects=False)
            report.update(detail_status=response.status_code, content_type=response.headers.get("Content-Type", ""))
            if response.status_code != 200:
                report["outcome"] = "public_endpoint_unavailable"
                return report
            if len(response.content) > 4_000_000:
                report["outcome"] = "response_too_large"
                return report
            payload = response.json()
            report["top_level_keys"] = sorted(payload)[:40] if isinstance(payload, dict) else []
            # Structure only: never expose names, contacts, addresses, tokens or raw bodies.
            def shape(value, depth=0):
                if depth > 3:
                    return type(value).__name__
                if isinstance(value, dict):
                    return {k: shape(v, depth + 1) for k, v in value.items()
                            if not any(s in k.lower() for s in ("token", "password", "bank", "phone", "mobile", "email", "account", "pan", "aadhaar"))}
                if isinstance(value, list):
                    return [shape(value[0], depth + 1)] if value else []
                return type(value).__name__
            report["response_shape"] = shape(payload)
            report["outcome"] = "public_json_received"
        except (requests.RequestException, ValueError, OSError) as exc:
            report["outcome"] = "source_connection_or_json_failure"
            report["error_type"] = type(exc).__name__
    return report


if __name__ == "__main__":
    result = main()
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["outcome"] == "public_json_received" else 2)
