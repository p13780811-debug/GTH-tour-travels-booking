"""Build a small, reproducible Mumbai infrastructure snapshot from a public ODbL extract.
No live Overpass calls, no credentials, no DB writes. Output is reviewed before deployment.
"""
import datetime, email.utils, gzip, hashlib, json, math, os, pathlib, tempfile, urllib.request, xml.etree.ElementTree as ET

URL="https://download.bbbike.org/osm/bbbike/Bombay/Bombay.osm.gz"
CENTRE=(19.0364194,72.8594694)
LIMITS={"camera":12,"transit":16,"roadwork":8}
NAMES={"camera":"Mapped speed camera","transit":"Mapped transit hub","roadwork":"Mapped road construction"}
def kind(tags):
    if tags.get("highway")=="speed_camera":return "camera"
    if tags.get("highway")=="construction":return "roadwork"
    if tags.get("railway") in ("station","halt") or tags.get("amenity")=="bus_station" or (tags.get("aeroway")=="aerodrome" and tags.get("iata")):return "transit"
def distance(lat,lon):
    a,b=map(math.radians,CENTRE)
    c,d=math.radians(lat),math.radians(lon)
    h=math.sin((c-a)/2)**2+math.cos(a)*math.cos(c)*math.sin((d-b)/2)**2
    return 6371*2*math.asin(min(1,math.sqrt(h)))
def iterate(path):
    with gzip.open(path,"rb") as stream:
        parser=ET.iterparse(stream,events=("start","end"))
        _,root=next(parser)
        if root.tag!="osm":raise RuntimeError("Not an OSM extract")
        for event,e in parser:
            if event=="end" and e.tag in ("node","way","relation","meta","bounds"):
                yield e
                root.clear()
def tags(e):return {t.attrib["k"]:t.attrib["v"] for t in e.findall("tag")}
def main():
    with tempfile.TemporaryDirectory() as td:
        path=pathlib.Path(td)/"city.osm.gz"
        digest=hashlib.sha256()
        with urllib.request.urlopen(urllib.request.Request(URL,headers={"User-Agent":"GTH PRO Global OSM extract reader"}),timeout=45) as r, path.open("wb") as out:
            if not r.geturl().startswith("https://download.bbbike.org/"):raise RuntimeError("Unexpected extract origin")
            modified=r.headers.get("Last-Modified")
            if not modified:raise RuntimeError("Extract publication timestamp unavailable")
            published=email.utils.parsedate_to_datetime(modified).astimezone(datetime.timezone.utc)
            total=0
            while chunk:=r.read(1024*1024):
                total+=len(chunk)
                if total>100*1024*1024:raise RuntimeError("Extract exceeds bounded download")
                out.write(chunk);digest.update(chunk)
        now=datetime.datetime.now(datetime.timezone.utc)
        if not datetime.timedelta(0)<=now-published<=datetime.timedelta(days=30):raise RuntimeError("Unexpected extract age")
        ways=[];refs=set();candidates=[]
        def add(t,id,ts,dist):
            k=kind(ts)
            if not k or not (dist<=20 if ts.get("aeroway")=="aerodrome" else dist<=8):return
            name=(ts.get("name:en") or ts.get("name") or NAMES[k]).strip()[:100]
            candidates.append((dist,{"kind":k,"name":name or NAMES[k],"href":f"https://www.openstreetmap.org/{t}/{id}"}))
        for e in iterate(path):
            if e.tag not in ("node","way"):continue
            ts=tags(e)
            if not kind(ts):continue
            id=int(e.attrib["id"])
            if id<=0:continue
            if e.tag=="node":add("node",id,ts,distance(float(e.attrib["lat"]),float(e.attrib["lon"])))
            else:
                ids=[int(n.attrib["ref"]) for n in e.findall("nd")]
                if ids:
                    ways.append((id,ts,ids));refs.update(ids)
        coords={}
        for e in iterate(path):
            if e.tag=="node":
                id=int(e.attrib["id"])
                if id in refs:coords[id]=distance(float(e.attrib["lat"]),float(e.attrib["lon"]))
        for id,ts,ids in ways:
            d=min((coords[n] for n in ids if n in coords),default=math.inf)
            add("way",id,ts,d)
        counts={k:0 for k in LIMITS};features=[];seen=set()
        for _,feature in sorted(candidates,key=lambda x:(x[0],x[1]["href"])):
            k=feature["kind"];key=(k,feature["name"].casefold())
            if counts[k]>=LIMITS[k] or key in seen:continue
            seen.add(key);counts[k]+=1;features.append(feature)
        if counts["transit"]<5:raise RuntimeError("Insufficient real transit features")
        result={"countryCode":"IN","slug":"mumbai","source":URL,"license":"ODbL-1.0","sha256":digest.hexdigest(),"updatedAt":published.isoformat().replace("+00:00","Z"),"features":features}
        print("SNAPSHOT_COUNTS",json.dumps(counts),flush=True)
        print("SNAPSHOT_JSON",json.dumps(result,ensure_ascii=True,separators=(",",":")),flush=True)
        print("OSM attribution: OpenStreetMap contributors; extract by BBBike.org",flush=True)
if __name__=="__main__":main()
