import os,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from scripts import partner_outreach as m

ROW={"organization":"Example Builder","email":"partners@example.org","country":"India","state":"Maharashtra","district":"Thane","source_url":"https://example.org/contact","permission":"yes","permission_source":"Documented test opt-in"}
class OutreachTests(unittest.TestCase):
    def test_permission_required(self):
        with self.assertRaises(ValueError):m.lead({**ROW,"permission":"no"})
    def test_source_must_be_https(self):
        with self.assertRaises(ValueError):m.lead({**ROW,"source_url":"http://example.org"})
    def test_deduplication(self):
        with tempfile.TemporaryDirectory() as d:
            db=m.connection(Path(d)/"ledger.sqlite3");r=m.lead(ROW)
            self.assertEqual(m.dispatch(db,[r,r],send=False,limit=5,pause=0)["eligible"],1)
    def test_suppression(self):
        with tempfile.TemporaryDirectory() as d:
            db=m.connection(Path(d)/"ledger.sqlite3");r=m.lead(ROW)
            db.execute("INSERT INTO suppression VALUES (?,?)",(r["email"],"opt-out"));db.commit()
            self.assertEqual(m.dispatch(db,[r],send=False,limit=5,pause=0)["eligible"],0)
    def test_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            db=m.connection(Path(d)/"ledger.sqlite3")
            with patch.dict(os.environ,{},clear=True):
                with self.assertRaises(RuntimeError):m.dispatch(db,[m.lead(ROW)],send=True,limit=1,pause=0)
    def test_prior_send_never_repeats(self):
        with tempfile.TemporaryDirectory() as d:
            db=m.connection(Path(d)/"ledger.sqlite3");r=m.lead(ROW)
            db.execute("INSERT INTO invitations VALUES (?,?,?,?,?)",(r["email"],r["organization"],"accepted","test",r["source_url"]));db.commit()
            self.assertEqual(m.dispatch(db,[r],send=False,limit=1,pause=0)["eligible"],0)
    def test_no_guaranteed_leads(self):
        msg=m.message(m.lead(ROW),"sender@example.org")
        self.assertIn("unsubscribe",str(msg).lower())
        self.assertIn("100 property records",str(msg))
if __name__=="__main__":unittest.main()
