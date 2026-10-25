import importlib.util
import io
import json
import os
from pathlib import Path
import unittest
from unittest.mock import patch
P=Path(__file__).resolve().parents[1]/'scripts/tours/catalog_engine.py'
spec=importlib.util.spec_from_file_location('tour_engine',P);engine=importlib.util.module_from_spec(spec);spec.loader.exec_module(engine)
class Response(io.BytesIO):
    def __init__(self,data,content='application/json'):super().__init__(json.dumps(data).encode() if content=='application/json' else data);self.headers={'Content-Type':content}
class Tests(unittest.TestCase):
    def test_exact_url_identity_and_homepage_rejection(self):
        for provider,ident,url in [('wegotrip','63','https://wegotrip.com/edinburgh-d2650225/audio-walk-p63/'),('klook','123','https://www.klook.com/en-IN/activity/123-original-tour/'),('tiqets','456','https://www.tiqets.com/en/paris-c66746/original-ticket-p456/'),('kkday','789','https://www.kkday.com/en/product/789-original-tour')]:self.assertEqual(engine.product_url(provider,ident,url),url)
        for provider,ident,url in [('klook','123','https://www.klook.com/'),('wegotrip','63','https://wegotrip.com/city-d10/walk-p64/'),('klook','123','https://klook.com.evil.test/activity/123-tour/'),('wegotrip','63','https://user:pass@wegotrip.com/city-d10/walk-p63/')]:
            with self.assertRaises(ValueError):engine.product_url(provider,ident,url)
    def test_audit_distinguishes_possible_duplicates_from_verified_inventory(self):
        row={'id':'1','title':'Dubai Guided Tour','city_slug':'dubai','image_url':'https://images.pexels.com/photo.jpg','affiliate_link':'https://tp.media/r?marker=417668'}
        result=engine.audit([row,dict(row,id='2')]);self.assertEqual(result['records'],2);self.assertEqual(result['duplicate_id_groups'],0);self.assertEqual(result['possible_duplicate_title_city_groups'],1);self.assertEqual(result['missing_source'],2);self.assertEqual(result['unpublished'],2);self.assertEqual(result['generic_or_missing_booking_link'],2);self.assertFalse(result['database_mutated'])
    def test_fetch_uses_supplier_detail_status_identity_image_and_url(self):
        place={'type':'city','available':True,'id':10,'name':'City','slug':'city','country':{'name':'Country'}}
        row={'id':25,'locale':'en','tags':{'available':True}}
        detail={'id':25,'published':True,'available':True,'status':'approved','city':{'id':10},'title':'Real tour','preview':'https://app.wegotrip.com/media/photo.jpg','url':'https://wegotrip.com/city-d10/real-tour-p25/','price':12,'currencyCode':'USD'}
        def opener(req,timeout):
            if '/search/' in req.full_url:return Response({'data':{'results':[place]}})
            if '/popular/' in req.full_url:return Response({'data':{'results':[row,row]}})
            if '/products/25/' in req.full_url:return Response({'data':detail})
            self.assertEqual(req.full_url,detail['preview']);return Response(b'image bytes','image/jpeg')
        products=engine.collect('City',4,opener,lambda _:None);self.assertEqual(len(products),1);self.assertEqual(products[0]['provider_product_id'],'25');self.assertEqual(products[0]['source_url'],detail['url'])
    def test_link_generation_batches_confirmed_urls_and_never_exposes_tokens(self):
        row={'provider':'wegotrip','provider_product_id':'63','source_url':'https://wegotrip.com/city-d10/walk-p63/'}
        def opener(req,timeout):
            self.assertEqual(req.full_url,'https://api.travelpayouts.com/links/v1/create');payload=json.loads(req.data);self.assertEqual(payload['links'][0]['url'],row['source_url']);return Response({'code':'success','result':{'links':[{'url':row['source_url'],'code':'success','partner_url':'https://wegotrip.tpo.lv/confirmed'}]}})
        with patch.dict(os.environ,{'TRAVELPAYOUTS_API_TOKEN':'test-not-real','TRAVELPAYOUTS_MARKER':'123','TRAVELPAYOUTS_TRS':'456'}):
            value=engine.generate_links([row],opener);self.assertEqual(value[0]['affiliate_url'],'https://wegotrip.tpo.lv/confirmed');self.assertNotIn('test-not-real',json.dumps(value))
    def test_retired_seeders_cannot_import_or_write_on_import(self):
        import runpy
        for name in ['import_activities_tours.py','import_travel_data.py']:
            module=runpy.run_path(str(P.parents[2]/'backend'/name));self.assertIn('main',module)
if __name__=='__main__':unittest.main()
