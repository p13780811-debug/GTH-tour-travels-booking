"""West Bengal district registry collector: public listing, no undocumented API.

Uses only the two exact official Kolkata district URLs confirmed on the
authority's portal. Offline HTML parsing is the separately testable core.
This module never opens project photos or private promoter/contact sections.
"""
from __future__ import annotations

import re
import ssl
from html.parser import HTMLParser
from urllib import error, request, robotparser
from urllib.parse import parse_qs, urljoin, urlsplit

from .core import RegistryValidationError, normalize

ORIGIN = "https://rera.wb.gov.in"
USER_AGENT = "GTH-PRO-Registry-Research/1.0 (+https://gthproglobal.com)"
DISTRICT_CODE_KOLKATA = "10001000000032"
LISTINGS = {
    "wbrera": ORIGIN + "/district_project.php?dcode=" + DISTRICT_CODE_KOLKATA,
    "wbhira": ORIGIN + "/district_project_HIRA.php?dcode=" + DISTRICT_CODE_KOLKATA,
}
DETAIL_PATHS = {
    "wbrera": "/project_details.php",
    "wbhira": "/project_details_hira.php",
}
MAX_BYTES = 8_000_000
MAX_TABLE_ROWS = 50_000


class _TableReader(HTMLParser):
    """Extract table cells and exact link hrefs; ignore all non-table content."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = []
        self.depth = 0
        self.rows = []
        self.row = None
        self.cell = None

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "table":
            if self.depth == 0:
                self.rows = []
            self.depth += 1
        elif self.depth == 1:
            if tag == "tr":
                self.row = []
            elif tag in ("th", "td") and self.row is not None:
                self.cell = {"text": [], "hrefs": []}
            elif tag == "a" and self.cell is not None:
                href = attributes.get("href")
                if href is not None:
                    self.cell["hrefs"].append(href)

    def handle_data(self, data):
        if self.depth == 1 and self.cell is not None:
            self.cell["text"].append(data)

    def handle_endtag(self, tag):
        if tag in ("th", "td") and self.depth == 1 and self.cell is not None:
            self.row.append((" ".join(" ".join(self.cell["text"]).split()), self.cell["hrefs"]))
            self.cell = None
        elif tag == "tr" and self.depth == 1 and self.row is not None:
            if self.row:
                self.rows.append(self.row)
                if len(self.rows) > MAX_TABLE_ROWS:
                    raise RegistryValidationError("Registry HTML exceeds row cap")
            self.row = None
        elif tag == "table" and self.depth > 0:
            self.depth -= 1
            if self.depth == 0:
                self.tables.append(self.rows)
                self.rows = []
                self.row = None
                self.cell = None


def _headings(row):
    return tuple(re.sub(r"[^a-z0-9]+", "", cell[0].casefold()) for cell in row)


def _detail_link(provider, href):
    if not isinstance(href, str) or len(href) > 500:
        raise RegistryValidationError("Invalid official project link")
    url = urljoin(ORIGIN + "/", href)
    p = urlsplit(url)
    params = parse_qs(p.query, keep_blank_values=True)
    if (p.scheme != "https" or p.hostname != "rera.wb.gov.in"
            or p.path.casefold() != DETAIL_PATHS[provider].casefold()
            or p.username or p.password or p.fragment or p.port not in (None, 443)
            or set(params) != {"procode"} or len(params["procode"]) != 1
            or not re.fullmatch(r"[1-9][0-9]{4,19}", params["procode"][0])):
        raise RegistryValidationError("Unexpected project detail URL; stop")
    return url


def parse_listing(html: str, provider: str, *, district="Kolkata") -> list[dict]:
    if provider not in LISTINGS or district != "Kolkata":
        raise RegistryValidationError("Only verified Kolkata district routes supported")
    if not isinstance(html, str) or len(html) > MAX_BYTES:
        raise RegistryValidationError("Invalid or oversized registry HTML")
    parser = _TableReader()
    parser.feed(html)
    candidates = []
    # Source header is: Sl No., Project ID, Project Name, Completion Date,
    # Registration No., Registration Date. Require an exact six-column contract.
    expected = ("slno", "projectid", "projectname", "completiondate",
                "registrationno", "registrationdate")
    for table in parser.tables:
        for idx, row in enumerate(table[:5]):
            if _headings(row) == expected:
                candidates.append(table[idx + 1:])
                break
    if len(candidates) != 1:
        raise RegistryValidationError("Expected exactly one official project table")
    rows = candidates[0]
    if not rows:
        raise RegistryValidationError("Official project table returned no rows")
    collected = []
    for row in rows:
        if len(row) != len(expected):
            raise RegistryValidationError("Project table column count changed")
        ordinal, project_id, name, completion, registration, registered_at = (cell[0] for cell in row)
        if not ordinal.isdigit() or not name or not project_id:
            raise RegistryValidationError("Project list row identity missing")
        hrefs = row[2][1]
        if len(hrefs) != 1:
            raise RegistryValidationError("Project name must have one official details link")
        official = _detail_link(provider, hrefs[0])
        item = {
            "project_name": name,
            "registration_no": registration,
            "district": district,
            "official_source_url": official,
        }
        # Cross-check authority and district before allowing an output.
        normalized = normalize(provider, item)
        if normalized.official_source_url != official:
            raise RegistryValidationError("Official project identity link changed")
        collected.append(item)
    return collected


def _get_url(url: str, *, opener=request.urlopen, max_bytes=MAX_BYTES):
    req = request.Request(url, headers={
        "User-Agent": USER_AGENT, "Accept": "text/html, text/plain;q=0.5",
    })
    try:
        with opener(req, timeout=25, context=ssl.create_default_context()) as response:
            if response.status != 200 or response.geturl() != url:
                raise RegistryValidationError("Official response status or URL changed")
            if "html" not in response.headers.get("Content-Type", "").lower():
                if not url.endswith("/robots.txt"):
                    raise RegistryValidationError("Official source did not return HTML")
            raw = response.read(max_bytes + 1)
    except (OSError, error.URLError) as exc:
        raise RegistryValidationError("West Bengal source not accessible; no data collected") from exc
    if len(raw) > max_bytes:
        raise RegistryValidationError("Official source response exceeds size limit")
    return raw.decode("utf-8-sig", errors="replace")


def verify_robots(provider: str, *, opener=request.urlopen) -> None:
    if provider not in LISTINGS:
        raise RegistryValidationError("Unknown authority")
    robots = _get_url(ORIGIN + "/robots.txt", opener=opener, max_bytes=100_000)
    policy = robotparser.RobotFileParser()
    policy.parse(robots.splitlines())
    if not policy.can_fetch(USER_AGENT, LISTINGS[provider]):
        raise RegistryValidationError("Robots policy disallows official collection")


def fetch_kolkata_listing(provider: str, *, opener=request.urlopen) -> list[dict]:
    """One bounded GET for an official district list. No generic crawling."""
    verify_robots(provider, opener=opener)
    html = _get_url(LISTINGS[provider], opener=opener)
    return parse_listing(html, provider)
