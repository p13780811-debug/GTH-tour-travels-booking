"""Offline checks for exact official West Bengal Kolkata list adapters."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from registry_fabric.core import RegistryValidationError
from registry_fabric.cli import execute
from registry_fabric.west_bengal import (
    LISTINGS, parse_listing, fetch_kolkata_listing,
)

HEADER = (
    "<thead><tr><th>Sl No.</th><th>Project ID</th>"
    "<th>Project Name</th><th>Completion Date</th><th>Registration No</th>"
    "<th>Registration Date</th></tr></thead>"
)
WBROW = (
    "<tr><td>1</td><td>WBRERA/NPR-002865</td>"
    '<td><a href="project_details.php?procode=12595000000058">THE BURJ</a></td>'
    "<td>31-03-2029</td><td>WBRERA/P/KOL/2024/002172</td>"
    "<td>18-11-2024</td></tr>"
)
HIRAROW = (
    "<tr><td>1</td><td>NPR-00634</td>"
    '<td><a href="project_details_hira.php?procode=14830000000001">88 East</a></td>'
    "<td>30-03-2027</td><td>HIRA/P/KOL/2019/000383</td>"
    "<td>31-03-2019</td></tr>"
)

def document(row):
    return "<html><body><table>" + HEADER + "<tbody>" + row + "</tbody></table></body></html>"


class Response:
    def __init__(self, url, body, content_type="text/html"):
        self.status = 200
        self._url = url
        self._body = body.encode()
        self.headers = {"Content-Type": content_type}
    def geturl(self):
        return self._url
    def read(self, limit):
        return self._body[:limit]
    def __enter__(self):
        return self
    def __exit__(self, *_):
        return False


class WestBengalTests(unittest.TestCase):
    def test_wbrera_kolkata_official_source(self):
        projects = parse_listing(document(WBROW), "wbrera")
        self.assertEqual(len(projects), 1)
        self.assertEqual(projects[0]["registration_no"], "WBRERA/P/KOL/2024/002172")
        self.assertEqual(
            projects[0]["official_source_url"],
            "https://rera.wb.gov.in/project_details.php?procode=12595000000058",
        )

    def test_hira_historical_source(self):
        projects = parse_listing(document(HIRAROW), "wbhira")
        self.assertEqual(len(projects), 1)
        self.assertEqual(projects[0]["registration_no"], "HIRA/P/KOL/2019/000383")
        self.assertTrue(projects[0]["official_source_url"].endswith(
            "project_details_hira.php?procode=14830000000001"
        ))

    def test_fail_closed_on_fake_links_or_conflicting_project(self):
        for bad in (
            WBROW.replace("project_details.php", "project_details_hira.php"),
            WBROW.replace("project_details.php?procode", "https://other.example/project_details.php?procode"),
            WBROW.replace("12595000000058", "notanid"),
            WBROW.replace("WBRERA/P/KOL/", "WBRERA/P/HOW/"),
        ):
            with self.subTest(bad=bad):
                with self.assertRaises(RegistryValidationError):
                    parse_listing(document(bad), "wbrera")
        with self.assertRaises(RegistryValidationError):
            parse_listing("<html>No registry table</html>", "wbrera")

    def test_official_robots_required(self):
        calls = []
        def opener(req, **_):
            url = req.full_url
            calls.append(url)
            if url.endswith("/robots.txt"):
                return Response(url, "User-agent: *\nDisallow: /")
            self.fail("No listing request should occur when forbidden")
        with self.assertRaises(RegistryValidationError):
            fetch_kolkata_listing("wbrera", opener=opener)
        self.assertEqual(len(calls), 1)

    def test_official_source_html_contract_with_mock_network(self):
        def opener(req, **_):
            url = req.full_url
            if url.endswith("/robots.txt"):
                return Response(url, "User-agent: *\nAllow: /", "text/plain")
            if url == LISTINGS["wbrera"]:
                return Response(url, document(WBROW))
            self.fail("Unexpected URL " + url)
        result = fetch_kolkata_listing("wbrera", opener=opener)
        self.assertEqual(result[0]["project_name"], "THE BURJ")

    def test_cli_requires_optin_and_stages_without_db(self):
        with self.assertRaises(SystemExit):
            execute(["--provider", "wbrera", "--west-bengal-list"])
        with tempfile.TemporaryDirectory() as temp:
            out = Path(temp) / "kolkata.jsonl"
            with patch("registry_fabric.west_bengal.fetch_kolkata_listing", return_value=parse_listing(document(WBROW), "wbrera")):
                with contextlib.redirect_stdout(io.StringIO()) as stream:
                    code = execute([
                        "--provider", "wbrera", "--west-bengal-list",
                        "--source-authorized", "--enable-network",
                        "--output", str(out)
                    ])
            self.assertEqual(code, 0)
            data = json.loads(out.read_text().strip())
            self.assertEqual(data["district"], "Kolkata")
            self.assertFalse(data["verified"])
            self.assertEqual(json.loads(stream.getvalue())["publication_status"], "not_published")
            with self.assertRaises(SystemExit):
                execute([
                    "--provider", "wbrera", "--west-bengal-list", "--commit",
                    "--source-authorized", "--enable-network",
                    "--expected-project-ref", "dqprqjmhxjnrllczqyhz",
                ])


if __name__ == "__main__":
    unittest.main()
