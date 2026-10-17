#!/usr/bin/env python3
"""Bounded, fair-use Wikidata attraction importer (not tour/ticket supply)."""
import argparse,datetime as dt,html,json,os,pathlib,re,sys,time
import urllib.error,urllib.parse,urllib.request
BASE="https://query.wikidata.org/sparql"
COMMONS="https://commons.wikimedia.org/w/api.php"
EDGE="https://dqprqjmhxjnrllczqyhz.supabase.co/functions/v1/gth-open-attractions-ingest"
REGIONS={"maharashtra":"Q1191","goa":"Q1171"}
KINDS={"Q570116":"attraction","Q1785071":"fort","Q40080":"beach","Q46169":"national-park","Q23413":"castle"}
LICENSES={
 "CC BY 4.0":"https://creativecommons.org/licenses/by/4.0/",
 "CC BY-SA 4.0":"https://creativecommons.org/licenses/by-sa/4.0/",
 "CC BY 3.0":"https://creativecommons.org/licenses/by/3.0/",
 "CC BY-SA 3.0":"https://creativecommons.org/licenses/by-sa/3.0/",
 "CC0":"https://creativecommons.org/publicdomain/zero/1.0/",
 "Public domain":"https://creativecommons.org/publicdomain/mark/1.0/"
}
QID=re.compile(r"^Q[1-9][0-9]{0,14}$")
POINT=re.compile(r"^Point\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)$")
UA="GTHProOpenAttractions/1.0 (https://www.gthproglobal.com/contact; CC0 Wikidata source attribution)"

def query(region,kind,limit,offset):
 if region not in REGIONS or kind not in KINDS or not 1<=limit<=200 or not 0<=offset<=6000:raise ValueError("Invalid bounded query")
 return f"""SELECT DISTINCT ?place ?name ?geo ?kind ?description ?image WHERE {{
 VALUES ?kind {{ wd:{kind} }}
 ?place wdt:P31 ?kind ; wdt:P131 wd:{REGIONS[region]} ; wdt:P625 ?geo ; rdfs:label ?name .
 FILTER(LANG(?name)="en")
 OPTIONAL {{ ?place schema:description ?description . FILTER(LANG(?description)="en") }}
 OPTIONAL {{ ?place wdt:P18 ?image }}
 }} ORDER BY ?place LIMIT {limit} OFFSET {offset}"""

def fetch_json(url,params,timeout=40):
 parsed=urllib.parse.urlsplit(url)
 if parsed.scheme!="https" or parsed.hostname not in ("query.wikidata.org","commons.wikimedia.org") or parsed.username or parsed.password:
  raise ValueError("Unapproved source")
 encoded=urllib.parse.urlencode(params).encode()
 for attempt in range(3):
  req=urllib.request.Request(url,data=encoded,method="POST",headers={"User-Agent":UA,"Accept":"application/sparql-results+json, application/json","Content-Type":"application/x-www-form-urlencoded"})
  try:
   with urllib.request.urlopen(req,timeout=min(timeout,24)) as res:
    raw=res.read(4000001)
    if len(raw)>4000000:raise ValueError("Response too large")
    return json.loads(raw)
  except urllib.error.HTTPError as e:
   if e.code not in (429,503) or attempt==2:raise
   after=e.headers.get("Retry-After","")
   time.sleep(min(30,max(2,int(after))) if after.isdecimal() else (attempt+1)*3)
  except (TimeoutError,urllib.error.URLError):
   if attempt==2:raise
   time.sleep((attempt+1)*2)
 raise RuntimeError("Source unavailable")

def value(row,key):
 x=row.get(key,{})
 return x.get("value") if isinstance(x,dict) else None

def parse_bindings(doc,region,kind):
 if region not in REGIONS or kind not in KINDS:raise ValueError("Unsupported place category")
 results={}
 for item in doc.get("results",{}).get("bindings",[]):
  if not isinstance(item,dict):continue
  uri=value(item,"place") or ""
  qid=uri.rsplit("/",1)[-1]
  name=value(item,"name")
  point=POINT.fullmatch(value(item,"geo") or "")
  if not QID.fullmatch(qid) or not isinstance(name,str) or not 2<=len(name.strip())<=180 or not point:continue
  lon,lat=float(point.group(1)),float(point.group(2))
  if not (-90<=lat<=90 and -180<=lon<=180) or (lat==0 and lon==0):continue
  if region=="goa" and not(14.8<=lat<=15.9 and 73.6<=lon<=74.5):continue
  if region=="maharashtra" and not(15<=lat<=23 and 72<=lon<=81):continue
  desc=value(item,"description")
  row={"wikidata_qid":qid,"name":name.strip(),"description":desc.strip()[:500] if isinstance(desc,str) and desc.strip() else None,
       "region_slug":region,"country_code":"IN","category":KINDS[kind],"latitude":lat,"longitude":lon,
       "wikidata_url":"https://www.wikidata.org/wiki/"+qid,"source_license":"CC0-1.0",
       "image_url":None,"commons_page":None,"image_author":None,"image_license":None,
       "image_license_url":None,"media_checked_at":None}
  image=value(item,"image")
  if isinstance(image,str) and "/Special:FilePath/" in image:
   fn=urllib.parse.unquote(image.split("/Special:FilePath/",1)[1]).replace("_"," ")
   if len(fn)<=240 and fn.lower().endswith((".jpg",".jpeg",".png",".webp")) and not re.search(r"[\x00-\x1f<>|?#]",fn):
    row["_image_filename"]=fn
  results[qid]=row
 return list(results.values())

