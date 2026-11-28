// Read-only inventory. Static findings are candidates, not proof of browser behavior.
// Does not call external providers, submit forms, or print query values/secrets.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const files=[];const root=process.cwd();
function walk(dir){if(!fs.existsSync(dir))return;for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory()){if(!["node_modules",".next",".git","dist","coverage"].includes(ent.name))walk(p);}else if(/\.(?:tsx?|jsx?|mjs|cjs|html)$/.test(p)&&!p.endsWith(".d.ts"))files.push(p);}}
walk("src");walk("scripts");for(const p of ["next.config.ts","middleware.ts"])if(fs.existsSync(p))files.push(p);
const routes=files.filter(p=>/^src\/app\/.+\/(?:page|route)\.(?:tsx?|jsx?)$/.test(p)||/^src\/app\/(?:page|route)\.(?:tsx?|jsx?)$/.test(p)).map(p=>{const parts=p.split("/").slice(2,-1).filter(x=>!x.startsWith("(")&&!x.startsWith("@"));return new RegExp("^/"+parts.map(x=>x.startsWith("[[...")?".*":x.startsWith("[...")?".+":x.startsWith("[")?"[^/]+":x.replace(/[.*+?^\x24{}()|[\]\\]/g,"\\$&")).join("/")+"/?$");});
const findings=[],inventory=[];let controls=0;
function record(file,line,kind,reason,value){const raw=typeof value==="string"?value:"";let target=raw.split(/[?#]/)[0].slice(0,180);if(/^https?:\/\//i.test(raw)){try{const u=new URL(raw);target=u.origin+u.pathname;}catch{target="[invalid URL]";}}const row={file,line,kind,reason,target};findings.push(row);}
function classify(file,line,kind,value){if(value===undefined){inventory.push({file,line,kind,classification:"dynamic-review"});return;}if(!value.trim()||value.trim()==="#"){record(file,line,kind,"empty or placeholder",value);return;}if(/^(?:javascript|data):/i.test(value)){record(file,line,kind,"unsafe scheme","");return;}if(/^https?:\/\//i.test(value)){try{const u=new URL(value);if(["nuitee.com","www.nuitee.com","gthproglobal.nuitee.link"].includes(u.hostname))record(file,line,kind,"retired alias or corporate host",value);else inventory.push({file,line,kind,classification:"external-review",host:u.hostname});}catch{record(file,line,kind,"invalid URL","");}return;}if(value.startsWith("/")&&!value.startsWith("//")){const pathname=value.split(/[?#]/)[0];if(!routes.some(r=>r.test(pathname))&&!fs.existsSync(path.join(root,"public",pathname.slice(1))))record(file,line,kind,"no matching static app route (check rewrites)",value);else inventory.push({file,line,kind,classification:"known-internal"});return;}inventory.push({file,line,kind,classification:"relative-or-anchor-review"});}
function literal(n){if(!n)return undefined;if(ts.isStringLiteralLike(n))return n.text;if(ts.isJsxExpression(n))return literal(n.expression);return undefined;}
function noop(n){if(!n)return false;if(ts.isJsxExpression(n))return noop(n.expression);return (ts.isArrowFunction(n)||ts.isFunctionExpression(n))&&ts.isBlock(n.body)&&(!n.body.statements.length||n.body.statements.length===1&&ts.isReturnStatement(n.body.statements[0])&&!n.body.statements[0].expression);}
for(const file of [...new Set(files)].sort()){if(file=== "scripts/audit-navigation.mjs")continue;const s=fs.readFileSync(file,"utf8");if(file.endsWith(".html")){for(const m of s.matchAll(/\b(href|action)\s*=\s*(["'])(.*?)\2/gi)){controls++;classify(file,s.slice(0,m.index).split("\n").length,m[1],m[3]);}continue;}
 const tree=ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true);const line=n=>tree.getLineAndCharacterOfPosition(n.getStart(tree)).line+1;
 function visit(n){if(ts.isJsxAttribute(n)){const key=n.name.getText(tree);if(["href","action","formAction","onClick","onSubmit"].includes(key)){controls++;if(key.startsWith("on")){if(noop(n.initializer))record(file,line(n),key,"empty handler","");else inventory.push({file,line:line(n),kind:key,classification:"handler-review"});}else classify(file,line(n),key,literal(n.initializer));}}
 if(ts.isCallExpression(n)){const call=n.expression.getText(tree);if(/(?:^|\.)(?:redirect|permanentRedirect|push|replace|assign|open)$/.test(call)&&(/redirect/i.test(call)||/router\.|location\.|window\.open|NextResponse\./.test(call))){controls++;const val=literal(n.arguments[0]);if(!(call==="window.open"&&val===""))classify(file,line(n),call,val);}}
 if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsToken&&/^(?:window\.)?location(?:\.href)?$/.test(n.left.getText(tree))){controls++;classify(file,line(n),"location assignment",literal(n.right));}
 // Inventory retired host literals even when hidden behind a helper or object.
 if(ts.isStringLiteralLike(n)&&/^https?:\/\/(?:www\.)?nuitee\.com(?:\/|$)|^https?:\/\/gthproglobal\.nuitee\.link(?:\/|$)/i.test(n.text))record(file,line(n),"URL literal","retired alias or corporate host",n.text);
 ts.forEachChild(n,visit);}visit(tree);}
const unique=[...new Map(findings.map(f=>[JSON.stringify(f),f])).values()];
const report={sourceFiles:new Set(files).size,controls,findings:unique,inventory};
fs.mkdirSync("navigation-audit",{recursive:true});fs.writeFileSync("navigation-audit/report.json",JSON.stringify(report,null,2));
console.log("NAVIGATION_AUDIT",JSON.stringify({sourceFiles:report.sourceFiles,controls,findings:unique.length,inventory:inventory.length}));
for(const f of unique)console.log("NAVIGATION_FINDING",JSON.stringify(f));
