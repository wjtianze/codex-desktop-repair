'use strict';
// Small draft snapshots are bound to the exact canonical main-state checkpoint.
// A normal flush still materializes the native file and its native backup.
const fs=require('node:fs'),crypto=require('node:crypto');
const cache=new Map(),atomKey='electron-persisted-atom-state';
const keys=['composer-prompt-drafts-v2','composer-prompt-drafts-v1'];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const fileName=file=>file+'.drafts-v1.json';
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function split(state,serialize){
 const atoms=state.get(atomKey);
 if(!object(atoms))return null;
 const rest={...atoms},drafts={};
 for(const key of keys){if(Object.hasOwn(rest,key)){drafts[key]=rest[key];delete rest[key]}}
 const projected=new Map(state);projected.set(atomKey,rest);
 return {stable:serialize(projected),drafts};
}
function remember(file,state,serialize){
 const part=split(state,serialize),base=hash(serialize(state));
 cache.set(file,{base,stable:part?.stable??null,lastDrafts:JSON.stringify(part?.drafts??{})});
}
function restore(file,state,serialize){
 remember(file,state,serialize);
 const current=cache.get(file);
 for(const candidate of [fileName(file),fileName(file)+'.bak']){
  let saved;try{saved=JSON.parse(fs.readFileSync(candidate,'utf8'))}catch(error){if(error.code==='ENOENT')continue;continue}
  if(saved?.version!==1||saved.base!==current.base||!object(saved.drafts)||Object.keys(saved.drafts).some(key=>!keys.includes(key))||saved.checksum!==hash(JSON.stringify(saved.drafts)))continue;
  const atoms=state.get(atomKey);if(!object(atoms))return state;
  const next={...atoms};for(const key of keys)delete next[key];Object.assign(next,saved.drafts);
  state.set(atomKey,next);current.lastDrafts=JSON.stringify(saved.drafts);break;
 }
 return state;
}
async function persist(file,state,writeAtomic,serialize){
 const part=split(state,serialize),prior=cache.get(file);
 if(part&&prior&&part.stable===prior.stable){
  const drafts=JSON.stringify(part.drafts);if(drafts===prior.lastDrafts)return;
  const payload=JSON.stringify({version:1,base:prior.base,drafts:part.drafts,checksum:hash(drafts)});
  await writeAtomic(fileName(file),payload);await writeAtomic(fileName(file)+'.bak',payload);
  prior.lastDrafts=drafts;return;
 }
 const text=serialize(state);
 try{await writeAtomic(file,text);await writeAtomic(file+'.bak',text)}catch(error){cache.delete(file);throw error}
 remember(file,new Map(Object.entries(JSON.parse(text))),serialize);
}
async function checkpoint(file,state,writeAtomic,serialize){
 const text=serialize(state);
 try{await writeAtomic(file,text);await writeAtomic(file+'.bak',text)}catch(error){cache.delete(file);throw error}
 remember(file,new Map(Object.entries(JSON.parse(text))),serialize);
}
function checkpointSync(file,state,writeAtomic,serialize){
 const text=serialize(state);
 try{writeAtomic(file,text);writeAtomic(file+'.bak',text)}catch(error){cache.delete(file);throw error}
 remember(file,new Map(Object.entries(JSON.parse(text))),serialize);
}
module.exports={restore,persist,checkpoint,checkpointSync};
