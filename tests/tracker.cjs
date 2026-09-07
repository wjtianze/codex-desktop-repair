'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const Original=require('../build/fixtures/tracker/tracker-original.cjs');
const Patched=require('../build/fixtures/tracker/tracker-patched.cjs');
const tests=[];
function harness(Type,options={}){
 let time=0,finalizers=[];
 const observers=new Map();
 const tracker=new Type({now:()=>time,timeOrigin:()=>0,isSupported:kind=>options.unsupported!==kind,
  scheduleFinalize:cb=>options.deferred?finalizers.push(cb):cb(),
  createObserver:(kind,callback)=>{const observer={pending:[],disconnects:0,callback,
   observe(){},disconnect(){this.disconnects++},takeRecords(){if(options.failRecords===kind)throw Error('read failure');return this.pending.splice(0)}};
   observers.set(kind,observer);return observer;}});
 return {tracker,observers,setTime:t=>time=t,deliver:(kind,entries)=>observers.get(kind).callback(entries),queue:(kind,entries)=>observers.get(kind).pending.push(...entries),
 finalize:()=>{const pending=finalizers.splice(0);pending.forEach(cb=>cb());},finish:token=>{let result;tracker.finish(token,v=>result=v,{immediate:true});return result;}};
}
const record=(start,duration=80,extra={})=>({startTime:start,duration,...extra});
function ordinary(Type){
 const h=harness(Type),root=h.tracker.start(0);
 h.deliver('longtask',[record(10,80),record(120,60)]);
 h.deliver('long-animation-frame',[record(10,90,{blockingDuration:45,scripts:[{sourceURL:'local-test'}]})]);
 h.setTime(150);const backfill=h.tracker.start(60);
 h.queue('longtask',[record(190,110)]);h.queue('long-animation-frame',[record(170,100,{blockingDuration:40})]);
 h.setTime(250);const result1=h.finish(backfill);
 h.setTime(310);const result2=h.finish(root);
 assert.equal(h.tracker.activeSpanCount,0);assert.equal(h.tracker.longTaskEntries.length,0);
 assert.ok([...h.observers.values()].every(o=>o.disconnects===1));
 return [result1,result2];
}
function test(name,fn){fn();tests.push({name,status:'passed'});console.log('PASS',name);}
test('Normal, overlapping, backfilled and clipped spans preserve original metrics',()=>assert.deepEqual(ordinary(Patched),ordinary(Original)));
test('Empty and unsupported measurements preserve original metrics',()=>{
 for(const unsupported of ['longtask','long-animation-frame','none']){
  const results=[Original,Patched].map(Type=>{const h=harness(Type,{unsupported});const token=h.tracker.start();h.setTime(100);return h.finish(token)});
  assert.deepEqual(results[1],results[0]);
 }
});
test('Deferred finalization still uses the time captured at finish',()=>{
 const results=[Original,Patched].map(Type=>{
  const h=harness(Type,{deferred:true}),token=h.tracker.start();h.setTime(100);let result;
  h.tracker.finish(token,v=>result=v);h.setTime(200);h.deliver('longtask',[record(80,100)]);h.finalize();return result;});
 assert.deepEqual(results[1],results[0]);assert.equal(results[1].longTaskDurationMsSum,20);
});
test('Long running measurements retain no more than 8192 scalar records per type',()=>{
 const h=harness(Patched),token=h.tracker.start();
 for(let batch=0;batch<60;batch++){
  const entries=Array.from({length:1000},(_,i)=>record((batch*1000+i)*100,70,{blockingDuration:30,scripts:[{largeObject:{value:'not retained'}}]}));
  h.deliver('longtask',entries);h.deliver('long-animation-frame',entries);
  assert.ok(h.tracker.longTaskEntries.length<=8192);assert.ok(h.tracker.longAnimationFrameEntries.length<=8192);
 }
 assert.equal(h.tracker.longTaskEntries.length,8192);
 assert.ok(h.tracker.longTaskEntries.every(e=>!('scripts' in e)));
 h.setTime(6000000);const result=h.finish(token);
 assert.equal(result.longTaskObserverSupported,false);assert.equal(result.longAnimationFrameObserverSupported,false);
 assert.equal(h.tracker.longTaskDroppedEnd,-Infinity);
});
test('Fresh measurements remain accurate after old history is truncated',()=>{
 const h=harness(Patched),background=h.tracker.start();
 h.deliver('longtask',Array.from({length:10000},(_,i)=>record(i*100)));
 h.setTime(1000000);const fresh=h.tracker.start();h.deliver('longtask',[record(1000010),record(1000100)]);
 h.setTime(1000250);const result=h.finish(fresh);
 assert.equal(result.longTaskObserverSupported,true);assert.equal(result.longTaskCount,2);assert.equal(result.longTaskDurationMsSum,160);
 h.tracker.discard(background);assert.equal(h.tracker.longTaskEntries.length,0);
});
test('Large observer batches do not exceed the JavaScript spread argument limit',()=>{
 const h=harness(Patched),token=h.tracker.start();
 const entries=Array.from({length:180000},(_,i)=>record(i*100));
 h.deliver('longtask',entries);assert.equal(h.tracker.longTaskEntries.length,8192);
 h.observers.get('long-animation-frame').pending=entries;
 h.setTime(18000000);assert.doesNotThrow(()=>h.finish(token));
});
test('Observer read errors and cancellation still release all observers',()=>{
 const h=harness(Patched,{failRecords:'longtask'}),a=h.tracker.start(),b=h.tracker.start();
 h.tracker.discard(a);h.setTime(100);const result=h.finish(b);
 assert.equal(result.longTaskObserverSupported,false);assert.equal(h.tracker.activeSpanCount,0);
 assert.ok([...h.observers.values()].every(o=>o.disconnects===1));
});
function benchmark(Type){
 const h=harness(Type),background=h.tracker.start(),started=performance.now();
 for(let batch=0;batch<600;batch++){
  h.setTime(batch*10000);const short=h.tracker.start();
  h.deliver('longtask',Array.from({length:100},(_,i)=>record((batch*100+i)*100,70)));
  h.deliver('long-animation-frame',Array.from({length:100},(_,i)=>record((batch*100+i)*100,75,{blockingDuration:15})));
  h.setTime((batch+1)*10000);h.finish(short);
 }
 const result={elapsedMs:Math.round(performance.now()-started),retainedRecords:h.tracker.longTaskEntries.length+h.tracker.longAnimationFrameEntries.length};
 h.tracker.discard(background);return result;
}
const benchmarkResults={original:benchmark(Original),patched:benchmark(Patched)};
assert.equal(benchmarkResults.original.retainedRecords,120000);
assert.equal(benchmarkResults.patched.retainedRecords,16384);
const report={generatedAt:new Date().toISOString(),tests,benchmark:benchmarkResults,limits:'Synthetic tests demonstrate this specific monitoring defect. They do not establish the cause of every live UI slowdown.'};
fs.writeFileSync(path.join(__dirname,'../build/results/tracker-tests.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
