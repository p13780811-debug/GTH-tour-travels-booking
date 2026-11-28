// Isolated browser QA fixtures; never deployed or used as supplier inventory.
import http from "node:http";
const rows=[
 {id:"00000000-0000-4000-8000-000000000001",slug:"melbourne",name:"Melbourne",country:"Australia",country_code:"AU",is_active:true,media_rights_verified:false,description:"Local browser fixture, not published content.",nuitee_place_id:null},
 {id:"00000000-0000-4000-8000-000000000002",slug:"accra",name:"Accra",country:"Ghana",country_code:"GH",is_active:true,media_rights_verified:false,description:"Local browser fixture, not published content.",nuitee_place_id:null}
];
http.createServer((req,res)=>{
 const u=new URL(req.url,"http://127.0.0.1:54321");
 res.setHeader("Content-Type","application/json");
 if(req.method!=="GET"&&req.method!=="HEAD"){res.writeHead(405);res.end(JSON.stringify({message:"Read-only fixture"}));return;}
 const matches=u.pathname==="/rest/v1/destinations"?rows.filter(row=>["slug","id","country","country_code"].every(key=>!u.searchParams.has(key)||u.searchParams.get(key)==="eq."+row[key])&&(!u.searchParams.has("name")||row.name.toLowerCase().includes(u.searchParams.get("name").replace(/^ilike\.%|%$/g,"").toLowerCase()))):[];
 res.setHeader("Content-Range",matches.length?"0-"+(matches.length-1)+"/"+matches.length:"*/0");
 if(req.headers.accept?.includes("vnd.pgrst.object")){res.writeHead(matches.length===1?200:406);res.end(JSON.stringify(matches.length===1?matches[0]:{code:"PGRST116",message:"No unique fixture row"}));}
 else res.end(JSON.stringify(matches));
}).listen(54321,"127.0.0.1",()=>console.log("CITY_QA_FIXTURE_READY"));
