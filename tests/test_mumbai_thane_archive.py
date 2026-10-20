"""Synthetic, credential-free contract tests for historic CSV ZIP ingestion."""
import csv
import io
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from rera_ingestion.archive import read_archive
from rera_ingestion.models import IngestionError, public_payload

COLUMNS = [
    "district", "rera_id", "project_name", "promoter_name", "location_pin_code",
    "location_lat_long", "project_status", "proposed_date_of_completion",
    "revised_proposed_date_of_completion", "extended_date_of_completion",
    "project_type", "project_area_(sqmts)", "date_last_modified",
    "number_of_appartments", "cases_count", "phone_number",
]


def row(district, rid, name="Synthetic Example"):
    return {"district": district, "rera_id": rid, "project_name": name,
            "promoter_name": "Synthetic Builder Ltd", "location_pin_code": "400001",
            "location_lat_long": "('19.078961','72.906927')",
            "project_status": "On-Going Project", "proposed_date_of_completion": "12/31/2027",
            "revised_proposed_date_of_completion": "", "extended_date_of_completion": "",
            "project_type": "Residential", "project_area_(sqmts)": "1234.5",
            "date_last_modified": "03/23/2024", "number_of_appartments": "24.0",
            "cases_count": "1", "phone_number": "+91-0000000000"}


def make_zip(path, city=None, suburban=None, thane=None, revoked=None):
    names = {
        "mumbai-city-rera-dataset.csv": city or [],
        "mumbai-suburban-rera-dataset.csv": suburban or [],
        "thane-rera-dataset.csv": thane or [],
        "revoked-projects-rera-dataset.csv": revoked or [],
    }
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, rows in names.items():
            sink = io.StringIO(newline="")
            writer = csv.DictWriter(sink, fieldnames=COLUMNS)
            writer.writeheader()
            writer.writerows(rows)
            zf.writestr(name, sink.getvalue())


class TestArchive(unittest.TestCase):
    def test_snapshot_dates_sanitized_provenance_and_no_live_claims(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "snapshot.zip"
            make_zip(path,
                city=[row("Mumbai City", "P51900000001")],
                suburban=[row("Mumbai Suburban", "P51800000001")],
                thane=[row("Thane", "P51700000001")])
            projects, audit = read_archive(path, limit=1000)
            self.assertEqual(len(projects), 3)
            self.assertEqual([p.district for p in projects], ["Mumbai Suburban", "Thane", "Mumbai City"])
            project = projects[0]
            self.assertEqual(project.possession_date.isoformat(), "2027-12-31")
            self.assertEqual(project.registry_evidence["source_last_modified"], "2024-03-23")
            self.assertEqual(project.registry_evidence["snapshot_metrics"]["reported_apartments"], "24")
            self.assertFalse(project.registry_evidence["exact_detail_match"])
            self.assertFalse(project.verified_status)
            payload = public_payload(project)
            self.assertFalse(payload["verified"])
            self.assertNotIn("price", payload)
            self.assertNotIn("phone_number", str(payload))
            self.assertEqual(audit["counts"]["selected_for_this_batch"], 3)

    def test_revoked_prefix_conflicts_and_duplicate_registrations_excluded(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "source.zip"
            make_zip(path,
                city=[row("Mumbai City", "P51900000001"),
                      row("Mumbai City", "P51800000099")],
                suburban=[row("Mumbai Suburban", "P51800000001"),
                          row("Mumbai Suburban", "P51800000002"),
                          row("Mumbai Suburban", "P51800000002", "Different project name")],
                revoked=[row("Mumbai Suburban", "P51800000001")])
            projects, audit = read_archive(path)
            self.assertEqual([p.rera_id for p in projects], ["P51900000001"])
            self.assertEqual(audit["counts"]["revoked_rows_excluded"], 1)
            self.assertEqual(audit["counts"]["district_prefix_conflict"], 1)
            self.assertEqual(audit["counts"]["conflicting_registrations_quarantined"], 1)

    def test_bounded_window_reproducible_selection(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "source.zip"
            make_zip(path,
                city=[row("Mumbai City", "P51900000001")],
                suburban=[row("Mumbai Suburban", "P51800000001"),
                          row("Mumbai Suburban", "P51800000002")],
                thane=[row("Thane", "P51700000001")])
            first, audit = read_archive(path, limit=2)
            second, _ = read_archive(path, offset=2, limit=2)
            self.assertEqual({p.rera_id for p in first} & {p.rera_id for p in second}, set())
            self.assertEqual(len(first) + len(second), 4)
            self.assertEqual(audit["counts"]["selected_for_this_batch"], 2)

    def test_missing_revocation_file_and_zip_traversal_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "unsafe.zip"
            with zipfile.ZipFile(path, "w") as zf:
                zf.writestr("../escape.txt", "unsafe")
            with self.assertRaises(IngestionError):
                read_archive(path)
            make_zip(path, city=[row("Mumbai City", "P51900000001")])
            with zipfile.ZipFile(path, "a") as zf:
                zf.writestr("extra/unsafe.csv", "hidden")
            with self.assertRaises(IngestionError):
                read_archive(path)


if __name__ == "__main__":
    unittest.main()
