// Isolated browser QA fixture; never deployed and never used as supplier inventory.
import http from "node:http";
const row={id:"00000000-0000-4000-8000-000000000001",slug:"melbourne",name:"Melbourne",country:"Australia",country_code:"AU",is_active:true,media_rights_verified:false,description:"Local browser fixture for testing the imported city template. This is not published destination content or live inventory.",nuitee_place_id:null};
http.createServer((req,res)=>{
 const u=new URL(req.url,"http://127.0.0.1:54321");
 res.setHeader("Content-Type","application/json");
 if(req.method!=="GET"&&req.method!=="HEAD"){res.writeHead(405);res.end(JSON.stringify({message:"Read-only fixture"}));return;}
 const match=u.pathname==="/rest/v1/destinations"&&(u.searchParams.get("slug")==="eq.melbourne"||u.searchParams.get("id")==="eq."+row.id)&&(!u.searchParams.has("country")||u.searchParams.get("country")==="eq.Australia");
 const rows=match?[row]:[];
 res.setHeader("Content-Range",match?"0-0/1":"*/0");
 if(req.headers.accept?.includes("vnd.pgrst.object")){res.writeHead(match?200:406);res.end(JSON.stringify(match?row:{code:"PGRST116",message:"No fixture row"}));}
 else res.end(JSON.stringify(rows));
}).listen(54321,"127.0.0.1",()=>console.log("CITY_QA_FIXTURE_READY"));
