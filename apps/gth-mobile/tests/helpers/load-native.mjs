import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
export function loadNative(path,imports={}){
 const source=readFileSync(new URL('../../src/'+path,import.meta.url),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
 const holder={exports:{}};
 new Function('module','exports','require',js)(holder,holder.exports,id=>{
  if(id in imports)return imports[id];
  throw Error('Unexpected module '+id);
 });
 return holder.exports;
}
