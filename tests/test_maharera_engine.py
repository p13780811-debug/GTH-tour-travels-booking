import importlib.util
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('maharera_engine', ROOT / 'scripts/registry/maharera_engine.py')
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)
class EngineTests(unittest.TestCase):
    def setUp(self):
        self.manifest = {'authority':'MAHARERA','source_url':'https://maharera.maharashtra.gov.in/','license':'unconfirmed','rights_confirmed':False}
        self.record = {'ProjectName':'ABC Realty LLP','RegistrationNo':'P00000000001','PromoterName':'XYZ LLP','Taluka':'Kalyan'}
    def test_no_fake_status_or_inventory_and_no_name_title_casing(self):
        rows, drafts = engine.prepare_payload({'Data':[self.record]},self.manifest)
        self.assertEqual(rows[0]['project_name'],'ABC Realty LLP')
        self.assertFalse(rows[0]['locality_verified'])
        self.assertNotIn('status',rows[0])
        self.assertNotIn('images',rows[0])
        self.assertIn('current availability',drafts[0]['description'])
        self.assertNotIn('prime location',drafts[0]['description'])
        self.assertEqual(drafts[0]['promoter_name_as_supplied'],'XYZ LLP')
    def test_reject_nulls_markup_missing_ids_and_duplicate_input(self):
        for patch in [{'ProjectName':None},{'RegistrationNo':None},{'ProjectName':'＜script＞'},{'PromoterName':{}}]:
            with self.assertRaises(ValueError): engine.prepare_payload({'Data':[{**self.record,**patch}]},self.manifest)
        with self.assertRaises(ValueError): engine.prepare_payload({'Data':[self.record,self.record]},self.manifest)
    def test_reject_unknown_payload_source_and_oversized_batches(self):
        for payload in [None,[],{'Data':None},{'Data':['record']}]:
            with self.assertRaises(ValueError): engine.prepare_payload(payload,self.manifest)
        with self.assertRaises(ValueError): engine.prepare_payload({'Data':[self.record]}, {**self.manifest,'source_url':'https://maharera.maharashtra.gov.in.evil.invalid/'})
        with self.assertRaises(ValueError): engine.prepare_payload({'Data':[self.record]},self.manifest,0)
if __name__ == '__main__': unittest.main()
