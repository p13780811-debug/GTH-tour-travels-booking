import test from 'node:test';
import assert from 'node:assert/strict';
import {loadNative} from './helpers/load-native.mjs';
const routing=loadNative('core/routing.ts');
let result={type:'opened'},calls=[];
const live=loadNative('core/live-website.ts',{'./routing':routing,'expo-web-browser':{
 openBrowserAsync:async(url,options)=>{calls.push({url,options});return result;},
 WebBrowserPresentationStyle:{FULL_SCREEN:'fullScreen'},
}});
test('live canonical service pages request new HTML while exits and signed links retain their parameters',()=>{
 for(const path of ['/mega-aggregator','/hotels','/flights','/real-estate','/tender','/hotels/stay/osm:node-1']){
  const url=new URL(live.liveWebsiteUrl(path,1234));
  assert.equal(url.origin,routing.SITE_ORIGIN);assert.equal(url.searchParams.get('gth_app_refresh'),'1234');
 }
 for(const path of ['/hotels/partner/osm%3Anode-1','/flights/out/yesim?marker=example&u=https%3A%2F%2Fyesim.app%2F','/api/hotels?page=1','/hotels?signature=example'])
  assert.equal(live.liveWebsiteUrl(path,1234),routing.firstPartyUrl(path));
 for(const path of ['https://evil.example','//evil.example','/\\evil.example'])assert.equal(live.liveWebsiteUrl(path),null);
});
test('live services use the free OS in-app browser in the app task; locked opens remain retryable',async()=>{
 calls=[];result={type:'opened'};
 await live.openLiveWebsite('/hotels',{bg:'#060b12',text:'#f3f4f6'});
 assert.equal(calls.length,1);assert.equal(new URL(calls[0].url).pathname,'/hotels');
 assert.equal(calls[0].options.createTask,false);assert.equal(calls[0].options.showInRecents,false);
 assert.equal(calls[0].options.toolbarColor,'#060b12');
 result={type:'locked'};await assert.rejects(()=>live.openLiveWebsite('/hotels',{bg:'#fff',text:'#111'}),/already open/);
 const before=calls.length;await assert.rejects(()=>live.openLiveWebsite('//evil.example',{bg:'#fff',text:'#111'}));
 assert.equal(calls.length,before);
 result={type:'cancel'};await live.openLiveWebsite('/tender',{bg:'#fff',text:'#111'});
});
