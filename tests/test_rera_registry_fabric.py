"""Offline registry fabric regressions: no provider HTTP, secrets or DB access."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from registry_fabric.cli import execute
from registry_fabric.core import (
    RegistryValidationError, normalize, official_url, validate_rows, iter_source,
)
from registry_fabric.maharera import load_known_ids, parse_public_detail, read_public_ids

MAHA = {"rera_id": "P51800012345", "project_name": "Example Maharashtra Project",
        "developer_name": "Example Builder", "district": "Mumbai Suburban"}
WB = {"registration_no": "WBRERA/P/KOL/2026/004535", "project_name": "Example Kolkata Project",
      "district": "Kolkata"}
HIRA = {"registration_no": "HIRA/P/KOL/2019/000383", "project_name": "Historical Kolkata",
        "district": "Kolkata"}


class RegistryFabricTests(unittest.TestCase):
    def test_authorities_are_isolated(self):
        self.assertEqual(normalize("maharera", MAHA).identity, "maharera:P51800012345")
        self.assertEqual(normalize("wbrera", WB).state, "West Bengal")
        self.assertEqual(normalize("wbhira", HIRA).registration, "HIRA/P/KOL/2019/000383")
        with self.assertRaises(RegistryValidationError):
            normalize("maharera", WB)
        with self.assertRaises(RegistryValidationError):
            normalize("wbrera", HIRA)
        with self.assertRaises(RegistryValidationError):
            normalize("wbhira", WB)

    def test_authority_truth_and_no_private_fields(self):
        row = {**MAHA, "pan": "ABCDE1234F", "bank_account": "1234",
               "email": "do-not-import@example.com", "verified": True, "price": 100}
        public = normalize("maharera", row).public_dict()
        for key in ("pan", "bank_account", "email", "price"):
            self.assertNotIn(key, public)
        self.assertFalse(public["verified"])
        self.assertTrue(public["registry_only"])
        self.assertEqual(public["state"], "Maharashtra")

    def test_rejected_and_duplicate_identity(self):
        projects, report = validate_rows("maharera", [
            MAHA, MAHA, {**MAHA, "project_name": "Different Project"},
            {**MAHA, "rera_id": "P51800012346", "project_status": "Registration Revoked"},
        ])
        self.assertEqual(report["accepted"], 1)
        self.assertEqual(report["duplicates"], 1)
        self.assertEqual(report["rejected"], 2)
        self.assertEqual(len(projects), 1)

    def test_mismatch_and_source_urls_fail_closed(self):
        with self.assertRaises(RegistryValidationError):
            normalize("wbrera", {**WB, "registration_no": "WBRERA/P/HOW/2026/004535"})
        with self.assertRaises(RegistryValidationError):
            normalize("maharera", {**MAHA, "district": "Thane"})
        with self.assertRaises(RegistryValidationError):
            normalize("maharera", {**MAHA, "state": "West Bengal"})
        with self.assertRaises(RegistryValidationError):
            official_url("maharera", "https://evil.example/steal")
        with self.assertRaises(RegistryValidationError):
            official_url("wbrera", "https://rera.wb.gov.in/project_details.php?token=private")

    def test_source_csv_and_jsonl(self):
        with tempfile.TemporaryDirectory() as td:
            folder = Path(td)
            csv_path = folder / "approved.csv"
            csv_path.write_text("rera_id,project_name,district,email\n"
                                "P51800012345,Example Maharashtra Project,Mumbai Suburban,private@example.com\n",
                                encoding="utf-8")
            self.assertEqual(len(list(iter_source(csv_path))), 1)
            output = folder / "output.jsonl"
            with contextlib.redirect_stdout(io.StringIO()) as stdout:
                result = execute(["--provider", "maharera", "--input", str(csv_path),
                                  "--output", str(output)])
            self.assertEqual(result, 0)
            stage = json.loads(output.read_text().strip())
            self.assertNotIn("email", stage)
            self.assertEqual(stage["source_identity"], "maharera:P51800012345")
            self.assertEqual(json.loads(stdout.getvalue())["publication_status"], "not_published")
            self.assertEqual(len(list(iter_source(output))), 1)

    def test_west_bengal_cannot_commit_to_maharashtra_table(self):
        with tempfile.TemporaryDirectory() as td:
            data = Path(td) / "west-bengal.csv"
            data.write_text("registration_no,project_name,district\n"
                            "WBRERA/P/KOL/2026/004535,Example Kolkata Project,Kolkata\n")
            with self.assertRaises(SystemExit):
                execute(["--provider", "wbrera", "--input", str(data),
                         "--commit", "--source-authorized",
                         "--expected-project-ref", "dqprqjmhxjnrllczqyhz"])

    def test_direct_endpoint_requires_known_ids_and_never_auto_commits(self):
        with tempfile.TemporaryDirectory() as td:
            f = Path(td) / "ids.txt"
            f.write_text("4\n7\n")
            self.assertEqual(load_known_ids(f, offset=0, limit=2), [4, 7])
            with self.assertRaises(SystemExit):
                execute(["--provider", "maharera", "--ids-file", str(f)])
            with self.assertRaises(SystemExit):
                execute(["--provider", "maharera", "--ids-file", str(f),
                         "--enable-network", "--source-authorized", "--commit"])
            with self.assertRaises(RegistryValidationError):
                list(read_public_ids([4, 4], delay=5))

    def test_endpoint_response_contract_no_private_fields(self):
        payload = {"data": {
            "projectDetails": {"projectId": 4, "projectRegistartionNo": "P51800012345",
                               "projectName": "Example Maharashtra Project",
                               "districtName": "Mumbai Suburban",
                               "bankAccount": "PRIVATE"},
            "promoterDetails": {"promoterName": "Example Builder",
                                "phone": "PRIVATE"}}}
        row = parse_public_detail(payload, 4)
        self.assertEqual(row["district"], "Mumbai Suburban")
        self.assertNotIn("bankAccount", row)
        self.assertNotIn("phone", row)
        with self.assertRaises(RegistryValidationError):
            parse_public_detail(payload, 5)

    def test_commit_uses_maharera_only(self):
        with self.assertRaises(RegistryValidationError):
            normalize("wbrera", {**WB, "project_status": "Rejected"})
        with self.assertRaises(RegistryValidationError):
            normalize("maharera", {**MAHA, "registration_no": "P51800012346"})
        self.assertEqual(normalize("maharera", MAHA).maharera_insert()["state"], "Maharashtra")


if __name__ == "__main__":
    unittest.main()
