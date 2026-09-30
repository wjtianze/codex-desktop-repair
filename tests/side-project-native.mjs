import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {nativeFunction} from './fixtures-support/native-source.cjs';
import {createSideProjectCommand} from '../assets/local-side-chat-projects-v1.mjs';
const source=fs.readFileSync('build/fixtures/render/patches/primary.js','utf8'),navigation={},catalog={},projects=[{projectId:'p',path:'C:/fixture',label:'Project'}],scope={value:{pathname:'/fixture'}};let command;
const React={useRef:v=>({current:v}),useState:v=>[v,()=>{}],useEffect(){},useCallback:f=>f,useMemo:f=>f()};
const fn=vm.runInNewContext(nativeFunction(source,"__localSideProjectCommand")+';__localSideProjectCommand',{lg:()=>React,A:token=>{assert.equal(token,navigation);return scope},Fh:navigation,q:token=>{assert.equal(token,catalog);return projects},Nx:catalog,Xf:()=>({locale:'en'}),js:'folder',a:'folder',qD:v=>command=v,__localCreateSideProjectCommand:createSideProjectCommand});
fn({conversationId:'side',hostId:'local',cwd:'C:/fixture'});assert.equal(command.enabled,true);assert.equal(command.submenu.sections[0].items[0].id,'p');
console.log('PASS Actual side-project component uses the native navigation scope and catalogue reader');
const body=nativeFunction(source,"__localSideProjectCommand"),call=body.match(/bridge\.\w+\(\);thread\.\w+\(\);return bridge\.\w+\(scope,thread\.\w+,\{\.\.\.options,intl,initialMode:'local'\}\)/)?.[0];assert.ok(call);const records=[],Component=()=>null,bridge={n:()=>records.push('bridge-init'),r:(...args)=>(records.push(args),'opened'),i:{}},thread={s:()=>records.push('thread-init'),r:Component,a:()=>{throw Error("This export Aa a component, V3e cn initializer")}};
const open=vm.runInNewContext('(function(bridge,thread,scope,options,intl){'+call+'})');assert.equal(open(bridge,thread,scope,{hostId:'local'},'intl'),'opened');assert.deepEqual(records.slice(0,2),['bridge-init','thread-init']);assert.equal(records[2][0],scope);assert.equal(records[2][1],Component);assert.equal(records[2][2].hostId,'local');assert.equal(records[2][2].initialMode,'local');
console.log('PASS Project opening initializes the actual modules and passes the native side-chat component without invoking it');
const composer=nativeFunction(source,'met'),native=fs.readFileSync('build/fixtures/render/raw/primary.js','utf8');
assert.ok(nativeFunction(native,'met').includes('C=A(gS)'));
assert.ok(composer.includes('I=F')&&composer.includes('K=J(ts,I)'));
const projectEntry=composer.match(/if\(C\.value\.kind===`local`&&C\.value\.placement===`side`\)Ve=\(0,YJ\.jsx\)\(__localSideProjectCommand,\{conversationId:I,hostId:K,cwd:g\}\);/)[0];
for(const placement of ['main','side']){const selected=[];vm.runInNewContext('let Ve;'+projectEntry,{C:{value:{kind:'local',placement}},I:'conversation',K:'host',g:'cwd',YJ:{jsx:(type,props)=>selected.push(props)},__localSideProjectCommand:'project'});assert.equal(selected.length,placement==='side'?1:0);if(selected.length)assert.deepEqual({...selected[0]},{conversationId:'conversation',hostId:'host',cwd:'cwd'})}
console.log('PASS Native composer reads the side scope and forwards actual conversation and host IDs');
