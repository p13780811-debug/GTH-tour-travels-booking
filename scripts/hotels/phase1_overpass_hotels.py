#!/usr/bin/env python3
"""Read-only, locality-locked Overpass Phase 1 hotel exporter.

Never writes to Supabase, modifies the existing importer, or invents a value.
Areas are conservative operator-defined rectangles, NOT official locality borders.
Review the rectangles against local boundary data before production ingestion.
"""
import argparse
import json
import re
import time
from pathlib import Path
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

# latitude south, longitude west, latitude north, longitude east.
# Restrictive, approximate hotel-zone windows; NOT entire-city bounds.
ZONES = {
 "digha_new": ("Digha", "New Digha Sea Beach & Hotel Zone", (21.615,87.515,21.635,87.544)),
 "digha_old": ("Digha", "Old Digha Marine Drive & Sea Beach", (21.613,87.493,21.632,87.518)),
 "digha_shankarpur": ("Digha", "Shankarpur Coast Road", (21.625,87.55,21.654,87.602)),
 "digha_udaipur": ("Digha", "Udaipur Coast Road", (21.60,87.464,21.626,87.493)),
 "puri_swargadwar": ("Puri", "Golden Beach / Swargadwar Sea Front", (19.788,85.815,19.806,85.843)),
 "puri_marine": ("Puri", "Marine Drive Road", (19.783,85.787,19.803,85.821)),
 "puri_chakratirth": ("Puri", "Chakratirth Road", (19.798,85.827,19.817,85.858)),
 "puri_grand": ("Puri", "Grand Road near Jagannath Temple", (19.802,85.811,19.821,85.840)),
 "mumbai_kurla": ("Mumbai", "Kurla Station & LTT Hub", (19.054,72.871,19.091,72.916)),
 "mumbai_bkc": ("Mumbai", "Bandra Kurla Complex", (19.050,72.851,19.083,72.886)),
 "mumbai_bandra": ("Mumbai", "Bandra West Sea Face", (19.037,72.806,19.070,72.837)),
 "mumbai_juhu": ("Mumbai", "Juhu Beach & Vile Parle West", (19.082,72.803,19.121,72.846)),
 "mumbai_colaba": ("Mumbai", "Colaba", (18.898,72.812,18.935,72.842)),
 "mumbai_fort": ("Mumbai", "Fort", (18.928,72.822,18.949,72.849)),
 "mumbai_marine": ("Mumbai", "Marine Drive", (18.929,72.806,18.958,72.830)),
 "mumbai_nerul": ("Mumbai", "Nerul", (19.014,73.008,19.047,73.046)),
 "mumbai_vashi": ("Mumbai", "Vashi, Navi Mumbai", (19.057,72.987,19.097,73.026)),
 "mumbai_belapur": ("Mumbai", "Belapur, Navi Mumbai", (19.012,73.029,19.043,73.074)),
}
ALLOWED = {"hotel", "resort", "motel", "guest_house"}
FACILITIES = {"internet_access:wlan":"Free Wi-Fi","air_conditioning":"AC Rooms",
              "swimming_pool":"Swimming Pool","parking":"Parking",
              "restaurant":"Restaurant","room_service":"Room Service"}
OSM_ID = re.compile(r"^(node|way|relation)/[1-9][0-9]*$")
def query_bbox(b):
 s,w,n,e=b
 return ('[out:json][timeout:45];(nwr["tourism"~"^(hotel|resort|motel|guest_house)$"]'
         f'({s},{w},{n},{e}););out center tags;')
def point(el):
 loc = el if el.get("type")=="node" else el.get("center",{})
 lat,lon=loc.get("lat"),loc.get("lon")
 if isinstance(lat,(int,float)) and isinstance(lon,(int,float)) and -90<=lat<=90 and -180<=lon<=180:return lat,lon
 return None
def safe_url(v):
 if not isinstance(v,str):return None
 p=urlsplit(v.strip())
 return v.strip() if p.scheme=="https" and p.hostname and not p.username and not p.password else None
def verified_image(url, timeout=10):
 if not url:return None
 try:
  with urlopen(Request(url,headers={"User-Agent":"GTHPRO-OSM-Hotel-Phase1/1.0"},method="HEAD"),timeout=timeout) as res:
   return url if res.status==200 and res.headers.get("Content-Type","").lower().startswith("image/") else None
 except Exception:return None
