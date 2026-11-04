import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {loadNative} from './helpers/load-native.mjs';
import {readFileSync} from 'node:fs';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const colors=JSON.parse(readFileSync(new URL('../src/theme/generated.json',import.meta.url),'utf8'));
const dialogs=loadNative('components/NativeDialogs.tsx',{react:React,'react-native':{
 ActivityIndicator:'ActivityIndicator',Modal:'Modal',Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',View:'View',StyleSheet:{create:x=>x}},
 'react-native-safe-area-context':{SafeAreaView:'SafeAreaView'},'../theme/generated.json':colors});
test('handoff is affirmative, close never executes it, and rapid confirm cannot duplicate it',async()=>{
 let actions=0,closed=0,release;
 const request={title:'Continue',message:'Confirm website handoff',confirmLabel:'Continue',action:()=>{actions++;return new Promise(resolve=>{release=resolve;});}};
 let renderer;await act(async()=>{renderer=create(React.createElement(dialogs.ConfirmationDialog,{request,theme:colors.light,onClose:()=>closed++}));});
 const buttons=()=>renderer.root.findAllByType('Pressable');
 await act(async()=>buttons().find(x=>x.props.accessibilityLabel==='Close').props.onPress());
 assert.equal(actions,0);assert.equal(closed,1);
 const confirm=buttons().find(x=>x.props.accessibilityLabel==='Continue').props.onPress;
 await act(async()=>{confirm();confirm();});assert.equal(actions,1);
 await act(async()=>{release();});assert.equal(closed,2);
 await act(async()=>renderer.unmount());
});
test('handoff failure displays a safe retry and leaves the dialog open',async()=>{
 let closed=0;
 const request={title:'Continue',message:'Booking handoff',confirmLabel:'Continue',action:async()=>{throw Error('private token');}};
 let renderer;await act(async()=>{renderer=create(React.createElement(dialogs.ConfirmationDialog,{request,theme:colors.dark,onClose:()=>closed++}));});
 await act(async()=>renderer.root.findAllByType('Pressable').find(x=>x.props.accessibilityLabel==='Continue').props.onPress());
 assert.equal(closed,0);
 assert.match(JSON.stringify(renderer.toJSON()),/Unable to complete this action/);
 assert.ok(!JSON.stringify(renderer.toJSON()).includes('private token'));
 await act(async()=>renderer.unmount());
});
