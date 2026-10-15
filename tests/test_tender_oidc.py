"""Tests: GitHub OIDC gateway transport contains no database credentials in CI."""
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts" / "tenders"))
import official_publication as pub

class OidcPublisherTests(unittest.TestCase):
    def setUp(self):
        self.project = "dqprqjmhxjnrllczqyhz"
        self.source = "UK Find a Tender"
        self.row = {
            "source_name": self.source,
            "source_reference": "000123-2026",
            "source_url": "https://www.find-tender.service.gov.uk/Notice/000123-2026",
            "status": "published",
            "source_verified": True,
            "is_public": True,
        }
        self.env = {
            "GTH_TENDER_INGESTION_ENABLED": "true",
            "GTH_TENDER_OFFICIAL_PUBLICATION_ENABLED": "true",
            "GTH_TENDER_OIDC_TOKEN": "short-lived-test-token-not-real",
            "GTH_TENDER_EDGE_URL": "https://" + self.project + ".supabase.co/functions/v1/gth-tender-ingest",
        }

    def test_signed_ci_transport_without_service_role_key(self):
        fake = MagicMock()
        fake.status = 200
        response = MagicMock()
        response.__enter__.return_value = fake
        with patch.dict(os.environ, self.env, clear=True), \
             patch.object(pub, "urlopen", return_value=response) as request:
            pub.submit_official([self.row], self.project)
        self.assertEqual(request.call_count, 1)
        message = request.call_args.args[0]
        self.assertEqual(message.headers["Authorization"], "Bearer short-lived-test-token-not-real")
        self.assertTrue(message.full_url.endswith("/functions/v1/gth-tender-ingest"))
        self.assertNotIn(b"SERVICE_ROLE", message.data)

    def test_wrong_project_rejected(self):
        with patch.dict(os.environ, self.env, clear=True):
            with self.assertRaisesRegex(ValueError, "Unexpected Edge"):
                pub.submit_official([self.row], "incorrectproject00")

    def test_no_publication_without_explicit_gate(self):
        with patch.dict(os.environ, {**self.env, "GTH_TENDER_OFFICIAL_PUBLICATION_ENABLED": "false"}, clear=True):
            with self.assertRaises(ValueError):
                pub.submit_official([self.row], self.project)

    def test_unapproved_source_fails_before_network(self):
        with patch.dict(os.environ, self.env, clear=True), patch.object(pub, "urlopen") as network:
            with self.assertRaises(ValueError):
                pub.submit_official([{**self.row, "source_url": "https://example.net/notices"}], self.project)
            network.assert_not_called()

if __name__ == "__main__":
    unittest.main()
