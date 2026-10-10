import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest

path = Path(__file__).resolve().parents[1] / "src/app/real-estate/services/rera_import.py"
spec = importlib.util.spec_from_file_location("rera_import", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ImportTests(unittest.TestCase):
    def test_untrusted_extra_fields_are_not_imported(self):
        result = module.registry_payload(dict(title="Actual project", rera_id="P123", id=99,
                                              verified=True, image="stock", price="100", ai_score=100))
        self.assertFalse(result["verified"])
        for field in ["id", "image", "price", "ai_score"]:
            self.assertNotIn(field, result)

    def test_slug_is_stable(self):
        row = dict(title="Actual project", rera_id="P123")
        self.assertEqual(module.registry_payload(row)["slug"], module.registry_payload(row)["slug"])

    def test_missing_identity_is_rejected(self):
        with self.assertRaises(ValueError):
            module.registry_payload(dict(title="Actual project"))

    def test_existing_records_use_do_nothing_conflict(self):
        class Client:
            def table(self, table):
                self.table_name = table
                return self

            def upsert(self, payload, **options):
                self.options = options
                return self

            def execute(self):
                return SimpleNamespace(data=[])

        client = Client()
        count = module.insert_registry_batch(client, [dict(title="Actual project", rera_id="P123")])
        self.assertEqual(count, 0)
        self.assertEqual(client.options, dict(on_conflict="rera_id", ignore_duplicates=True))

    def test_invalid_batch_never_writes(self):
        class Client:
            def table(self, _):
                raise AssertionError("must validate before writing")
        with self.assertRaises(ValueError):
            module.insert_registry_batch(Client(), [dict(title="Actual project", rera_id="P123"), {}])


if __name__ == "__main__":
    unittest.main()
