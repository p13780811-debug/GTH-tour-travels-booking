import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
export function loadTenderTs(path,dependencies={},globals={}){
 const target={exports:{}};
 vm.runInNewContext(ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,
 {module:target,exports:target.exports,URL,URLSearchParams,Response,Request,AbortSignal,Date,TextEncoder,process:{env:{}},setTimeout,clearTimeout,require:name=>{if(name in dependencies)return dependencies[name];throw Error("Unexpected dependency "+name);},...globals});
 return target.exports;
}
