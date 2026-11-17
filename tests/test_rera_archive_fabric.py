"""Historical compact archive stays source-dated and publication-disabled."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from registry_fabric.archive import convert_historical_compact
from registry_fabric.cli import execute
from registry_fabric.core import normalize, RegistryValidationError


class HistoricalArchiveTests(unittest.TestCase):
    def test_compact_historical_facts_no_sensitive_extras_or_current_status(self):
        row = {"r": "P51800002451", "n": "Viki Heights",
               "b": "Example Developer", "d": "Mumbai Suburban",
               "a": "2021-07-21", "st": "On-Going Project",
               "lat": 19.08, "lon": 72.9, "pin": "400077",
               "m": {"unverified_bookings": "99"}, "bank": "do-not-use"}
        item = normalize("maharera", convert_historical_compact(row)).public_dict()
        self.assertEqual(item["source_last_modified"], "2021-07-21")
        self.assertIsNone(item["source_status"])
        for key in ("lat", "lon", "pin", "m", "bank"):
            self.assertNotIn(key, item)
        self.assertFalse(item["verified"])

    def test_importer_can_stage_existing_public_archive_without_database(self):
        row = {"r": "P51900008175", "n": "Historic Daffodil",
               "b": "Example Builder", "d": "Mumbai City",
               "a": "2024-02-27", "st": "On-Going Project"}
        with tempfile.TemporaryDirectory() as td:
            source = Path(td) / "compact.jsonl"
            output = Path(td) / "normalized.jsonl"
            source.write_text(json.dumps(row) + "\n", encoding="utf-8")
            with contextlib.redirect_stdout(io.StringIO()) as console:
                outcome = execute(["--provider", "maharera",
                                   "--maharera-compact-archive",
                                   "--input", str(source), "--output", str(output)])
            self.assertEqual(outcome, 0)
            report = json.loads(console.getvalue())
            self.assertEqual(report["accepted"], 1)
            self.assertEqual(report["publication_status"], "not_published")
            self.assertEqual(report["freshness"]["latest"], "2024-02-27")
            self.assertEqual(json.loads(output.read_text())["registration"], "P51900008175")

    def test_stale_archive_never_directly_writes_production(self):
        with tempfile.TemporaryDirectory() as td:
            source = Path(td) / "compact.jsonl"
            source.write_text("{}\n")
            with self.assertRaises(SystemExit):
                execute(["--provider", "maharera",
                         "--maharera-compact-archive",
                         "--input", str(source), "--commit",
                         "--source-authorized",
                         "--expected-project-ref", "dqprqjmhxjnrllczqyhz"])

    def test_invalid_identity_or_revocation_fails_closed(self):
        base = {"r": "P51700000644", "n": "Example",
                "d": "Thane", "a": "2022-07-01"}
        with self.assertRaises(RegistryValidationError):
            convert_historical_compact({**base, "d": "Kolkata"})
        with self.assertRaises(RegistryValidationError):
            convert_historical_compact({**base, "st": "Registration Revoked"})
        with self.assertRaises(RegistryValidationError):
            normalize("maharera", convert_historical_compact({**base, "a": "not-a-date"}))


if __name__ == "__main__":
    unittest.main()