def amenities(tags):
 found=[]
 for k,label in FACILITIES.items():
  if tags.get(k) in ("yes","free","customers","designated"):found.append(label)
 if tags.get("internet_access")=="wlan" and "Free Wi-Fi" not in found: found.append("Free Wi-Fi")
 return found
def normalize(el,city,locality,check_images=False):
 tags=el.get("tags") or {}
 name=tags.get("name")
 geo=point(el)
 typ=tags.get("tourism")
 if not isinstance(name,str) or not name.strip() or typ not in ALLOWED or not geo:return None
 raw_id=f'{el.get("type")}/{el.get("id")}'
 if not OSM_ID.fullmatch(raw_id):return None
 fields=[tags.get("addr:housenumber"),tags.get("addr:street") or tags.get("addr:place"),
         tags.get("addr:suburb"),tags.get("addr:city"),tags.get("addr:district"),
         tags.get("addr:state"),tags.get("addr:postcode")]
 address=", ".join(dict.fromkeys(str(x).strip() for x in fields if isinstance(x,str) and x.strip())) or None
 rating=tags.get("stars")
 stars=int(rating) if isinstance(rating,str) and re.fullmatch("[1-5]",rating) else None
 image=safe_url(tags.get("image") or tags.get("contact:image"))
 if check_images:image=verified_image(image)
 else:image=None  # Never claim live image URL validity without an HTTP check.
 return {"id":"osm-"+raw_id.replace("/","-"),"name":name.strip(),"locality":locality,
  "city":city,"address":address,"lat":geo[0],"lon":geo[1],"stars":stars,
  "thumbnail":image,"gallery":[image] if image else [],"facilities":amenities(tags),
  "affiliate_url":None,"source_url":"https://www.openstreetmap.org/"+raw_id,
  "source_license":"ODbL-1.0","evidence":{"osm_id":raw_id,"tourism":typ,
  "source_tag_star_rating":rating,"image_tag":tags.get("image"),
  "affiliation_status":"not_verified"}}
def request_zone(box,endpoint):
 body=urlencode({"data":query_bbox(box)}).encode()
 req=Request(endpoint,data=body,headers={"User-Agent":"GTHPRO-Phase1-Hotel-Exporter/1.0"},method="POST")
 with urlopen(req,timeout=65) as response:
  if response.status!=200:raise RuntimeError("Overpass HTTP error")
  data=json.load(response)
 if not isinstance(data,dict) or not isinstance(data.get("elements"),list):raise ValueError("Invalid Overpass response")
 return data["elements"]
def within_bounds(rec, bbox):\n s,w,n,e=bbox\n return s <= rec["lat"] <= n and w <= rec["lon"] <= e\n\ndef export(endpoint,check_images=False,delay=2):
 records={}
 failures=[]
 for code,(city,locality,bbox) in ZONES.items():
  try:
   for el in request_zone(bbox,endpoint):
    rec=normalize(el,city,locality,check_images)
    if rec:
     # Exact ID dedupe; zones overlap. First deterministic locality wins.
     records.setdefault(rec["id"],rec)
  except Exception as err:failures.append({"zone":code,"error":type(err).__name__})
  time.sleep(delay)
 results=sorted(records.values(),key=lambda r:(r["city"],r["locality"],r["name"],r["id"]))
 missing={k:sum(1 for r in results if r[k] is None or r[k]==[]) for k in
          ("address","stars","thumbnail","gallery","facilities","affiliate_url")}
 return {"phase":1,"scope":"targeted_localities_only","source":"live_overpass",
         "source_license":"ODbL-1.0","zones_requested":len(ZONES),
         "zones_failed":failures,"count":len(results),"missing_fields":missing,
         "strict_complete":not failures and bool(results) and all(v==0 for v in missing.values()),
         "records":results}
def main():
 p=argparse.ArgumentParser()
 p.add_argument("--out",type=Path,required=True)
 p.add_argument("--endpoint",default="https://overpass-api.de/api/interpreter")
 p.add_argument("--verify-images",action="store_true")
 args=p.parse_args()
 if args.endpoint not in ("https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"):
  p.error("Endpoint must be an approved HTTPS Overpass interpreter")
 result=export(args.endpoint,args.verify_images)
 args.out.parent.mkdir(parents=True,exist_ok=True)
 args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps({k:v for k,v in result.items() if k!="records"}))
 return 0 if not result["zones_failed"] else 2
if __name__=="__main__":raise SystemExit(main())
