import importlib.util
import tempfile
import unittest
from pathlib import Path
from datetime import datetime, timedelta, timezone

SCRIPT=Path(__file__).resolve().parents[1]/"scripts/import_tenders.py"
spec=importlib.util.spec_from_file_location("import_tenders",SCRIPT)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class TenderImportTests(unittest.TestCase):
    def record(self):
        return {
          "source_reference":"R2026/001", "title":"Maintenance of public infrastructure",
          "buyer":"Procurement Authority","country_code":"IN","sector":"works",
          "deadline_at":(datetime.now(timezone.utc)+timedelta(days=30)).isoformat(),
          "source_url":"https://eprocure.gov.in/eprocure/app",
          "status":"published","source_verified":"true","is_public":"true"
        }

    def test_untrusted_csv_cannot_publish(self):
        rec=module.convert(self.record(),"CPPP",{"eprocure.gov.in"})
        self.assertEqual(rec["status"],"review")
        self.assertFalse(rec["source_verified"])
        self.assertFalse(rec["is_public"])

    def test_source_host_and_scheme_enforced(self):
        for url in ["http://eprocure.gov.in/eprocure/app",
                    "https://evil.example/bid",
                    "https://eprocure.gov.in.evil.example/bid",
                    "https://user:pass@eprocure.gov.in/bid"]:
            with self.assertRaises(ValueError):
                module.convert({**self.record(),"source_url":url},"CPPP",{"eprocure.gov.in"})

    def test_valid_batch_and_duplicate_block(self):
        fields=list(self.record().keys())
        with tempfile.TemporaryDirectory() as folder:
            file=Path(folder)/"tenders.csv"
            import csv
            with file.open("w",newline="",encoding="utf-8") as stream:
                writer=csv.DictWriter(stream,fieldnames=fields)
                writer.writeheader()
                writer.writerow(self.record())
                writer.writerow(self.record())
            accepted,rejected=module.load_csv(file,"CPPP",{"eprocure.gov.in"})
        self.assertEqual(len(accepted),1)
        self.assertEqual(len(rejected),1)

    def test_no_commit_without_configuration(self):
        import unittest.mock
        with unittest.mock.patch.dict("os.environ",{},clear=True):
            with self.assertRaisesRegex(ValueError,"requires"):
                module.submit([module.convert(self.record(),"CPPP",{"eprocure.gov.in"})],"dqprqjmhxjnrllczqyhz")

if __name__=="__main__":
    unittest.main()
