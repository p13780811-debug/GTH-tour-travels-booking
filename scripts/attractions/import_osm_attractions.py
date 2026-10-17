#!/usr/bin/env python3
"""Bulk-import source-attributed ODbL mapped places (NOT tour/ticket inventory).
Accept only OSM elements with names and source coordinates, never scraped reviews or stock photos.
"""
import argparse,json,os,re,sys,time
from pathlib import Path
from urllib.error import HTTPError,URLError
from urllib.request import Request,urlopen
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from import_osm_hotels import point_coords

EDGE="https://dqprqjmhxjnrllczqyhz.supabase.co/functions/v1/gth-osm-attractions-ingest"
REGION_ID=re.compile(r"^[a-z0-9-]+(?:/[a-z0-9-]+){0,5}$")
COUNTRY_CODE=re.compile(r"^[A-Z]{2}$")
CATEGORY_TAGS=[
 ("natural","beach","beach"),("boundary","national_park","national-park"),
 ("historic","fort","fort"),("historic","castle","castle"),
 ("historic","monument","monument"),("historic","archaeological_site","archaeological-site"),
 ("historic","ruins","ruins"),("tourism","museum","museum"),
 ("tourism","viewpoint","viewpoint"),("tourism","zoo","zoo"),
 ("tourism","theme_park","theme-park"),("tourism","attraction","attraction"),
 ("leisure","nature_reserve","nature-reserve"),("leisure","park","park")
]
OSM_ID=re.compile(r"^(?:node|way|relation)/[1-9][0-9]{0,18}$")
QID=re.compile(r"^Q[1-9][0-9]{0,14}$")
def normalized_id(feature):
 props=feature.get("properties") or {}
 value=feature.get("id") or props.get("@id") or props.get("id")
 if not isinstance(value,(str,int)) or isinstance(value,bool):return None
 s=str(value)
 if re.fullmatch(r"n[1-9][0-9]*",s):s="node/"+s[1:]
 elif re.fullmatch(r"w[1-9][0-9]*",s):s="way/"+s[1:]
 elif re.fullmatch(r"a[1-9][0-9]*",s):
  num=int(s[1:]);s="way/"+str(num//2) if num%2==0 else "relation/"+str((num-1)//2)
 return s if OSM_ID.fullmatch(s) else None

def clean_text(val,maxlen):
 if not isinstance(val,str):return None
 s=val.strip()
 return s if 3<=len(s)<=maxlen and not any(ord(c)<32 for c in s) else None

def convert(feature,region,country_code="IN",country_name="India"):
 if not REGION_ID.fullmatch(region) or not COUNTRY_CODE.fullmatch(country_code) or not isinstance(feature,dict) or feature.get("type")!="Feature":return None
 props=feature.get("properties") or {}
 if not isinstance(props,dict):return None
 name=clean_text(props.get("name") or props.get("name:en"),180)
 element=normalized_id(feature)
 point=point_coords(feature.get("geometry"))
 if not name or not element or not point:return None
 lat,lon=point
 # Indian Geofabrik extracts are boundary-specific, but the simple country bounding box
 # only serves as an additional safety check; no per-place jurisdiction is certified.
 if not (-90<=lat<=90 and -180<=lon<=180):return None
 if country_code=="IN" and not (6<=lat<=37.5 and 68<=lon<=98):return None
 if any(props.get(k) in ("no","private","closed") for k in ("access","disused","abandoned")):return None
 category=next((label for tag,value,label in CATEGORY_TAGS if props.get(tag)==value),None)
 if category is None:return None
 city=clean_text(props.get("addr:city") or props.get("is_in:city"),100)
 state=str(props.get("addr:state") or "").strip().lower()
 # Approximate Goa search group; do not assert verified administrative boundaries.
 goa=country_code=="IN" and 14.8<=lat<=15.9 and 73.6<=lon<=74.5 and state not in {"maharashtra","karnataka"}
 scope=("goa" if goa else "india") if country_code=="IN" else "world"
 q=props.get("wikidata")
 return {"source_id":element,"name":name,"category":category,"region_scope":scope,
         "city":city,"latitude":lat,"longitude":lon,
         "source_url":"https://www.openstreetmap.org/"+element,
         "source_region":region,"source_license":"ODbL-1.0",
         "country_code":country_code,"country_name":country_name,
         "wikidata_qid":q if isinstance(q,str) and QID.fullmatch(q) else None}

def ingest(batch,url,token):
 req=Request(url,method="POST",headers={"Content-Type":"application/json","Authorization":"Bearer "+token},
             data=json.dumps({"rows":batch},ensure_ascii=False,separators=(",",":")).encode())
 for attempt in range(3):
  try:
   with urlopen(req,timeout=40) as res:
    doc=json.load(res)
    if doc.get("accepted")!=len(batch):raise RuntimeError("Signed ingestion rejected source batch")
    return
  except HTTPError as e:
   if e.code not in (429,502,503,504) or attempt==2:raise RuntimeError("OSM upload failed: HTTP "+str(e.code)) from None
  except (URLError,TimeoutError):
   if attempt==2:raise RuntimeError("OSM upload unavailable") from None
  time.sleep(2**attempt)


def ingest_summary(summary,url,token):
 body=json.dumps({"summary":summary},ensure_ascii=False,separators=(",",":")).encode("utf-8")
 request=Request(url,method="POST",headers={"Content-Type":"application/json","Authorization":"Bearer "+token},data=body)
 try:
  with urlopen(request,timeout=30) as response:
   if not json.load(response).get("recorded"):raise RuntimeError("Source completion not acknowledged")
 except (HTTPError,URLError,TimeoutError) as err:
  raise RuntimeError("Source progress audit failed") from None


def main(argv=None):
 p=argparse.ArgumentParser()
 p.add_argument("file",type=Path)
 p.add_argument("--region",required=True)
 p.add_argument("--country-code",default="IN")
 p.add_argument("--country-name",default="India")
 p.add_argument("--run-id",default="")
 p.add_argument("--limit",type=int,default=120000)
 p.add_argument("--dry-run",action="store_true")
 args=p.parse_args(argv)
 if not args.file.is_file() or not 1<=args.limit<=250000 or not REGION_ID.fullmatch(args.region):p.error("Invalid source, region or limit")
 if not COUNTRY_CODE.fullmatch(args.country_code) or not 2<=len(args.country_name)<=100 or any(ord(ch)<32 for ch in args.country_name):p.error("Invalid country from source index")
 if args.run_id and not re.fullmatch(r"[0-9]{1,20}",args.run_id):p.error("Invalid workflow run ID")
 if not args.dry_run and os.getenv("GTH_OSM_ATTRACTIONS_IMPORT_ENABLED")!="true":p.error("Cloud ingestion disabled")
 token=os.getenv("GTH_OSM_ATTRACTIONS_OIDC_TOKEN","")
 if not args.dry_run and (not token or os.getenv("GTH_OSM_ATTRACTIONS_EDGE_URL")!=EDGE):
  p.error("Protected GitHub OIDC ingestion required")
 seen=set();accepted=0;rejected=0;written=0;batch=[]
 with args.file.open(encoding="utf-8") as stream:
  for line in stream:
   if accepted>=args.limit:break
   line=line.strip().lstrip("\x1e")
   if not line:continue
   try:feature=json.loads(line);row=convert(feature,args.region,args.country_code,args.country_name)
   except (ValueError,TypeError,AttributeError):row=None
   if row is None or row["source_id"] in seen:
    rejected+=1;continue
   seen.add(row["source_id"]);accepted+=1
   if args.dry_run:continue
   batch.append(row)
   if len(batch)>=100:
    ingest(batch,EDGE,token);written+=len(batch);batch=[]
 if batch:
  ingest(batch,EDGE,token);written+=len(batch)
 if not args.dry_run and args.run_id:
  ingest_summary({"run_id":args.run_id,"source_region":args.region,"country_code":args.country_code,"country_name":args.country_name,"accepted":written},EDGE,token)
 print(json.dumps({"accepted_source_places":accepted,"rejected":rejected,
  "written":written,"community_source":"OpenStreetMap contributors ODbL 1.0",
  "not_tour_inventory":True,"independently_verified_places":0,"dry_run":args.dry_run}))
 return 0
if __name__=="__main__":sys.exit(main())
