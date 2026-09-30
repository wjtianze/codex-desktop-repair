'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {nativeFunction}=require('./fixtures-support/native-source.cjs');
const raw=fs.readFileSync('build/fixtures/render/raw/initial.js','utf8'),patched=fs.readFileSync('build/fixtures/render/patches/initial.js','utf8');
function scopeReader(source){
 const body=nativeFunction(source,"$ro"),start=body.indexOf('R=W(Km),z=')+'R=W(Km),'.length,end=body.indexOf(',B=y?z:null',start);assert.ok(start>=0&&end>start);
 const expression=body.slice(start+2,end),helpers=["u$n","rUn","Qfr"].map(n=>nativeFunction(source,n)).join('\n');
 let previous,cached;
 const react={useMemo(compute,deps){if(!previous||deps.some((v,i)=>!Object.is(v,previous[i]))){previous=deps;cached=compute()}return cached}};
 return vm.runInNewContext(helpers+';((I,L,d,l)=>'+expression+')',{cio:react});
}
const before=scopeReader(raw),after=scopeReader(patched),args=[true,'host',false,'all'];
assert.notStrictEqual(before(...args),before(...args));
const first=after(...args);for(let i=0;i<100;i++)assert.strictEqual(after(...args),first);
console.log('PASS Native history scope stays identical across unrelated renders, preventing repeated load effects');
for(const changed of [[false,'host',false,'all'],[true,'other',false,'all'],[true,'host',true,'all'],[true,'host',false,'chats']]){
 const read=scopeReader(patched),prior=read(...args),next=read(...changed);assert.notStrictEqual(next,prior);assert.equal(JSON.stringify(next),JSON.stringify(before(...changed)));assert.strictEqual(read(...changed),next);
}
console.log('PASS Host, catalog availability, project grouping and conversation filter changes still load the correct native scope');
const sidebar=nativeFunction(patched,'ias');
const binding=sidebar.match(/(\w+)\(\);const __historySelection=__localHistoryFilter\.useSelection\(S6,\{sidebarMode:s,route:w,appMode:W\((\w+)\),workLocation:W\((\w+)\)\}/);
assert.ok(binding,'Sidebar selection must use native mode atoms');
const initialize=nativeFunction(raw,binding[1]);
assert.ok(initialize.startsWith('function '+binding[1]+'()'));
assert.ok(initialize.includes('`work-run-location-v1`'));
assert.ok(initialize.includes(binding[3]+'=jp('));
assert.ok(raw.includes(binding[2]+'=ld(Z,({get:e})=>e(_jt,void 0))'));
const hooks=[],location={},mode={};
vm.runInNewContext(sidebar.slice(sidebar.indexOf(binding[0]),sidebar.indexOf(',__historyMode=',sidebar.indexOf(binding[0]))),{[binding[1]]:()=>hooks.push('init'),S6:{},s:'chatgpt',w:{},[binding[2]]:mode,[binding[3]]:location,W:atom=>{assert.ok(hooks.length);return atom},__localHistoryFilter:{useSelection:(react,options)=>{assert.equal(options.appMode,mode);assert.equal(options.workLocation,location);return{mode:'all'}}}});
console.log('PASS Sidebar initializes the native work-location store and reads current app-mode atoms before rendering');
