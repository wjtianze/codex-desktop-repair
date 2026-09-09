import assert from 'node:assert/strict';
import {startSliderCanvas} from '../assets/local-slider-canvas-v1.mjs';
import {writeConversationChoice} from '../assets/local-conversation-model-preferences-v1.mjs';
function harness(reduced=false){
 let next=0,observer,visibility,writes=0,draws=0,deleted=0,rect={width:200,height:20},width=0,height=0;
 const frames=new Map(),doc={hidden:false,addEventListener(_,fn){visibility=fn},removeEventListener(){visibility=null}};
 const gl=new Proxy({createBuffer:()=>({}),getAttribLocation:()=>0,getUniformLocation:()=>0,drawArrays:()=>draws++,deleteBuffer:()=>deleted++,deleteProgram:()=>deleted++},{get:(target,key)=>target[key]??(()=>{})});
 const win={WebGLRenderingContext:function(){},ResizeObserver:class{constructor(fn){observer=fn}observe(){}disconnect(){observer=null}},performance:{now:()=>0},devicePixelRatio:1.5,requestAnimationFrame(fn){frames.set(++next,fn);return next},cancelAnimationFrame(id){frames.delete(id)}};
 doc.defaultView=win;const canvas={ownerDocument:doc,getContext:()=>gl,getBoundingClientRect:()=>rect,get width(){return width},set width(v){writes++;width=v},get height(){return height},set height(v){writes++;height=v}};
 const dispose=startSliderCanvas(canvas,reduced,()=>({}),new Float32Array(12));
 return {frames,dispose,notify:()=>observer(),resize:r=>rect=r,tick(now){const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(now))},hide(value){doc.hidden=value;visibility()},get writes(){return writes},get draws(){return draws},get deleted(){return deleted}};
}
function test(name,fn){fn();console.log('PASS '+name)}
test('Repeated size notifications coalesce and never reset equal canvas dimensions',()=>{const h=harness();h.tick(0);assert.equal(h.writes,2);for(let i=0;i<100;i++)h.notify();assert.equal(h.frames.size,1);h.tick(40);assert.equal(h.writes,2);h.resize({width:300,height:20});h.notify();h.tick(80);assert.equal(h.writes,3);h.dispose()});
test('Hidden document has zero animation callbacks and resumes when shown',()=>{const h=harness();h.tick(0);h.hide(true);assert.equal(h.frames.size,0);h.notify();assert.equal(h.frames.size,0);h.hide(false);assert.equal(h.frames.size,1);h.tick(100);h.dispose();assert.equal(h.frames.size,0);assert.equal(h.deleted,2);h.dispose();assert.equal(h.deleted,2)});
test('Reduced motion draws once without a perpetual frame loop',()=>{const h=harness(true);h.tick(0);assert.equal(h.draws,1);assert.equal(h.frames.size,0);h.dispose()});
test('Decorative drawing is capped at thirty frames per second',()=>{const h=harness();for(let i=0;i<=120;i++)h.tick(i*1000/120);assert.ok(h.draws<=31);assert.ok(h.draws>=24);h.dispose()});
test('Equal model preferences preserve state identity without duplicate persistence',()=>{const value={slug:'model',thinkingEffort:'high',versionId:null};const state=writeConversationChoice(null,null,'chat',null,value);assert.equal(writeConversationChoice(state,null,'chat',null,value),state);assert.notEqual(writeConversationChoice(state,null,'chat',null,{...value,thinkingEffort:'low'}),state)});
test('Equal server preference still removes obsolete draft entry during migration',()=>{const value={slug:'model'};let state=writeConversationChoice(null,null,'draft',null,value);state=writeConversationChoice(state,null,'chat',null,value);const next=writeConversationChoice(state,null,'chat','draft',value);assert.equal(Object.keys(next.choices).length,1)});
