const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve('build/results/native-drafts-'+Date.now());fs.mkdirSync(root,{recursive:true});
function native(kind){const s=fs.readFileSync('build/fixtures/render/'+kind+'/state-store.js','utf8'),writes=[],warnings=[];const context={__localDraftPersistence:require('../assets/local-draft-persistence-v1.cjs'),IT:()=>false,FT:new Set(),MT:{},f:fs,p:{...fs.promises,writeFile:async(file,text,...rest)=>{writes.push(Buffer.byteLength(text));return fs.promises.writeFile(file,text,...rest)}},l:path,d:crypto,wT:()=>({warning:(...args)=>warnings.push(args)})};const a=s.indexOf('function LT('),b=s.indexOf('function KT(',a);return {...vm.runInNewContext(s.slice(a,b)+';({read:LT,write:HT,strict:VT})',context),writes,warnings}}
(async()=>{
 for(const kind of ['raw','patches']){
  const n=native(kind),file=path.join(root,kind+'.json');
  fs.writeFileSync(file,JSON.stringify({'prompt-history':'x'.repeat(1024*1024),'electron-persisted-atom-state':{'composer-prompt-drafts-v2':{chat:'old'}}}));
  const state=n.read(file);for(let i=0;i<20;i++){state.set('electron-persisted-atom-state',{'composer-prompt-drafts-v2':{chat:'new-'+i}});await n.write(file,state)}
  const bytes=n.writes.reduce((a,b)=>a+b,0);assert.equal(n.warnings.length,0);assert.ok(kind==='raw'?bytes>40*1024*1024:bytes<20000);assert.equal(n.read(file).get('electron-persisted-atom-state')['composer-prompt-drafts-v2'].chat,'new-19');
  await n.write(file,state,true);assert.equal(JSON.parse(fs.readFileSync(file))['electron-persisted-atom-state']['composer-prompt-drafts-v2'].chat,'new-19');assert.equal(fs.readFileSync(file,'utf8'),fs.readFileSync(file+'.bak','utf8'));
  console.log('PASS '+kind+' native save, cold reload and explicit flush; bytes='+bytes);
 }
 const n=native('patches'),file=path.join(root,'strict.json'),state=new Map([['electron-persisted-atom-state',{'composer-prompt-drafts-v2':{chat:'strict'}}]]);n.strict(file,state);assert.equal(n.read(file).get('electron-persisted-atom-state')['composer-prompt-drafts-v2'].chat,'strict');console.log('PASS Native strict writer and reader retain native format');
})().catch(error=>{console.error(error);process.exitCode=1});
