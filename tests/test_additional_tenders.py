"""Offline tests for additional government tender APIs. Never touch live DB."""
import sys
import unittest
from datetime import datetime,timedelta,timezone
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"/"tenders"))
import additional_sources as src
import global_ingestion as global_feed

FUTURE=(datetime.now(timezone.utc)+timedelta(days=35)).isoformat()
NOW=datetime.now(timezone.utc).isoformat()

class AdditionalOfficialTests(unittest.TestCase):
    def test_contractsfinder_official_link_and_fields(self):
        item={
            "id":"d2c8df1a-3320-4a00-b934-33f70fe368ca-917954",
            "tender":{"title":"Provision of fleet maintenance services",
                "status":"active","mainProcurementCategory":"services",
                "tenderPeriod":{"endDate":FUTURE}},
            "buyer":{"name":"City Council Procurement Office"},"date":NOW,
        }
        tender=src.contracts_finder_notice(item)
        self.assertEqual(tender["country_code"],"GB")
        self.assertEqual(tender["source_name"],"UK Contracts Finder")
        self.assertTrue(tender["source_url"].startswith("https://www.contractsfinder.service.gov.uk/Published/Notice/releases/"))
        self.assertFalse(tender["is_public"])
        with self.assertRaises(ValueError):
            src.contracts_finder_notice({**item,"tender":{**item["tender"],"status":"cancelled"}})

    def test_prozorro_reject_closed_then_parse_official_open(self):
        obj={
            "tenderID":"UA-2026-10-15-000123-a",
            "title":"Purchase of emergency power equipment",
            "status":"active.tendering",
            "procuringEntity":{"name":"Municipal Procurement Authority"},
            "tenderPeriod":{"endDate":FUTURE},
            "dateCreated":NOW,
            "value":{"amount":85000,"currency":"UAH"}
        }
        notice=src.ukraine_notice(obj)
        self.assertEqual(notice["country_code"],"UA")
        self.assertEqual(notice["source_url"],"https://prozorro.gov.ua/tender/UA-2026-10-15-000123-a")
        with self.assertRaises(ValueError):
            src.ukraine_notice({**obj,"status":"complete"})

    def test_bounded_ukraine_detail_fetches(self):
        listed={"data":[{"id":"3d2fa044-a3cb-4ee3-ab89-a8b395c77e2e"}]}
        detail={"data":{"tenderID":"UA-2026-10-15-000123-a"}}
        with patch.object(src.core,"_http_json",side_effect=[listed,detail]) as fetch, patch.object(src.time,"sleep"):
            result=src.fetch_ukraine(80)
        self.assertEqual(result,[detail["data"]])
        self.assertEqual(fetch.call_count,2)

    def test_canada_official_csv_notice_and_timezone(self):
        sample={
            "referenceNumber-numeroReference":"AB-1234567",
            "title-titre-eng":"Public hospital procurement of diagnostic equipment",
            "contractingEntityName-nomEntitContractante-eng":"Provincial Health Authority",
            "tenderClosingDate-appelOffresDateCloture":(datetime.now(timezone.utc)+timedelta(days=50)).date().isoformat()+"T13:00:00",
            "publicationDate-datePublication":"2026-10-14",
            "tenderStatus-appelOffresStatut-eng":"Open",
            "noticeURL-URLavis-eng":"https://canadabuys.canada.ca/en/tender-opportunities/tender-notice/pw-2026-1234567",
            "procurementCategory-categorieApprovisionnement":"Goods",
            "tenderDescription-descriptionAppelOffres-eng":"Approved public notice"
        }
        record=src.canada_notice(sample)
        self.assertEqual(record["country_code"],"CA")
        self.assertEqual(record["source_name"],"CanadaBuys Open Data")
        self.assertEqual(record["deadline_at"][11:19],"00:00:00")
        merx=src.canada_notice({**sample,"noticeURL-URLavis-eng":"https://www.merx.com/public/solicitations/3776296409/abstract?language=EN"})
        self.assertEqual(merx["source_url"],"https://www.merx.com/public/solicitations/3776296409/abstract")
        with self.assertRaisesRegex(ValueError,"external or unknown"):
            src.canada_notice({**sample,"noticeURL-URLavis-eng":"https://evil.example/public/solicitations/3776296409/abstract"})
        with self.assertRaises(ValueError):
            src.canada_notice({**sample,"tenderStatus-appelOffresStatut-eng":"Cancelled"})

    def test_registry_wires_existing_and_new_sources(self):
        self.assertIn("uk_contractsfinder",global_feed.SOURCES)
        self.assertIn("ukraine",global_feed.SOURCES)
        self.assertIn("canada",global_feed.SOURCES)

if __name__=="__main__":
    unittest.main()
