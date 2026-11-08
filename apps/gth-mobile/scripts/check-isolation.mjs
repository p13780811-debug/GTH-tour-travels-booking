import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../../../",import.meta.url));
const git=(...args)=>execFileSync("git",args,{cwd:root,encoding:"utf8"});
const paths=[git("diff","--name-only","origin/main...HEAD"),git("diff","--name-only","HEAD"),git("ls-files","--others","--exclude-standard")]
 .flatMap(text=>text.trim().split("\n").filter(Boolean));
const unexpected=[...new Set(paths)].filter(path=>!path.startsWith("apps/gth-mobile/")&&
 path!==".github/workflows/gth-independent-native-ci.yml"&&path!=="tsconfig.json");
if(unexpected.length)throw Error("Native PR changes protected files:\n"+unexpected.join("\n"));
const baseline=git("show","origin/main:tsconfig.json");
const current=readFileSync(new URL("../../../tsconfig.json",import.meta.url),"utf8");
const allowed=baseline.includes('"apps/gth-mobile/**"')?baseline:
 baseline.replace('"supabase/functions/**"','"supabase/functions/**",\n    "apps/gth-mobile/**"');
if(current!==allowed)throw Error("Only the isolated native-folder exclusion may differ in website tsconfig.json");
console.log("PASS: native PR changes only its app, isolated CI and exact TypeScript exclusion; website, database and deployment files match main.");
