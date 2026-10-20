#!/usr/bin/env python3
"""Stage (never publish) potentially licensed Commons hotel photo candidates.

No billing, DuckDuckGo scraping, unauthorized hotel-site hotlinking, DB writes,
production deployment or Phase-2 city-wide scraping.
Each candidate still needs human hotel-identity and rights review.
"""
import argparse
import html
import json
import math
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "GTHPRO-HotelCommons-Research/1.0 (https://www.gthproglobal.com/contact; official@gthproglobal.com)"
LICENSES = {"CC BY 4.0", "CC BY-SA 4.0", "CC BY 3.0", "CC BY-SA 3.0", "CC0", "CC0 1.0", "Public domain"}
STOPWORDS = {"hotel", "hotels", "resort", "resorts", "guest", "house", "inn", "the", "and", "of", "at"}
ID = re.compile(r"^osm-(node|way|relation)-[1-9][0-9]*$")

def plain(v):
    return html.unescape(re.sub(r"<[^>]+>", "", str(v or ""))).strip()[:600]

def key_tokens(v):
    return set(re.findall(r"[^\W_]+", plain(v).casefold(), re.UNICODE))

def geo_distance_m(a,b):
    p1,p2 = math.radians(a[0]),math.radians(b[0])
    dl=math.radians(b[0]-a[0]);dn=math.radians(b[1]-a[1])
    h=math.sin(dl/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dn/2)**2
    return 2*6371008.8*math.asin(min(1,math.sqrt(h)))

def safe_url(value, host):
    if not isinstance(value,str):
        return None
    try:
        p=urlsplit(value)
        if p.scheme=="https" and p.hostname==host and not p.username and not p.password and p.port is None:
            return value
    except ValueError:
        pass
    return None

class Wikimedia:
    def __init__(self, *, delay=0.7, sleeper=time.sleep, opener=urlopen):
        self.delay=delay;self.sleeper=sleeper;self.opener=opener;self.previous=0
    def request(self, params):
        wait=self.delay-(time.monotonic()-self.previous)
        if wait>0:self.sleeper(wait)
        self.previous=time.monotonic()
        url=API+"?"+urlencode({"format":"json","formatversion":"2",**params})
        result=None
        for attempt in range(3):
            try:
                with self.opener(Request(url,headers={"User-Agent":USER_AGENT,"Accept":"application/json"}),timeout=18) as resp:
                    if int(resp.headers.get("Content-Length","0"))>3_000_000:
                        raise ValueError("large response")
                    raw=resp.read(3_000_001)
                    if len(raw)>3_000_000:raise ValueError("large response")
                    result=json.loads(raw)
                    if isinstance(result,dict) and "error" in result:raise ValueError("Commons API error")
                    return result
            except HTTPError as err:
                if err.code not in (429,502,503,504) or attempt==2:raise
                self.sleeper(max(2**(attempt+1),1))
            except (URLError,TimeoutError):
                if attempt==2:raise
                self.sleeper(2**(attempt+1))
        return result

def strong_name_match(hotel_name, file_title):
    title=key_tokens(file_title)
    required=key_tokens(hotel_name)-STOPWORDS
    # Single generic words are too easy to confuse with another hotel.
    if not required or (len(required)==1 and len(next(iter(required)))<5):
        return False
    return required.issubset(title)

def search_files(row, wiki):
    # A name+city public Commons file search is a lead, not identity proof.
    name=plain(row["name"]).replace('"'," ").replace("\\"," ")[:90]
    city=row["city"]
    q='"'+name+'" '+city
    data=wiki.request({"action":"query","list":"search","srnamespace":"6","srlimit":"10",
                       "srsearch":q,"srprop":"", "srwhat":"text"})
    return [item["title"] for item in ((data.get("query") or {}).get("search") or [])
            if isinstance(item.get("title"),str) and item["title"].startswith("File:")][:10]

