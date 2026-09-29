'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {nativeFunction}=require('./fixtures-support/native-source.cjs');
const raw=fs.readFileSync('build/fixtures/render/raw/initial.js','utf8'),patched=fs.readFileSync('build/fixtures/render/patches/initial.js','utf8');
function scopeReader(source){
 const body=nativeFunction(source,'cEi'),start=body.indexOf('L='),end=body.indexOf(',R=_?L:null',start);assert.ok(start>=0&&end>start);
 const expression=body.slice(start+2,end),helpers=['qTi','D9t','kan'].map(n=>nativeFunction(source,n)).join('\n');
 let previous,cached;
 const react={useMemo(compute,deps){if(!previous||deps.some((v,i)=>!Object.is(v,previous[i]))){previous=deps;cached=compute()}return cached}};
 return vm.runInNewContext(helpers+';((P,F,d,l)=>'+expression+')',{_Ei:react});
}
const before=scopeReader(raw),after=scopeReader(patched),args=[true,'host',false,'all'];
assert.notStrictEqual(before(...args),before(...args));
const first=after(...args);for(let i=0;i<100;i++)assert.strictEqual(after(...args),first);
console.log('PASS Native history scope stays identical across unrelated renders, preventing repeated load effects');
for(const changed of [[false,'host',false,'all'],[true,'other',false,'all'],[true,'host',true,'all'],[true,'host',false,'chats']]){
 const read=scopeReader(patched),prior=read(...args),next=read(...changed);assert.notStrictEqual(next,prior);assert.equal(JSON.stringify(next),JSON.stringify(before(...changed)));assert.strictEqual(read(...changed),next);
}
console.log('PASS Host, catalog availability, project grouping and conversation filter changes still load the correct native scope');
