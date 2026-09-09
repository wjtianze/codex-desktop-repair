import assert from 'node:assert/strict';
import {createFrameResizeObserver} from '../assets/local-frame-resize-v1.mjs';
function harness(){let receive,id=0;const frames=new Map(),calls=[];const host={ResizeObserver:class{constructor(fn){receive=fn}observe(){}unobserve(){}disconnect(){}},requestAnimationFrame(fn){frames.set(++id,fn);return id},cancelAnimationFrame(id){frames.delete(id)}};const observer=createFrameResizeObserver(entries=>calls.push(entries),host);return {observer,frames,calls,receive:entries=>receive(entries),tick(){const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn())}}}
const target={},other={};
let h=harness();for(let i=0;i<1000;i++)h.receive([{target,height:i}]);assert.equal(h.calls.length,0);assert.equal(h.frames.size,1);h.tick();assert.equal(h.calls.length,1);assert.equal(h.calls[0][0].height,999);console.log('PASS A thousand resize notifications reconcile once on a later frame using final size');
h=harness();h.receive([{target},{target:other}]);h.observer.unobserve(target);h.tick();assert.deepEqual(h.calls[0],[{target:other}]);console.log('PASS Unobserved elements cannot trigger queued stale reconciliation');
h=harness();h.receive([{target}]);h.observer.disconnect();h.tick();assert.equal(h.calls.length,0);assert.equal(h.frames.size,0);console.log('PASS Disconnect cancels pending work and releases retained entries');
