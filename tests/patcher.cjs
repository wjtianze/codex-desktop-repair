'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {ROOT,sha,inside,applyPatch,writeArchive,archiveHeader,readExact,getEntry}=require('../scripts/patcher.cjs');
const dir=fs.mkdtempSync(path.join(ROOT,'build','patcher-tests-')),cases=[];
function test(name,fn){fn();cases.push(name);console.log('PASS '+name)}
const original=Buffer.from('before middle after'),insert=Buffer.from('changed'),relative=path.relative(ROOT,path.join(dir,'insert.txt')).split(path.sep).join('/');fs.writeFileSync(inside(ROOT,relative),insert);
const spec={id:'fixture',originalSHA256:sha(original),patchedSHA256:sha('before changed after'),operations:[{offset:7,deleteBytes:6,removedSHA256:sha('middle'),insert:relative,insertSHA256:sha(insert)}]};
test('A verified sparse patch replaces exactly the selected bytes',()=>assert.equal(applyPatch(original,spec).toString(),'before changed after'));
test('A mismatched source is rejected',()=>assert.throws(()=>applyPatch(Buffer.from('edited source'),spec),/Unsupported source/));
test('A changed patch payload is rejected',()=>{fs.writeFileSync(inside(ROOT,relative),'modified payload');assert.throws(()=>applyPatch(original,spec),/insert mismatch/);fs.writeFileSync(inside(ROOT,relative),insert)});
test('Overlapping, negative and out-of-range spans are rejected',()=>{for(const operations of[[{...spec.operations[0],offset:999}],[{...spec.operations[0],deleteBytes:-1}],[spec.operations[0],spec.operations[0]]])assert.throws(()=>applyPatch(original,{...spec,operations}),/Invalid patch span/)});
test('Patch asset paths cannot escape the repository',()=>{for(const rel of['../outside','folder/../outside','C:\\outside','/outside'])assert.throws(()=>inside(ROOT,rel))});
function fakeArchive(file){
 const a=Buffer.from('old'),b=Buffer.alloc(0),tree={files:{folder:{files:{'a.txt':{size:a.length,offset:'0',integrity:{algorithm:'SHA256',hash:sha(a),blockSize:4194304,blocks:[sha(a)]}},'empty.txt':{size:0,offset:String(a.length),integrity:{algorithm:'SHA256',hash:sha(b),blockSize:4194304,blocks:[sha(b)]}}}}}};
 const raw=Buffer.from(JSON.stringify(tree)),padding=(4-raw.length%4)%4,header=Buffer.alloc(16);header.writeUInt32LE(4,0);header.writeUInt32LE(raw.length+padding+8,4);header.writeUInt32LE(raw.length+padding+4,8);header.writeUInt32LE(raw.length,12);fs.writeFileSync(file,Buffer.concat([header,raw,Buffer.alloc(padding),a]));
}
test('Repacking verifies unchanged empty files and added assets',()=>{const input=path.join(dir,'source.asar'),output=path.join(dir,'patched.asar');fakeArchive(input);const result=writeArchive(input,output,new Map([['folder/a.txt',Buffer.from('new')],['folder/add.js',Buffer.from('added')]]));assert.equal(result.count,3);const fd=fs.openSync(output,'r');try{const h=archiveHeader(fd),entry=getEntry(h.tree,'folder/add.js');assert.equal(readExact(fd,entry.size,h.offset+Number(entry.offset)).toString(),'added')}finally{fs.closeSync(fd)}});
fs.writeFileSync(path.join(ROOT,'build','results','patcher-tests.json'),JSON.stringify({passed:true,cases},null,2));