def plain(s):
 return re.sub(r"\s+"," ",html.unescape(re.sub(r"<[^>]+>"," ",str(s or "")))).strip()[:300]

def validate_media(doc,filename):
 pages=doc.get("query",{}).get("pages",[])
 if not pages or not isinstance(pages[0],dict):return None
 page=pages[0];info=(page.get("imageinfo") or [None])[0]
 if not isinstance(info,dict):return None
 meta=info.get("extmetadata") or {}
 f=lambda key:(meta.get(key) or {}).get("value")
 lic=plain(f("LicenseShortName"));link=plain(f("LicenseUrl"))
 if link.startswith("http://creativecommons.org/"):link="https://"+link[7:]
 if LICENSES.get(lic)!=link or plain(f("NonFree")).lower()=="true" or plain(f("Restrictions")):return None
 author=plain(f("Attribution") or f("Artist"))
 if not author and lic in ("Public domain","CC0"):author="Creator not stated — see Commons file"
 if not author:return None
 photo=info.get("thumburl") or info.get("url")
 if not isinstance(photo,str) or not isinstance(page.get("title"),str) or not page["title"].startswith("File:"):return None
 u=urllib.parse.urlsplit(photo)
 if u.scheme!="https" or u.hostname!="upload.wikimedia.org" or not u.path.startswith("/wikipedia/commons/") or u.query or u.fragment:return None
 commons="https://commons.wikimedia.org/wiki/"+urllib.parse.quote(page["title"].replace(" ","_"),safe=":_()-")
 return {"image_url":photo,"commons_page":commons,"image_author":author,
  "image_license":lic,"image_license_url":link,"media_checked_at":dt.datetime.now(dt.timezone.utc).isoformat()}

def commons_lookup(filename):
 return validate_media(fetch_json(COMMONS,{"action":"query","format":"json","formatversion":"2","prop":"imageinfo","titles":"File:"+filename,
  "iiprop":"url|mime|extmetadata","iiurlwidth":960,"iiextmetadatafilter":"LicenseShortName|LicenseUrl|Artist|Attribution|NonFree|Restrictions"},timeout=20),filename)

def upload(rows):
 token=os.environ.get("GTH_ATTRACTIONS_OIDC_TOKEN","")
 url=os.environ.get("GTH_ATTRACTIONS_EDGE_URL","")
 if not token or url!=EDGE:raise RuntimeError("GitHub OIDC writer unavailable")
 for i in range(0,len(rows),40):
  part=rows[i:i+40]
  req=urllib.request.Request(url,data=json.dumps({"rows":part},ensure_ascii=False).encode(),method="POST",
   headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"})
  with urllib.request.urlopen(req,timeout=30) as response:
   if json.load(response).get("accepted")!=len(part):raise RuntimeError("Backend rejected signed batch")

def main(argv=None):
 p=argparse.ArgumentParser()
 p.add_argument("--region",choices=sorted(REGIONS),default="goa")
 p.add_argument("--categories",default="beach,fort,national-park")
 p.add_argument("--page-size",type=int,default=35)
 p.add_argument("--max-pages",type=int,default=1)
 p.add_argument("--photo-checks",type=int,default=8)
 p.add_argument("--fixture",type=pathlib.Path)
 p.add_argument("--write",action="store_true")
 args=p.parse_args(argv)
 if not 1<=args.page_size<=200 or not 1<=args.max_pages<=3 or not 0<=args.photo_checks<=25:p.error("Bounded public API limit exceeded")
 kinds={label:k for k,label in KINDS.items()}
 selected=[kinds.get(k.strip()) for k in args.categories.split(",")]
 if not selected or None in selected or len(set(selected))!=len(selected):p.error("Unapproved categories")
 if args.fixture and args.write:p.error("Do not publish synthetic fixture")
 if args.write and os.environ.get("GTH_ATTRACTIONS_IMPORT_ENABLED")!="true":p.error("Importer disabled")
 results={};photo_checks=0
 for kind in selected:
  for page in range(args.max_pages):
   if args.fixture:doc=json.loads(args.fixture.read_text())
   else:
    if results:time.sleep(2)
    try:
     doc=fetch_json(BASE,{"query":query(args.region,kind,args.page_size,page*args.page_size),"format":"json"},timeout=24)
    except (TimeoutError,urllib.error.URLError,urllib.error.HTTPError) as error:
     print("Wikidata shared query service unavailable; no records fabricated:",str(type(error).__name__),file=sys.stderr)
     continue
   batch=parse_bindings(doc,args.region,kind)
   for row in batch:
    q=row["wikidata_qid"]
    if q not in results:results[q]=row
    elif row.get("_image_filename") and not results[q].get("_image_filename"):results[q]["_image_filename"]=row["_image_filename"]
   if args.fixture or len(batch)<args.page_size:break
   time.sleep(3)
 for row in results.values():
  filename=row.pop("_image_filename",None)
  if filename and not args.fixture and photo_checks<args.photo_checks:
   photo_checks+=1
   try:metadata=commons_lookup(filename)
   except(urllib.error.URLError,TimeoutError,ValueError):metadata=None
   if metadata:row.update(metadata)
   time.sleep(1.2)
 rows=list(results.values())
 if args.write and rows:upload(rows)
 print(json.dumps({"region":args.region,"source_records":len(rows),"licensed_photos":sum(bool(x["image_url"]) for x in rows),
  "publications":0,"written":bool(args.write),"fixture":bool(args.fixture),"photo_checks":photo_checks}))
 return 0
if __name__=="__main__":sys.exit(main())