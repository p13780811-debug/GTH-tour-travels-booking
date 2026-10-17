#!/usr/bin/env python3
"""Daily Wikimedia Commons rights REVIEW CANDIDATES for curated GTH PRO guides.

Not a bulk scraper and never a live image publisher. Every output is an
unapproved suggestion. Editors must confirm identity, provenance, current
license, required attribution and destination relevance before publishing.
No user credentials, service-role key or OSM writes are used.
"""
import argparse
import html
import json
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode,urlsplit
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError

API="https://commons.wikimedia.org/w/api.php"
USER_AGENT="GTHPRO-Editorial-Media-Review/1.0 (https://www.gthproglobal.com)"
GUIDES={
 "india":"India famous landmark travel photography",
 "france":"France landscape monuments travel photography",
 "australia":"Australia cities national parks landscape",
 "dubai":"Dubai skyline city landscape",
 "paris":"Paris Eiffel Tower Seine streets",
 "mumbai":"Mumbai Gateway of India skyline",
 "goa":"Goa India coast beaches architecture",
 "paris/eiffel-tower-nearby-things-to-do":"Paris Eiffel Tower Trocadero"
}
LICENSES={"CC BY 4.0":"CC BY 4.0","CC BY-SA 4.0":"CC BY-SA 4.0",
 "CC0":"CC0 1.0","CC0 1.0":"CC0 1.0","Public domain":"Public domain"}
class TextOnly(HTMLParser):
 def __init__(self):
  super().__init__();self.words=[]
 def handle_data(self,text):
  self.words.append(text)
 def value(self):
  return html.unescape(" ".join(" ".join(self.words).split()))[:400]

def stripped(value):
 if not isinstance(value,str):return ""
 parser=TextOnly()
 parser.feed(value)
 return parser.value()

def safe_url(url,host,path):
 try:
  u=urlsplit(url)
  return u.scheme=="https" and u.hostname==host and u.port in (None,443) and not u.username and not u.password and u.path.startswith(path)
 except (ValueError,TypeError):return False

def candidate(guide_slug,page):
 if not isinstance(page,dict) or not str(page.get("title","")).startswith("File:"):return None
 meta=(page.get("imageinfo") or [{}])[0]
 if not isinstance(meta,dict):return None
 extras=meta.get("extmetadata") or {}
 def field(k):
  v=extras.get(k) or {}
  return v.get("value","") if isinstance(v,dict) else ""
 license_name=LICENSES.get(stripped(field("LicenseShortName")))
 author=stripped(field("Artist")) or stripped(field("Credit"))
 image=meta.get("url")
 source=meta.get("descriptionurl")
 license_url=field("LicenseUrl")
 width,height=meta.get("width"),meta.get("height")
 if not license_name or not author or not safe_url(image,"upload.wikimedia.org","/wikipedia/commons/") or not safe_url(source,"commons.wikimedia.org","/wiki/File:") or not isinstance(license_url,str) or urlsplit(license_url).hostname not in ("creativecommons.org","www.creativecommons.org","commons.wikimedia.org") or not safe_url(license_url,urlsplit(license_url).hostname,"/") or not isinstance(width,int) or not isinstance(height,int) or width<800 or height<500:
  return None
 if len(author)<3:return None
 return {"guide_slug":guide_slug,"image_url":image,"source_page":source,
  "source_name":"Wikimedia Commons","license_type":license_name,"license_url":license_url,
  "attribution_text":author,"alt_text":"Editorially reviewed photograph for "+guide_slug.replace("/"," ").replace("-"," "),
  "width":width,"height":height,"is_hero":False,"priority":0,
  "editorial_approved":False,"rights_reviewed_at":None,
  "review_note":"Rights metadata must be rechecked at source; verify actual subject and license obligations."}

def query_commons(guide_slug,term):
 args={"action":"query","generator":"search","gsrsearch":term+" filetype:bitmap",
       "gsrnamespace":"6","gsrlimit":"6","prop":"imageinfo",
       "iiprop":"url|size|extmetadata","format":"json","formatversion":"2"}
 url=API+"?"+urlencode(args)
 request=Request(url,headers={"User-Agent":USER_AGENT,"Accept":"application/json"})
 with urlopen(request,timeout=25) as response:
  raw=response.read(1500000)
 doc=json.loads(raw)
 if not isinstance(doc,dict):return []
 pages=doc.get("query",{}).get("pages",[]) if isinstance(doc.get("query"),dict) else []
 return [item for p in pages if (item:=candidate(guide_slug,p))]

def write_review_queue(output:Path,limit:int=6):
 if not 1<=limit<=8:raise ValueError("Invalid bounded review limit")
 result=[]
 for i,(slug,term) in enumerate(list(GUIDES.items())[:limit]):
  if i:time.sleep(1.0)
  try:
   options=query_commons(slug,term)
   status="candidates_need_human_review" if options else "no_verified_license_candidates"
  except (HTTPError,URLError,TimeoutError,ValueError,TypeError,json.JSONDecodeError):
   options=[];status="source_unavailable"
  result.append({"guide_slug":slug,"status":status,"media_candidates":options[:3],
    "content_review_required":True,"auto_publish":False})
 output.parent.mkdir(parents=True,exist_ok=True)
 output.write_text(json.dumps({"source":"Wikimedia Commons API","rights_review_required":True,
  "publication_automatic":False,"guides":result},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 return result

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument("--output",default="guide_media_review_queue.json")
 parser.add_argument("--limit",type=int,default=8)
 args=parser.parse_args()
 rows=write_review_queue(Path(args.output),args.limit)
 print(json.dumps({"guide_candidates":len(rows),"media_suggestions":sum(len(x["media_candidates"]) for x in rows),
  "published":0,"rights_review_required":True}))
if __name__=="__main__":main()
