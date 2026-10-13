import sys
from datetime import date, timedelta
import tempfile
import unittest
from pathlib import Path

services = Path(__file__).resolve().parents[1] / "src/app/real-estate/services"
sys.path.insert(0, str(services))

import rera_csv_import
import rera_import
import rera_table


class CsvImportTests(unittest.TestCase):
    def test_official_export_headers_map(self):
        result = rera_table.parse_table(
            ["Project_Name", "Promoter", "RERA_Number", "Location", "District", "State"],
            [["Actual Project", "Actual Promoter", "P51800000004", "Mumbai", "Mumbai Suburban", "Maharashtra"]],
        )
        self.assertEqual(result[0]["developer"], "Actual Promoter")
        self.assertEqual(result[0]["district"], "Mumbai Suburban")

    def test_navigation_row_is_rejected(self):
        with self.assertRaises(ValueError):
            rera_table.parse_table(
                ["Project_Name", "Promoter", "RERA_Number"],
                [["Sitemap FAQs Feedback", "Skip to Main Content", "P51800002451"]],
            )

    def test_sensitive_extras_never_enter_payload(self):
        payload = rera_import.registry_payload(
            {
                "title": "Actual Project",
                "rera_id": "P51800000004",
                "city": "Mumbai",
                "pan": "ABCDE1234F",
                "email": "private@example.com",
                "bank_account": "1234",
            }
        )
        self.assertNotIn("pan", payload)
        self.assertNotIn("email", payload)
        self.assertNotIn("bank_account", payload)
        self.assertEqual(payload["official_source_reference"], "P51800000004")
        self.assertFalse(payload["verified"])

    def test_untrusted_source_url_is_rejected(self):
        with self.assertRaises(ValueError):
            rera_import.registry_payload(
                {
                    "title": "Actual Project",
                    "rera_id": "P51800000004",
                    "official_source_url": "https://example.com/fake",
                }
            )

    def test_csv_rejects_navigation_and_discards_sensitive_headers(self):
        content = (
            "Project_Name,Promoter,RERA_Number,Location,District,State,PAN,Email\n"
            '"Sitemap FAQs Feedback","Skip to Main Content","P51800002451","Mumbai","Mumbai Suburban","Maharashtra","x","x@y"\n'
            '"MEDHA CHSL","MEDHA CHSL","P51800006437","Mumbai","Mumbai Suburban","Maharashtra","secret","private@y"\n'
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "export.csv"
            path.write_text(content, encoding="utf-8")
            records, rejected, sensitive = rera_csv_import.load_registry_csv(path, "Mumbai")

        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["rera_id"], "P51800006437")
        self.assertEqual(len(rejected), 1)
        self.assertEqual(set(sensitive), {"PAN", "Email"})


    def test_daily_batch_bounded_and_rotates_without_portal_network(self):
        with tempfile.TemporaryDirectory() as tmp:
            export = Path(tmp) / "thane.csv"
            header = "Project_Name,Promoter,RERA_Number,District,State\\n"
            rows = "".join(
                f"Registered Project {i},Builder {i},P518{i:08d},Thane,Maharashtra\\n"
                for i in range(1, 5)
            )
            export.write_text(header + rows, encoding="utf-8")
            day = date(2026, 10, 13)
            district, first, _, _ = rera_csv_import.select_daily_records(
                tmp, "Thane", limit=2, run_date=day
            )
            _, second, _, _ = rera_csv_import.select_daily_records(
                tmp, "Thane", limit=2, run_date=day + timedelta(days=4)
            )
            self.assertEqual(district, "Thane")
            self.assertEqual(len(first), 2)
            self.assertEqual(len(second), 2)
            self.assertTrue({r["rera_id"] for r in first}.isdisjoint(
                {r["rera_id"] for r in second}
            ))

    def test_daily_limit_rejects_unbounded_batch(self):
        with self.assertRaises(ValueError):
            rera_csv_import.select_daily_records("/nonexistent", "Thane", limit=101)

    def test_missing_authorized_source_fails_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                rera_csv_import.select_daily_records(tmp, "Thane", run_date=date(2026, 10, 13))


if __name__ == "__main__":
    unittest.main()
