import importlib.util
from pathlib import Path
import unittest


path = Path(__file__).resolve().parents[1] / "src/app/real-estate/services/rera_collection.py"
spec = importlib.util.spec_from_file_location("rera_collection", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CollectionTests(unittest.TestCase):
    def collect(self, pages, limit=300):
        index = [0]

        def advance(_):
            index[0] += 1
            return index[0] < len(pages)

        return module.collect_pages(lambda: pages[index[0]], advance, limit)

    def test_collects_pages_and_deduplicates_registry_ids(self):
        result = self.collect([[{"rera_id": "A"}], [{"rera_id": "A"}, {"rera_id": "B"}]])
        self.assertEqual([row["rera_id"] for row in result], ["A", "B"])

    def test_repeated_page_fails_instead_of_reporting_success(self):
        with self.assertRaises(RuntimeError):
            self.collect([[{"rera_id": "A"}], [{"rera_id": "A"}]])

    def test_empty_page_fails(self):
        with self.assertRaises(RuntimeError):
            self.collect([[]])

    def test_limit_bounds_collection(self):
        result = self.collect([[{"rera_id": "A"}], [{"rera_id": "B"}]], 1)
        self.assertEqual(result, [{"rera_id": "A"}])


if __name__ == "__main__":
    unittest.main()
