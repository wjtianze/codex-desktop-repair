import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {boundedTurnRange} from '../assets/local-chat-block-visibility-v1.mjs';
const require=createRequire(import.meta.url),p=require('../scripts/patcher.cjs'),{nativeFunction}=require('./fixtures-support/native-source.cjs'),path=require('node:path');
const file=path.join(require('../scripts/windows.cjs').packageInfo().InstallLocation,'app/resources/app.asar'),fd=fs.openSync(file,'r');let source;try{const h=p.archiveHeader(fd),e=p.getEntry(h.tree,'webview/assets/thread-virtualizer-4f61d89b50be.js');source=p.readExact(fd,e.size,h.offset+Number(e.offset)).toString()}finally{fs.closeSync(fd)}
const estimate=source.match(/c=(\d+)/)?.[1];assert.ok(estimate);
const native=vm.runInNewContext(['t','n','o','s'].map(n=>nativeFunction(source,n)).join('\n')+';var c='+estimate+';({layout:t,range:n})');
const layout=heights=>native.layout({entries:heights.map((h,i)=>({turnKey:String(i),estimatedHeightPx:h})),gapPx:6,measuredHeightsByKey:{}});
const large=layout([9000,9000,9000]),args={layout:large,distanceFromBottomPx:0,viewportHeightPx:800,overscanCount:2};
assert.equal(native.range(args).startIndex,0);assert.deepEqual(boundedTurnRange(native.range,args),{startIndex:2,endIndex:3});
console.log('PASS Tall offscreen turns are not mounted solely to fill a count-based overscan buffer');
for(const heights of [[],[20],[20,0,5000,20,10000,40],Array.from({length:70},(_,i)=>i%7?25:8000)])for(const viewport of [200,800,1600]){const l=layout(heights);for(let distance=0;distance<l.totalHeightPx+viewport;distance+=137){const options={layout:l,distanceFromBottomPx:distance,viewportHeightPx:viewport,overscanCount:2},visible=native.range({...options,overscanCount:0}),old=native.range(options),range=boundedTurnRange(native.range,options);assert.ok(range.startIndex<=visible.startIndex&&range.endIndex>=visible.endIndex);assert.ok(range.startIndex>=old.startIndex&&range.endIndex<=old.endIndex)}}
console.log('PASS Every native visible row remains covered across mixed heights, boundaries, scrolling and empty lists');
const s=fs.readFileSync('build/fixtures/render/patches/local-thread.js','utf8');assert.equal((s.match(/__localBoundedTurnRange\(Sy,/g)??[]).length,3);assert.ok(s.includes('Sy({distanceFromBottomPx:e,layout:t,overscanCount:0,viewportHeightPx:i})'));
console.log('PASS Initialization, scroll updates and explicit jumps use the bounded range while anchor discovery keeps the native visible range');
