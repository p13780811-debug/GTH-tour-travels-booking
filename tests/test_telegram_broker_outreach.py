"""Pure, offline tests. Never connect to Telegram or import Telethon."""
import importlib.util
from pathlib import Path
import unittest

script = Path(__file__).resolve().parents[1] / "scripts" / "telegram_broker_outreach.py"
spec = importlib.util.spec_from_file_location("gth_broker_outreach", script)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class BrokerOutreachSafetyTests(unittest.TestCase):
    def test_three_known_groups(self):
        self.assertEqual(
            mod.approved_groups(),
            ("@maratha_realtors", "@mumbaipropertydeals", "@indian_realty"),
        )

    def test_extra_group_must_be_explicit(self):
        self.assertIn("@newbrokerclub", mod.approved_groups("@NewBrokerClub"))

    def test_invalid_handles_rejected(self):
        for value in ("", "@abc", "https://t.me/testgroup", "someone@example.com", " @!! "):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    mod.normalize_username(value)

    def test_duplicate_targets_rejected(self):
        with self.assertRaises(ValueError):
            mod.approved_groups("@MARATHA_REALTORS")

    def test_only_explicit_true_enables(self):
        self.assertTrue(mod.is_enabled("true"))
        for value in ("", "1", "yes", "false"):
            self.assertFalse(mod.is_enabled(value))

    def test_old_post_means_permanent_skip(self):
        self.assertTrue(mod.message_is_invitation(
            "A link from years ago: https://www.gthproglobal.com/real-estate"
        ))
        self.assertFalse(mod.message_is_invitation(None))
        self.assertFalse(mod.message_is_invitation("unrelated"))

    def test_ledger_has_unique_group_marker(self):
        self.assertNotEqual(mod.sent_marker(-1001234567890), mod.sent_marker(-1001234567891))

    def test_five_minute_gap(self):
        self.assertEqual(mod.MIN_SECONDS_BETWEEN_ATTEMPTS, 300)

    def test_no_repeated_sending_window(self):
        self.assertFalse(hasattr(mod, "COOLDOWN_DAYS"))

    def test_invitation_is_property_listing_invite(self):
        text = mod.INVITATION_TEXT.lower()
        self.assertIn("free listing", text)
        self.assertIn("https://www.gthproglobal.com/real-estate", text)
        self.assertNotIn("guaranteed", text)

    def test_max_three_sends_per_run(self):
        self.assertEqual(mod.MAX_SENDS_PER_RUN, 3)


if __name__ == "__main__":
    unittest.main()
