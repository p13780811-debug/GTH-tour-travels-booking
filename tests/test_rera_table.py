import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / "src/app/real-estate/services/rera_table.py"
spec = importlib.util.spec_from_file_location("rera_table", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class TableTests(unittest.TestCase):
    def test_reordered_columns_map_by_header(self):
        result = module.parse_table(["Registration No.", "Project Name", "Promoter Name"],
                                    [["P12345678901", "Actual project", "Actual promoter"]])
        self.assertEqual(result[0], dict(rera_id="P12345678901", title="Actual project", developer="Actual promoter"))

    def test_unknown_headers_fail(self):
        with self.assertRaises(ValueError):
            module.parse_table(["A", "B"], [["Actual project", "P12345678901"]])

    def test_ambiguous_headers_fail(self):
        with self.assertRaises(ValueError):
            module.parse_table(["Project Name", "Registration No", "Registration Number"], [])

    def test_non_project_rows_fail(self):
        with self.assertRaises(ValueError):
            module.parse_table(["Project Name", "Registration No"], [["Actual project", "Not an ID"]])


if __name__ == "__main__":
    unittest.main()
