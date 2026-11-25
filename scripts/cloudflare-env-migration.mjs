// Inventory only. Never prints values or uploads an incomplete configuration.
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
const fail = message => { console.error(message); process.exit(1); };
const [manifestPath,...sources] = process.argv.slice(2);
if (!manifestPath || !sources.length || [manifestPath,...sources].some(s=>s.startsWith("-"))) fail("Usage: node scripts/cloudflare-env-migration.mjs /secure/reviewed-production-names.json /secure/source.env [...]");
let manifest, values = Object.create(null);
try {
  manifest = JSON.parse(readFileSync(manifestPath,"utf8"));
  for (const file of sources) {
    const entries = parse(readFileSync(file));
    for (const [name,value] of Object.entries(entries)) {
      if (Object.hasOwn(values,name) && values[name] !== value) fail("Conflicting source values for: " + name);
      values[name] = value;
    }
  }
} catch { fail("Unable to read the private manifest or source files."); }
const names = manifest?.production;
if (!Array.isArray(names) || !names.length || names.some(n=>typeof n!=="string" || !/^[A-Z][A-Z0-9_]*$/.test(n)) || new Set(names).size!==names.length) fail("Manifest must contain unique production variable names.");
const valid = v => typeof v==="string" && !!v.trim() && !/^(undefined|null|\[redacted\]|\*+)$/i.test(v.trim());
const missing = names.filter(n=>!valid(values[n]));
const extra = Object.keys(values).filter(n=>!names.includes(n)).sort();
console.log("Production inventory: "+(names.length-missing.length)+"/"+names.length+" present.");
if (extra.length) console.log("Not yet classified (not discarded): "+extra.join(", "));
if (missing.length) console.log("Missing/empty/redacted: "+missing.join(", "));
const publicSecret = names.filter(n=>n.startsWith("NEXT_PUBLIC_") && /(?:SERVICE_ROLE|SECRET|PASSWORD|PRIVATE_KEY|API_TOKEN)/.test(n));
if(publicSecret.length) fail("Unsafe public variable names: "+publicSecret.join(", "));
const anon=values.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
if(anon.startsWith("sb_secret_")) fail("Privileged Supabase public key.");
if(anon.split(".").length===3){
  try { if(JSON.parse(Buffer.from(anon.split(".")[1],"base64url").toString()).role!=="anon") fail("Unexpected Supabase public JWT role."); } catch { fail("Invalid public JWT."); }
}
if(missing.length||extra.length) fail("Inventory reconciliation required. No writes performed.");
console.log("Inventory check passed. No writes performed. Classify build, runtime and CI-only variables; verify Worker limits before uploading.");
