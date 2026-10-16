// Test Next server-produced initial hotel HTML, not only static JSX text.
const url=process.env.GTH_HOTEL_HTML_CHECK_URL||"http://127.0.0.1:3000/hotels";
const res=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{"accept":"text/html"}});
if(res.status!==200)throw Error("Hotels HTML returned HTTP "+res.status);
const html=await res.text();
const h1Match=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
if(!h1Match)throw Error("Hotels initial server HTML missing H1");
const heading=h1Match[1].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
if(!/Discover Hotels Around the World/i.test(heading))throw Error("Unexpected first-render H1: "+heading.slice(0,100));
if(!html.includes('name="city"')||!html.includes('hotel-first-render-city'))throw Error("First-render search form missing");
if(!html.includes("Preparing available hotel listings"))throw Error("Missing loading affordance");
if(html.includes("Initializing Global Luxury Engine"))throw Error("Outdated unexplained loader still visible");
console.log("HOTEL_FIRST_HTML_PASS",JSON.stringify({status:res.status,h1:heading,htmlBytes:html.length,searchField:true,loadingSkeleton:true}));
