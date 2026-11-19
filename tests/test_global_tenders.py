"""Offline fixtures for additional official GTH PRO tender connectors. No network, no DB."""
import os
import sys
import unittest
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts" / "tenders"))
import global_ingestion as g

def future(days=35):
    return (date.today() + timedelta(days=days)).isoformat()

class GlobalTenderTests(unittest.TestCase):
    def test_uk_open_notice(self):
        item = {
            "id": "000123-2026", "date": "2026-10-15T09:10:00Z",
            "buyer": {"id": "g", "name": "North City Council"},
            "tender": {
                "title": "Procurement of public school technology",
                "status": "active",
                "mainProcurementCategory": "goods",
                "tenderPeriod": {"endDate": future() + "T12:00:00+00:00"},
                "value": {"amount": 2500, "currency": "GBP"},
            },
        }
        row = g.normalize_uk(item)
        self.assertEqual(row["country_code"], "GB")
        self.assertEqual(row["source_reference"], "000123-2026")
        self.assertEqual(row["source_name"], "UK Find a Tender")
        self.assertIn("find-tender.service.gov.uk/Notice/", row["source_url"])
        self.assertEqual(row["status"], "review")
        self.assertFalse(row["source_verified"])

    def test_brazil_official_record(self):
        row = g.normalize_brazil({
            "numeroControlePNCP": "12345678901234-1-000011/2026",
            "orgaoEntidade": {"cnpj": "12345678901234", "razaoSocial": "Prefeitura Municipal"},
            "anoCompra": 2026, "sequencialCompra": 11,
            "objetoCompra": "Aquisição de materiais médicos para hospitais",
            "dataPublicacaoPncp": "2026-10-14",
            "dataEncerramentoProposta": future() + "T15:00:00",
            "valorTotalEstimado": 125000.5, "modalidadeNome": "Pregão",
        })
        self.assertEqual(row["country_code"], "BR")
        self.assertEqual(row["currency"], "BRL")
        self.assertEqual(row["estimated_value"], "125000.50")
        self.assertEqual(row["source_url"], "https://pncp.gov.br/app/editais/12345678901234/2026/11")

    def test_india_worldbank_country_first_provenance(self):
        from datetime import datetime,timezone,timedelta
        deadline=(datetime.now(timezone.utc)+timedelta(days=45)).isoformat()
        data={
            "procnotices":{
                "a":{
                    "id":"OP00991234",
                    "bid_description":"Procurement of clean energy equipment for India",
                    "contact_organization":"Government Energy Procurement Agency",
                    "project_ctry_name":"India",
                    "submission_deadline_date":deadline,
                    "publication_date":"2026-10-14T00:00:00Z",
                },
                "b":{
                    "id":"OP00991235",
                    "bid_description":"Non-Indian procurement notice",
                    "contact_organization":"Foreign Buyer",
                    "project_ctry_name":"Nepal",
                    "submission_deadline_date":deadline,
                },
            }
        }
        with patch.object(g.core,"_http_json",return_value=data) as fetch, \
             patch.object(g.core,"_worldbank_countries",return_value={"india":"IN","nepal":"NP"}):
            records,rejected=g.collect("worldbank_india",100)
        self.assertEqual(len(records),1)
        self.assertEqual(records[0]["country_code"],"IN")
        self.assertEqual(records[0]["source_name"],"World Bank")
        self.assertTrue(records[0]["source_url"].endswith("/OP00991234"))
        self.assertEqual(fetch.call_count,1)

    def test_sam_optional_key(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(g.fetch_sam(5))
        item = {
            "noticeId": "fedcba9876543210fedcba9876543210",
            "title": "National infrastructure procurement notice",
            "fullParentPathName": "Department of Energy",
            "postedDate": "2026-10-15", "responseDeadLine": future(),
            "active": "Yes", "type": "Solicitation"
        }
        row = g.normalize_sam(item)
        self.assertEqual(row["country_code"], "US")
        self.assertTrue(row["source_url"].startswith("https://sam.gov/opp/"))
        with self.assertRaises(ValueError):
            g.normalize_sam({**item, "active": "No"})

    def test_schema_change_is_not_replaced_with_fake_data(self):
        with patch.object(g.core, "_http_json", return_value={"unexpected": []}):
            with self.assertRaisesRegex(ValueError, "schema changed"):
                g.fetch_uk(20)
            with self.assertRaisesRegex(ValueError, "schema changed"):
                g.fetch_brazil(20)

    def test_dry_run_no_database_writes(self):
        with patch.object(g, "collect", return_value=([], [])), \
             patch.object(g, "submit") as upload, \
             patch.object(g, "submit_official") as publish, \
             patch("sys.stdout"):
            self.assertEqual(g.main(["--source", "uk", "--limit", "10"]), 0)
        upload.assert_not_called()
        publish.assert_not_called()

    def test_publication_requires_explicit_approval(self):
        with patch.dict(os.environ, {"GTH_TENDER_OFFICIAL_PUBLICATION_ENABLED": "false"}):
            with self.assertRaises(ValueError):
                g.publish_official([{"source_name": "UK Find a Tender"}], "abcdefghijklmnop")

if __name__ == "__main__":
    unittest.main()
