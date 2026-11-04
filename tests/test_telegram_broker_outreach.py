"""Offline safety checks. Never contact Telegram or use live credentials."""
import importlib.util
from datetime import datetime, timedelta, timezone
from pathlib import Path
import unittest

script = Path(__file__).resolve().parents[1] / "scripts" / "telegram_broker_outreach.py"
spec = importlib.util.spec_from_file_location("broker_outreach", script)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class BrokerOutreachSafetyTests(unittest.TestCase):
    def test_empty_allowlist(self):
        self.assertEqual(mod.parse_approved_ids(""), [])

    def test_exact_numeric_allowlist(self):
        self.assertEqual(
            mod.parse_approved_ids("-1001234567890,-1009876543210"),
            [-1001234567890, -1009876543210],
        )

    def test_invalid_targets_fail_closed(self):
        invalid_items = [
            "@publicgroup", "a-group", ",",
            "-1001234567890,-1001234567890",
            "-1001234567890,-1001234567891,-1001234567892,-1001234567893",
        ]
        for value in invalid_items:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    mod.parse_approved_ids(value)

    def test_explicit_enable(self):
        self.assertTrue(mod.enabled("true"))
        self.assertFalse(mod.enabled("yes"))
        self.assertFalse(mod.enabled(""))

    def test_duplicate_window(self):
        now = datetime.now(timezone.utc)
        self.assertTrue(mod.has_recent_post(now - timedelta(days=5), now))
        self.assertFalse(mod.has_recent_post(now - timedelta(days=15), now))

    def test_mandatory_interval(self):
        self.assertEqual(mod.MIN_INTERVAL_SECONDS, 300)

    def test_correct_site_link(self):
        self.assertIn("https://www.gthproglobal.com/real-estate", mod.OUTREACH_MESSAGE)


if __name__ == "__main__":
    unittest.main()
