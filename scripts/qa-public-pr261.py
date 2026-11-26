import urllib.request,urllib.error,urllib.parse,json,time,re
from html.parser import HTMLParser
hosts=("gthproglobal.com","www.gthproglobal.com")
base="https://www.gthproglobal.com"
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect())
def get(url):
 req=urllib.request.Request(url,headers={"User-Agent":"GTH-PR261-Live-QA/1.0","Cache-Control":"no-cache"})
 try:
  with opener.open(req,timeout=25) as r:return r.status,r.headers,r.read(5000000)
 except urllib.error.HTTPError as e:return e.code,e.headers,e.read(200000)
def check(path):
 status,h,b=get(base+path)
 assert not any(x in b.lower() for x in (b"application error: a server-side exception",b"worker threw exception",b"exceeded resource limits")),path
 if path.startswith("/api/hotels/booking"):
  u=urllib.parse.urlsplit(h.get("Location",""))
  assert status==307 and u.hostname=="hotel.gthproglobal.com" and u.path=="/hotels",path
  ids={"Tokyo":"ChIJ51cu8IcbXWARiRtXIothAS4","Mumbai":"ChIJwe1EZjDG5zsRaYxkjY_tpF0","Melbourne":"ChIJ90260rVG1moRkM2MIXVWBAQ"}
  city=urllib.parse.parse_qs(urllib.parse.urlsplit(path).query)["city"][0]
  q=urllib.parse.parse_qs(u.query)
  assert q["placeId"]==[ids[city]] and all(q.get(k) for k in ["checkin","checkout","occupancies","currency"]),path
 elif path=="/go/transport":
  assert status==307 and urllib.parse.urlsplit(h.get("Location","")).hostname=="transport.gthproglobal.com",path
 else:
  assert status==200,(path,status)
  if path.startswith("/api/"):
   d=json.loads(b);assert isinstance(d,dict) and not d.get("error") and not d.get("degraded") and d.get("state") not in ("unavailable","unknown"),path
   if "/mobility/map" in path:assert d.get("state")=="available" and len(d.get("features",[]))>=5 and d.get("updatedAt"),path
 print("LIVE_ROUTE",path,status,flush=True)
 return status,h,b
routes=["/","/hotels","/flights","/destinations/goa","/destinations/tokyo","/mobility","/mobility/mumbai","/mobility/kolkata","/go/transport","/real-estate","/real-estate/registry","/real-estate/tools","/tender","/tender/assistant","/stadiums","/stadiums/wankhede-stadium","/tickets","/tickets/sports","/api/mobility/cities?q=Mumbai","/api/mobility/map?city=mumbai","/api/mobility/traffic?city=mumbai","/api/real-estate/registry-preview?q=Mumbai","/api/tender?scope=world&country=IN","/api/stadiums/concierge?venue=wankhede-stadium","/api/hotels/booking?city=Tokyo&country=JP","/api/hotels/booking?city=Mumbai&country=IN"]
for path in routes:
 check(path);time.sleep(1);check(path)
print("LIVE_ROUTE_AUDIT 26/26; 52/52",flush=True)
class Links(HTMLParser):
 def __init__(self):super().__init__();self.hrefs=[]
 def handle_starttag(self,tag,attrs):
  if tag=="a":self.hrefs.append(dict(attrs).get("href",""))
_,_,body=check("/stadiums/melbourne-cricket-ground")
parser=Links();parser.feed(body.decode("utf-8","replace"))
expected="/api/hotels/booking?city=Melbourne&country=AU"
assert parser.hrefs.count(expected)>=2,"Melbourne event CTAs missing or stale"
assert not any("gthproglobal.nuitee.link" in href or re.match(r"https://(?:www\\.)?nuitee\\.com(?:/|$)",href) for href in parser.hrefs),"Retired corporate alias"
check(expected)
_,_,home=check("/")
p=Links();p.feed(home.decode("utf-8","replace"))
assert all(any(urllib.parse.urlsplit(h).path==route or urllib.parse.urlsplit(h).path.startswith(route+"/") for h in p.hrefs) for route in ["/real-estate","/travel","/tender","/tickets"]),"Homepage cross-pillar links missing"
s,h,b=get("https://gthproglobal.com/")
assert s==308 and urllib.parse.urlsplit(h.get("Location","")).hostname=="www.gthproglobal.com"
print("PUBLIC_PR261_SMOKE_PASSED",flush=True)
