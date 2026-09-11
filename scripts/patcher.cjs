'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'patch-manifest.json'),'utf8').replace(/^\uFEFF/,''));
function sha(data){return crypto.createHash('sha256').update(data).digest('hex')}
function fileHash(file){const fd=fs.openSync(file,'r'),hash=crypto.createHash('sha256'),buffer=Buffer.alloc(4*1024*1024);try{let size;while((size=fs.readSync(fd,buffer,0,buffer.length,null)))hash.update(buffer.subarray(0,size));return hash.digest('hex')}finally{fs.closeSync(fd)}}
function inside(root,relative){assert.equal(typeof relative,'string');assert.ok(relative&&!/^(?:[a-z]:|[\\\\/])/i.test(relative)&&!path.isAbsolute(relative)&&!relative.split(/[\\/]/).some(x=>!x||x==='.'||x==='..'),'Unsafe relative path');const full=path.resolve(root,relative),prefix=path.resolve(root)+path.sep;assert.ok(full.startsWith(prefix),'Path escapes root');return full}
function readExact(fd,size,offset){assert.ok(Number.isSafeInteger(size)&&size>=0);const data=Buffer.alloc(size);let read=0;while(read<size){const n=fs.readSync(fd,data,read,size-read,offset+read);assert.ok(n,'Unexpected end of file');read+=n}return data}
function archiveHeader(fd){const fixed=readExact(fd,16,0);assert.equal(fixed.readUInt32LE(0),4);const headerBytes=fixed.readUInt32LE(4),jsonBytes=fixed.readUInt32LE(12);assert.ok(jsonBytes<=64*1024*1024&&headerBytes>=jsonBytes+8);const raw=readExact(fd,jsonBytes,16);return{tree:JSON.parse(raw.toString('utf8')),offset:8+headerBytes,hash:sha(raw)}}
function* entries(node,prefix=''){for(const [name,item]of Object.entries(node.files||{})){const full=prefix?prefix+'/'+name:name;if(item.files)yield* entries(item,full);else if(item.offset!==undefined&&!item.unpacked)yield[full,item]}}
function getEntry(tree,relative){let node=tree;for(const part of relative.split('/')){assert.ok(node.files?.[part],'Missing archive entry: '+relative);node=node.files[part]}return node}
function integrity(data,blockSize=4194304){assert.ok(Number.isInteger(blockSize)&&blockSize>0);const blocks=data.length?[]:[sha(data)];for(let at=0;at<data.length;at+=blockSize)blocks.push(sha(data.subarray(at,at+blockSize)));return{algorithm:'SHA256',hash:sha(data),blockSize,blocks}}
function asset(relative){const data=fs.readFileSync(inside(ROOT,relative));assert.equal(sha(data),manifest.assets[relative],'Asset integrity mismatch: '+relative);return data}
function applyPatch(input,spec){
 assert.equal(sha(input),spec.originalSHA256,'Unsupported source: '+spec.id);
 if(spec.preprocess){assert.equal(spec.preprocess,'lf-to-crlf');assert.ok(!input.includes(Buffer.from('\r\n')));input=Buffer.from(input.toString('utf8').replace(/\n/g,'\r\n'))}
 const output=[];let position=0;
 for(const operation of spec.operations){
  assert.ok(Number.isSafeInteger(operation.deleteBytes)&&operation.deleteBytes>=0&&Number.isSafeInteger(operation.offset)&&operation.offset>=position&&operation.offset+operation.deleteBytes<=input.length,'Invalid patch span');
  assert.equal(sha(input.subarray(operation.offset,operation.offset+operation.deleteBytes)),operation.removedSHA256,'Patch anchor mismatch');
  const insert=fs.readFileSync(inside(ROOT,operation.insert));assert.equal(sha(insert),operation.insertSHA256,'Patch insert mismatch');
  output.push(input.subarray(position,operation.offset),insert);position=operation.offset+operation.deleteBytes;
 }
 output.push(input.subarray(position));const result=Buffer.concat(output);assert.equal(sha(result),spec.patchedSHA256,'Patched script mismatch');return result;
}
function verifyArchive(file,previous,replacements){
 const fd=fs.openSync(file,'r');let count=0;
 try{const current=archiveHeader(fd);for(const[name,item]of entries(current.tree)){
  const bytes=readExact(fd,item.size,current.offset+Number(item.offset));
  if(replacements.has(name))assert.deepEqual(bytes,replacements.get(name),name);
  else {const old=getEntry(previous.tree,name);assert.equal(item.size,old.size,name);assert.equal(sha(bytes),old.integrity?.hash??sha(readExact(previous.fd,old.size,previous.offset+Number(old.offset))),name)}
  if(item.integrity){assert.equal(sha(bytes),item.integrity.hash,name);assert.deepEqual(integrity(bytes,item.integrity.blockSize).blocks,item.integrity.blocks,name)}
  count++;
 }return{count,header:current.hash}}finally{fs.closeSync(fd)}
}
function writeArchive(source,target,replacements){
 const input=fs.openSync(source,'r');try{
  const old=archiveHeader(input),tree=structuredClone(old.tree),original=new Map([...entries(old.tree)]);
  for(const name of replacements.keys())if(!original.has(name)){const parts=name.split('/'),leaf=parts.pop();let folder=tree;for(const part of parts){assert.ok(folder.files?.[part]?.files,'Invalid new asset parent');folder=folder.files[part]}assert.ok(!folder.files[leaf]);folder.files[leaf]={offset:'0',size:0}}
  let position=0;
  for(const[name,item]of entries(tree)){item.offset=String(position);if(replacements.has(name)){const data=replacements.get(name);item.size=data.length;item.integrity=integrity(data,item.integrity?.blockSize)}position+=item.size}
  const encoded=Buffer.from(JSON.stringify(tree)),padding=(4-encoded.length%4)%4,payloadSize=4+encoded.length+padding;
  const header=Buffer.alloc(16);header.writeUInt32LE(4,0);header.writeUInt32LE(payloadSize+4,4);header.writeUInt32LE(payloadSize,8);header.writeUInt32LE(encoded.length,12);
  const output=fs.openSync(target,'wx');
  try{fs.writeSync(output,header);fs.writeSync(output,encoded);if(padding)fs.writeSync(output,Buffer.alloc(padding));
   for(const[name]of entries(tree)){
    if(replacements.has(name)){fs.writeSync(output,replacements.get(name));continue}
    const item=original.get(name);let offset=old.offset+Number(item.offset),remaining=item.size;
    while(remaining){const n=Math.min(remaining,4*1024*1024);fs.writeSync(output,readExact(input,n,offset));offset+=n;remaining-=n}
   }
   fs.fsyncSync(output);
  }finally{fs.closeSync(output)}
  return{...verifyArchive(target,{...old,fd:input},replacements),oldHeader:old.hash};
 }finally{fs.closeSync(input)}
}
function build(source,output,{sidebar=true,fixtures=false}={}){
 source=path.resolve(source);output=path.resolve(output);
 assert.ok(!fs.existsSync(output),'Build directory already exists');
 const archive=path.join(source,'resources','app.asar'),exe=path.join(source,'ChatGPT.exe');
 assert.equal(fileHash(archive),manifest.originalArchiveSHA256,'Unsupported official archive');
 assert.equal(fileHash(exe),manifest.originalExecutableSHA256,'Unsupported official executable');
 const externalSpec=manifest.files.find(x=>x.id==='browser');
 assert.equal(fileHash(inside(source,externalSpec.entry)),externalSpec.originalSHA256,'Unsupported bundled browser');
 fs.mkdirSync(output,{recursive:true});
 const replacements=new Map(),input=fs.openSync(archive,'r');
 try{const header=archiveHeader(input);
  for(const candidate of manifest.files){if(candidate.id==='browser'||(!sidebar&&candidate.id==='primary'&&!candidate.withoutSidebar))continue;const spec=!sidebar&&candidate.withoutSidebar?candidate.withoutSidebar:candidate;const item=getEntry(header.tree,spec.entry),raw=readExact(input,item.size,header.offset+Number(item.offset)),patched=applyPatch(raw,spec);replacements.set(spec.entry,patched);
   if(fixtures){const folder=path.join(output,'fixtures');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,spec.id+'.original.js'),raw);fs.writeFileSync(path.join(folder,spec.id+'.patched.js'),patched)}
  }
 }finally{fs.closeSync(input)}
 for(const [entry,file]of Object.entries(manifest.addedArchiveEntries))if(sidebar||!entry.includes('chat-history-filter'))replacements.set(entry,asset(file));
 const built=writeArchive(archive,path.join(output,'app.asar'),replacements);
 const binary=fs.readFileSync(exe),needle=Buffer.from(built.oldHeader),offset=binary.indexOf(needle);
 if(manifest.runtimeKind==='owl'){
  assert.equal(fileHash(path.join(source,'owl-shell-runtime.json')),manifest.owlRuntimeDescriptorSHA256,'Unsupported Owl runtime descriptor');
  assert.equal(fileHash(path.join(source,'resources','owl-app.ini')),manifest.owlAppConfigSHA256,'Unsupported Owl app configuration');
  assert.equal(offset,-1,'Unexpected legacy executable integrity record in Owl runtime');
 }else{
  assert.ok(offset>=0&&binary.indexOf(needle,offset+1)<0,'Unexpected executable integrity record');Buffer.from(built.header).copy(binary,offset);
 }
 fs.writeFileSync(path.join(output,'ChatGPT.exe'),binary,{flag:'wx'});
 const browser=applyPatch(fs.readFileSync(inside(source,externalSpec.entry)),externalSpec);
 fs.mkdirSync(path.join(output,'external'));
 fs.writeFileSync(path.join(output,'external','browser-service.mjs'),browser);
 fs.writeFileSync(path.join(output,'external','bounded-rollout-reader.mjs'),asset('assets/bounded-rollout-reader.mjs'));
 if(fixtures){fs.writeFileSync(path.join(output,'fixtures','browser.original.js'),fs.readFileSync(inside(source,externalSpec.entry)));fs.writeFileSync(path.join(output,'fixtures','browser.patched.js'),browser)}
 const report={releaseVersion:manifest.releaseVersion,performanceRevision:manifest.performanceRevision,sidebarVersion:sidebar?manifest.sidebarVersion:null,archiveSHA256:fileHash(path.join(output,'app.asar')),executableSHA256:fileHash(path.join(output,'ChatGPT.exe')),archiveHeaderSHA256:built.header,verifiedPackedEntries:built.count,modifiedEntries:[...replacements.keys()],externalFiles:{'browser-service.mjs':sha(browser),'bounded-rollout-reader.mjs':sha(asset('assets/bounded-rollout-reader.mjs'))}};
 const expected=manifest.expectedBuilds?.[sidebar?'full':'performanceOnly'];if(expected)for(const[field,value]of Object.entries(expected))assert.equal(report[field],value,'Unexpected release build: '+field);
 fs.writeFileSync(path.join(output,'build-verification.json'),JSON.stringify(report,null,2)+'\n');
 return report;
}
module.exports={ROOT,manifest,sha,fileHash,inside,asset,archiveHeader,entries,getEntry,readExact,applyPatch,writeArchive,build};
if(require.main===module){try{const args=process.argv.slice(2);assert.equal(args.shift(),'build');const source=args.shift(),output=args.shift();assert.ok(source&&output);console.log(JSON.stringify(build(source,output,{sidebar:!args.includes('--without-sidebar'),fixtures:args.includes('--fixtures')}),null,2))}catch(error){console.error(error.message);process.exitCode=1}}
