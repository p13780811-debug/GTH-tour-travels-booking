import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const port=3197,root=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:process.env,stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',chunk=>{output+=chunk;});server.stderr.on('data',chunk=>{output+=chunk;});
try{
 let ready=false;
 for(let i=0;i<40;i++){try{const r=await fetch(root+'/real-estate/registry/compare?projects=one',{signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
 assert.ok(ready,'production server did not become ready');
 const started=Date.now(),response=await fetch(root+'/real-estate/registry',{signal:AbortSignal.timeout(25000)});assert.equal(response.status,200);
 const reader=response.body.getReader(),decoder=new TextDecoder();let html='',shellMs=null;
 for(;;){const {value,done}=await reader.read();if(done)break;html+=decoder.decode(value,{stream:true});if(shellMs===null&&html.includes('Advanced registry search'))shellMs=Date.now()-started;}
 assert.ok(shellMs!==null&&shellMs<5000,`registry search shell waited ${shellMs} ms for data`);
 assert.ok(html.includes('Loading source-backed registry records')||html.includes('MahaRERA records'));
 // An offline/misconfigured provider must show a recoverable error, never invented rows.
 const outage=html.includes('data service did not respond');
 if(outage)assert.ok(html.includes('Retry registry lookup'));
 console.log(JSON.stringify({path:'/real-estate/registry',status:200,shellMs,outage,recordRowsVerified:!outage&&html.includes('<tbody')}));
 const rejected=await fetch(root+'/api/real-estate/registry-preview?q=a&q=b');assert.equal(rejected.status,400);
 const preview=await fetch(root+'/api/real-estate/registry-preview?q=Thane',{signal:AbortSignal.timeout(20000)}),projectData=await preview.json();
 assert.ok([200,503].includes(preview.status));
 if(preview.status===200){assert.ok(Array.isArray(projectData.items)&&projectData.items.length<=6);for(const row of projectData.items)assert.deepEqual(Object.keys(row).sort(),['city','developer','rera_id','slug','title']);}
 else assert.equal(projectData.items,undefined);
 console.log(JSON.stringify({path:'/api/real-estate/registry-preview',status:preview.status,rows:projectData.items?.length}));
 for(const [path,expected] of [
  ['/real-estate','Your next property starts here.'],
  ['/real-estate/registry?q=Lake%2Cor%28id.gt.0%29','Use a valid project search'],
  ['/real-estate/registry/compare?projects=one','Select two or three distinct projects'],
  ['/real-estate/tools','Rent, buy, repay or sell'],
  ['/real-estate/worldwide','Your worldwide property gateway'],
  ['/real-estate/saved','Your private property research workspace'],
 ]){const r=await fetch(root+path,{signal:AbortSignal.timeout(10000)});const body=await r.text();assert.equal(r.status,200);assert.ok(body.includes(expected),path);console.log(JSON.stringify({path,status:r.status}));}
} catch(error){console.error(error);console.error(output.slice(-2500));process.exitCode=1;}finally{server.kill('SIGTERM');}