def file_evidence(title,row,wiki,*,check_image=True):
    if not isinstance(title,str) or not title.startswith("File:"):
        return None
    # Name check prevents one destination's unrelated hotel photo from being assigned.
    if not strong_name_match(row["name"],title):
        return None
    data=wiki.request({"action":"query","prop":"imageinfo","titles":title,
                       "iiprop":"url|mime|extmetadata","iiurlwidth":"1000"})
    pages=(data.get("query") or {}).get("pages") or []
    for page in pages:
        for item in page.get("imageinfo",[])[:1]:
            meta=item.get("extmetadata") or {}
            val=lambda k: plain((meta.get(k) or {}).get("value"))
            license_name=val("LicenseShortName")
            author=val("Artist") or val("Attribution")
            if license_name not in LICENSES or not author or val("NonFree").lower() in ("true","1"):
                continue
            if item.get("mime") not in ("image/jpeg","image/png","image/webp"):
                continue
            url=safe_url(item.get("thumburl") or item.get("url"),"upload.wikimedia.org")
            if not url:continue
            if check_image:
                try:
                    req=Request(url,method="HEAD",headers={"User-Agent":USER_AGENT})
                    with urlopen(req,timeout=15) as resp:
                        if resp.status!=200 or not resp.headers.get("Content-Type","").lower().startswith("image/"):
                            continue
                except (HTTPError,URLError,TimeoutError):
                    continue
            gpslat=val("GPSLatitude");gpslon=val("GPSLongitude")
            nearby=None
            try:
                if gpslat and gpslon:
                    nearby=round(geo_distance_m((row["lat"],row["lon"]),(float(gpslat),float(gpslon))))
            except (TypeError,ValueError):
                nearby=None
            # Photo URL is evidence candidate ONLY. Geographic proximity is
            # supportive, not conclusive if Commons camera GPS is ambiguous.
            if nearby is not None and nearby>1000:
                continue
            return {"image_url":url,"commons_file_page":"https://commons.wikimedia.org/wiki/"+title.replace(" ","_"),
                    "title":title,"author":author,"license":license_name,
                    "license_url":val("LicenseUrl"),"distance_m":nearby,
                    "review_status":"PENDING_EXACT_HOTEL_IDENTITY_AND_RIGHTS_REVIEW",
                    "source":"Wikimedia Commons public file metadata"}
    return None

def review_all(snapshot,wiki,*,limit=None,check_images=True,sleeper=time.sleep):
    records=snapshot["records"]
    if len(records)!=166 or len({r["id"] for r in records})!=166:
        raise ValueError("Only the frozen 166 OSM Phase-1 records are authorized")
    if any(not ID.fullmatch(r["id"]) or r["city"] not in ("Digha","Puri","Mumbai") for r in records):
        raise ValueError("Unexpected OSM identity or destination")
    output=[];errors=[]
    for row in records[:limit]:
        entry={"id":row["id"],"name":row["name"],"city":row["city"],
               "locality":row["locality"],"lat":row["lat"],"lon":row["lon"],
               "candidates":[],"approved_photos":[],"source_status":"NOT_YET_FOUND"}
        try:
            files=search_files(row,wiki)
            for file in files[:5]:
                candidate=file_evidence(file,row,wiki,check_image=check_images)
                if candidate and candidate["image_url"] not in {x["image_url"] for x in entry["candidates"]}:
                    entry["candidates"].append(candidate)
                if len(entry["candidates"])>=3:break
            if entry["candidates"]:entry["source_status"]="LICENSED_COMMONS_CANDIDATE_PENDING_REVIEW"
            else:entry["source_status"]="NO_IDENTITY_MATCHING_COMMONS_FILE_FOUND"
        except (HTTPError,URLError,ValueError,TimeoutError) as exc:
            entry["source_status"]="SOURCE_LOOKUP_UNAVAILABLE"
            errors.append({"id":row["id"],"reason":type(exc).__name__})
        output.append(entry)
        sleeper(0.35)
    return {"phase":1,"source":"Wikimedia Commons licensed media candidates", "destination_locked":True,
            "processed":len(output),"source_total":166,
            "candidate_hotels":sum(bool(r["candidates"]) for r in output),
            "approved_hotels":0,"errors":errors,"records":output,
            "publication_note":"These are not verified hotel images. Independent property identity, rights and publication review is mandatory."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input",type=Path,default=Path("docs/hotels/phase1-existing-osm-catalog-snapshot.json"))
    p.add_argument("--output",type=Path,default=Path("docs/hotels/phase1_commons_photo_candidates_166.json"))
    p.add_argument("--max-hotels",type=int,default=166)
    args=p.parse_args()
    if not 1<=args.max_hotels<=166:p.error("1<=max-hotels<=166")
    data=json.loads(args.input.read_text(encoding="utf8"))
    result=review_all(data,Wikimedia(),limit=args.max_hotels)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps({k:v for k,v in result.items() if k!="records"}))
    return 0 if not result["errors"] else 2

if __name__=="__main__":raise SystemExit(main())
