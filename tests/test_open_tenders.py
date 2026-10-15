"""Offline tests for GTH PRO official tender feeds (no network/DB)."""
import importlib.util
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/tenders/open_ingestion.py"
SPEC = importlib.util.spec_from_file_location("open_ingestion", SCRIPT)
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)

def future(days=20):
    return (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%Y-%m-%d")

class OpenTenderTests(unittest.TestCase):
    def test_ted_normalization_private_review(self):
        row = {
            "publication-number": "123456-2026",
            "notice-title": {"eng": ["Procurement of solar energy equipment"]},
            "buyer-name": {"eng": ["European Energy Agency"]},
            "buyer-country": ["DEU"], "publication-date": "2026-10-14",
            "deadline": future(), "contract-nature": "supplies",
            "total-value": "12000", "total-value-cur": "EUR",
        }
        item = module._ted_notice(row)
        self.assertEqual(item["source_name"], "TED EU")
        self.assertEqual(item["country_code"], "DE")
        self.assertEqual(item["sector"], "goods")
        self.assertEqual(item["estimated_value"], "12000.00")
        self.assertEqual(item["status"], "review")
        self.assertFalse(item["source_verified"])
        self.assertFalse(item["is_public"])

    def test_worldbank_normalization_and_missing_budget(self):
        row = {"id": "OP00012345", "bid_description": "Renewable power equipment",
               "implementing_agency": "National Energy Agency",
               "country_code": "IN", "deadline_date": future(),
               "notice_type": "Invitation for Bids"}
        item = module._worldbank_notice(row)
        self.assertEqual(item["source_reference"], "OP00012345")
        self.assertEqual(item["country_code"], "IN")
        self.assertIsNone(item["estimated_value"])

    def test_missing_buyer_cannot_be_fabricated(self):
        with self.assertRaises(ValueError):
            module._ted_notice({"publication-number": "123456-2026",
              "notice-title": "Procurement of energy equipment", "deadline": future(),
              "buyer-country": "DEU"})
        with self.assertRaises(ValueError):
            module._worldbank_notice({"id": "OP00012345",
              "bid_description": "Renewable power equipment", "country_code": "IN",
              "deadline_date": future()})

    def test_unknown_country_and_timezone_fail_closed(self):
        with self.assertRaises(ValueError):
            module._country("Central Asia")
        with self.assertRaises(ValueError):
            module._time("2026-10-14T12:00:00")
        self.assertEqual(module._country("FRA"), "FR")

    def test_duplicates_expired_notices_rejected(self):
        row = {"publication-number": "123456-2026",
               "notice-title": "Public procurement of solar power equipment",
               "buyer-name": "Transport Department", "buyer-country": "FRA",
               "deadline": future()}
        with patch.object(module, "fetch_ted", return_value=[
          row, row, {**row, "publication-number":"654321-2026", "deadline":"2020-01-01"}]):
            accepted, rejected = module.collect("ted", 50)
        self.assertEqual(len(accepted), 1)
        self.assertEqual(len(rejected), 2)

    def test_unexpected_api_schema_rejected(self):
        with patch.object(module, "_http_json", return_value={"different": []}):
            with self.assertRaisesRegex(ValueError, "schema changed"):
                module.fetch_ted(5)
            with self.assertRaisesRegex(ValueError, "schema changed"):
                module.fetch_worldbank(5)

    def test_dry_run_never_writes(self):
        row = {"publication-number": "123456-2026",
               "notice-title": "Public procurement of solar power equipment",
               "buyer-name": "Transport Department", "buyer-country": "FRA",
               "deadline": future()}
        with patch.object(module, "fetch_ted", return_value=[row]), \
             patch.object(module, "submit") as submit, patch("sys.stdout"):
            result = module.main(["--source", "ted", "--limit", "1"])
        self.assertEqual(result, 0)
        submit.assert_not_called()

    def test_disallowed_external_host(self):
        with self.assertRaises(ValueError):
            module._http_json("https://example.com/notices",
                              allowed_host="api.ted.europa.eu")

    def test_live_worldbank_field_contract(self):
        row = {
            "id": "OP00887766", "bid_description": "Procurement of climate equipment",
            "contact_organization": "Ministry of Energy",
            "project_ctry_name": "Nigeria",
            "submission_deadline_date": future() + "T12:00:00Z",
            "submission_date": "2026-10-14T00:00:00Z",
        }
        with patch.object(module, "_worldbank_countries", return_value={"nigeria": "NG"}):
            record = module._worldbank_notice(row)
        self.assertEqual(record["country_code"], "NG")
        self.assertEqual(record["buyer"], "Ministry of Energy")

    def test_live_ted_lot_deadline_field_contract(self):
        row = {
            "publication-number": "456789-2026",
            "notice-title": {"eng": ["Construction of public facilities"]},
            "buyer-name": {"eng": ["Public Construction Agency"]},
            "buyer-country": ["DEU"],
            "publication-date": "2026-10-15+02:00",
            "deadline-receipt-tender-date-lot": [future() + "+02:00"],
            "contract-nature": "works",
        }
        result = module._ted_notice(row)
        self.assertEqual(result["country_code"], "DE")
        self.assertEqual(result["sector"], "works")
        self.assertIsNotNone(result["published_at"])
        self.assertTrue(result["deadline_at"].endswith("+00:00"))

if __name__ == "__main__":
    unittest.main()
