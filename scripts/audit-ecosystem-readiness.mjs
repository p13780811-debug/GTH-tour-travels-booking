import {config} from "dotenv";
config({path:".env.local",quiet:true});
const has=name=>Boolean(process.env[name]?.trim());
const providers=[
 ["Supabase public connection",has("NEXT_PUBLIC_SUPABASE_URL")&&has("NEXT_PUBLIC_SUPABASE_ANON_KEY"),true],
 ["Server-side reviewed enquiries",has("SUPABASE_SERVICE_ROLE_KEY"),true],
 ["Rate-limited public submissions",has("UPSTASH_REDIS_REST_URL")&&has("UPSTASH_REDIS_REST_TOKEN"),true],
 ["AI Tender and Chat assistance",has("GEMINI_API_KEY"),false],
 ["Flight fare source",["AVIASALES_API_TOKEN","TRAVELPAYOUTS_TOKEN","TRAVELPAYOUTS_API_TOKEN"].some(has),false],
 ["Analytics ID",has("NEXT_PUBLIC_GA_ID"),false],
 ["Public indexing opt-in",process.env.GTH_PUBLIC_LAUNCH_ENABLED==="true",false],
];
const errors=[];
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(url){
 try{const u=new URL(url);if(u.protocol!=="https:"||u.username||u.password||!u.hostname.endsWith(".supabase.co"))errors.push("Supabase URL should be a public HTTPS Supabase project endpoint");}
 catch{errors.push("Supabase URL invalid");}
}
if(has("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY")||has("NEXT_PUBLIC_GEMINI_API_KEY")||has("NEXT_PUBLIC_OPENAI_API_KEY"))errors.push("Public environment variable exposes privileged credentials; rotate and remove");
if(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith("sb_secret_"))errors.push("Secret database key must not be a public client key");
console.log("GTH PRO Release Readiness (presence/format only; no secrets printed)");
for(const [name,ready,required] of providers)console.log(`${ready?"OK":"NOT CONFIGURED"} · ${name}${required?" [release essential]":""}`);
for(const error of errors)console.error("SECURITY: "+error);
const essentials=providers.filter(([,ready,required])=>required&&!ready);
console.log("Manual gates still required: apply approved migrations; review RLS policies; verify live inventory and affiliate approvals; test forms, API responses, mobile and Core Web Vitals; confirm source licensing; get release approval.");
if(essentials.length||errors.length)process.exitCode=1;
