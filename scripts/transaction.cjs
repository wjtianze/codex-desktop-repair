'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{manifest,fileHash,inside}=require('./patcher.cjs');
const nowId=()=>new Date().toISOString().replace(/[:.]/g,'-');
function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))}
function writeJson(file,value){fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n')}
function existsHash(file){return fs.existsSync(file)?fileHash(file):null}
function under(root,file){const rel=path.relative(path.resolve(root),path.resolve(file));return rel!==''&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)}
function atomicCopy(source,target){fs.mkdirSync(path.dirname(target),{recursive:true});const temporary=target+'.repair-'+process.pid;assert.ok(!fs.existsSync(temporary));try{fs.copyFileSync(source,temporary,fs.constants.COPYFILE_EXCL);fs.renameSync(temporary,target)}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary)}}
function save(journal,file){writeJson(file,journal)}
function validateJournal(file,journal){
 const base=path.resolve(journal.base);assert.ok(under(path.join(base,'backups'),file),'Invalid transaction location');
 for(const op of journal.operations){assert.ok(under(path.dirname(file),op.backup),'Invalid backup');const allowed=under(base,op.target)||op.target===journal.shortcut||journal.allowedExternal.includes(op.target);assert.ok(allowed,'Invalid rollback target')}
 if(journal.runtimeCreated)assert.equal(journal.runtime,path.join(base,manifest.appVersion,'runtime'));
 if(journal.cache){assert.equal(journal.cache,path.join(journal.profile,'web','Codex','Default','Cache'));assert.ok(under(path.dirname(file),journal.cacheBackup))}
}
function verify(file,{allowExternalChanges=false}={}){
 const journal=readJson(file);validateJournal(file,journal);const failures=[],changedExternal=[];
 for(const op of journal.operations){if(existsHash(op.target)!==op.newSHA256){if(allowExternalChanges&&op.optional)changedExternal.push(op.target);else failures.push(op.target)}}
 return{journal,failures,changedExternal};
}
function rollback(file,{allowExternalChanges=false}={}){
 const journal=readJson(file);validateJournal(file,journal);
 if(journal.status==='rolled-back')return{restored:true,alreadyRestored:true,backupDirectory:path.dirname(file)};
 const selected=[],skipped=[];
 const changedDirs=new Set(journal.operations.filter(op=>op.optional&&![op.oldSHA256,op.newSHA256].includes(existsHash(op.target))).map(op=>path.dirname(op.target)));
 for(const op of journal.operations){
  if(allowExternalChanges&&op.optional&&changedDirs.has(path.dirname(op.target))){skipped.push(op.target);continue}
  const current=existsHash(op.target);
  if(current!==op.newSHA256&&current!==op.oldSHA256){if(allowExternalChanges&&op.optional){skipped.push(op.target);continue}throw Error('File changed after installation; recovery stopped: '+op.target)}
  if(op.existed)assert.equal(existsHash(op.backup),op.oldSHA256,'Backup integrity mismatch');
  selected.push(op);
 }
 for(const op of selected.reverse()){
  if(op.existed)atomicCopy(op.backup,op.target);
  else if(existsHash(op.target)===op.newSHA256)fs.unlinkSync(op.target);
 }
 if(journal.cacheMoved&&fs.existsSync(journal.cacheBackup)){
  if(fs.existsSync(journal.cache)){const preserved=inside(path.dirname(file),'http-cache-after-uninstall');assert.ok(!fs.existsSync(preserved));fs.renameSync(journal.cache,preserved)}
  fs.mkdirSync(path.dirname(journal.cache),{recursive:true});fs.renameSync(journal.cacheBackup,journal.cache);
 }
 if(journal.runtimeCreated&&fs.existsSync(journal.runtime)){
  const preserved=inside(path.dirname(file),'removed-runtime');assert.ok(!fs.existsSync(preserved));fs.renameSync(journal.runtime,preserved);
 }
 journal.status='rolled-back';journal.restoredAt=new Date().toISOString();journal.skippedExternal=skipped;save(journal,file);
 return{restored:true,skippedExternal:skipped.length,backupDirectory:path.dirname(file)};
}
function installWork(config){
 const base=path.resolve(config.base),runtime=path.join(base,manifest.appVersion,'runtime'),metaFile=path.join(base,'installation.json'),stateFile=path.join(base,'repair-state.json');
 const output=path.resolve(config.output),report=readJson(path.join(output,'build-verification.json')),old=fs.existsSync(metaFile)?readJson(metaFile):null;
 assert.equal(report.releaseVersion,manifest.releaseVersion);
 for(const[name,expected]of[['app.asar',report.archiveSHA256],['ChatGPT.exe',report.executableSHA256]])assert.equal(fileHash(path.join(output,name)),expected);
 if(old){assert.equal(path.resolve(old.Runtime),runtime,'Unexpected existing runtime');assert.equal(existsHash(path.join(runtime,'resources','app.asar')),old.ArchiveSHA256);assert.equal(existsHash(path.join(runtime,'ChatGPT.exe')),old.ExecutableSHA256)}
 else assert.ok(!fs.existsSync(runtime),'Unregistered runtime exists; installation stopped');
 const originalBrowser=manifest.files.find(f=>f.id==='browser').originalSHA256;
 const compatibleBrowser=new Set([originalBrowser,report.externalFiles['browser-service.mjs'],'b35241bad4cddfa42017da10cf8049a25245dabaac2b8bf2dfb9c1e29de04009']);
 const compatibleHelper=new Set([null,report.externalFiles['bounded-rollout-reader.mjs'],'63ed005b9028eaf1046d809422328a1498e02d2872a6af4bcb4d2b8efb7bc92c']);
 const id='release-'+manifest.releaseVersion+'-'+nowId(),backup=path.join(base,'backups',id),journalFile=path.join(backup,'transaction.json');
 fs.mkdirSync(path.join(backup,'files'),{recursive:true});
 let runtimeCreated=false;const pairs=[],skippedExternal=[];
 const add=(source,target,optional=false)=>pairs.push({source:path.resolve(source),target:path.resolve(target),optional});
 // Existing native modules must remain ordinary files in a complete runtime copy.
 if(!old){const staged=path.join(config.staging,'runtime');assert.ok(!fs.existsSync(staged));fs.cpSync(config.source,staged,{recursive:true,force:false,errorOnExist:true,verbatimSymlinks:true});assert.equal(fileHash(path.join(staged,'resources','app.asar')),manifest.originalArchiveSHA256);fs.mkdirSync(path.dirname(runtime),{recursive:true});fs.renameSync(staged,runtime);runtimeCreated=true}
 const externalHashes={};
 for(const kind of['browser','chrome']){
  const folder=path.join(runtime,'resources','plugins','openai-bundled','plugins',kind,'scripts');
  for(const name of['browser-service.mjs','bounded-rollout-reader.mjs']){
   add(path.join(output,'external',name),path.join(folder,name));externalHashes[path.relative(runtime,path.join(folder,name)).split(path.sep).join('/')]=report.externalFiles[name];
  }
  const dirs=[path.join(config.codexHome,'plugins','cache','openai-bundled',kind,manifest.appVersion,'scripts'),path.join(config.codexHome,'.tmp','bundled-marketplaces','openai-bundled','plugins',kind,'scripts')];
  for(const dir of dirs){const browser=path.join(dir,'browser-service.mjs'),helper=path.join(dir,'bounded-rollout-reader.mjs');if(!fs.existsSync(browser))continue;
   if(!compatibleBrowser.has(existsHash(browser))||!compatibleHelper.has(existsHash(helper))){skippedExternal.push(dir);continue}
   add(path.join(output,'external','browser-service.mjs'),browser,true);add(path.join(output,'external','bounded-rollout-reader.mjs'),helper,true);
  }
 }
 const metadata={AppVersion:manifest.appVersion,PackageVersion:manifest.packageVersion,PackageName:manifest.packageName,Runtime:runtime,Profile:path.resolve(config.profile),ArchiveSHA256:report.archiveSHA256,ExecutableSHA256:report.executableSHA256,LocalExecutableModified:true,ArchiveHeaderSHA256:report.archiveHeaderSHA256,PerformancePatchRevision:manifest.performanceRevision,RepairRelease:manifest.releaseVersion,ExternalRuntimeHashes:externalHashes};
 if(report.sidebarVersion)metadata.SidebarPlugin={id:'local.chatgpt.sidebar-history-filter',version:report.sidebarVersion};
 const nextMeta=path.join(config.staging,'installation.json');writeJson(nextMeta,metadata);
 add(path.join(output,'app.asar'),path.join(runtime,'resources','app.asar'));add(path.join(output,'ChatGPT.exe'),path.join(runtime,'ChatGPT.exe'));
 add(path.join(config.repo,'scripts','Start-ChatGPT-Fixed.cmd'),path.join(base,'Start-ChatGPT-Fixed.cmd'));
 add(config.shortcutSource,config.shortcut);
 add(nextMeta,metaFile);
 // Retain compatibility with the previously distributed sidebar-only uninstaller.
 const legacyBackup=path.join(base,'backups','before-sidebar-filter-v1');
 if(fs.existsSync(path.join(legacyBackup,'installation.json'))){
  assert.ok(config.performanceOutput);const pure=readJson(path.join(config.performanceOutput,'build-verification.json'));
  const pureMeta={...metadata,ArchiveSHA256:pure.archiveSHA256,ExecutableSHA256:pure.executableSHA256,ArchiveHeaderSHA256:pure.archiveHeaderSHA256};delete pureMeta.SidebarPlugin;
  const pureMetaFile=path.join(config.staging,'performance-installation.json');writeJson(pureMetaFile,pureMeta);
  add(path.join(config.performanceOutput,'app.asar'),path.join(legacyBackup,'app.asar'));add(path.join(config.performanceOutput,'ChatGPT.exe'),path.join(legacyBackup,'ChatGPT.exe'));add(pureMetaFile,path.join(legacyBackup,'installation.json'));
 }
 for(const name of['patcher.cjs','transaction.cjs','windows.cjs','launch.cjs','installer.cjs'])add(path.join(config.repo,'scripts',name),path.join(base,'repair-tools','scripts',name));
 add(path.join(config.repo,'patch-manifest.json'),path.join(base,'repair-tools','patch-manifest.json'));
 add(path.join(config.repo,'scripts','Uninstall-Fixed.cmd'),path.join(base,'Uninstall-Fixed.cmd'));
 const stateSource=path.join(config.staging,'repair-state.json');writeJson(stateSource,{releaseVersion:manifest.releaseVersion,transaction:journalFile,base});
 add(stateSource,stateFile);
 const operations=pairs.map((op,index)=>{const existed=fs.existsSync(op.target),stored=path.join(backup,'files',String(index).padStart(3,'0')+'.bin'),oldSHA256=existsHash(op.target);if(existed){fs.copyFileSync(op.target,stored);assert.equal(fileHash(stored),oldSHA256)}return{...op,backup:stored,existed,oldSHA256,newSHA256:fileHash(op.source)}});
 const journal={status:'prepared',base,runtime,runtimeCreated,profile:path.resolve(config.profile),shortcut:path.resolve(config.shortcut),allowedExternal:operations.filter(op=>op.optional).map(op=>op.target),operations,createdAt:new Date().toISOString(),skippedExternal};
 journal.cache=path.join(journal.profile,'web','Codex','Default','Cache');journal.cacheBackup=path.join(backup,'http-cache');save(journal,journalFile);validateJournal(journalFile,journal);
 const completed=[];
 try{
  for(const op of operations){assert.equal(existsHash(op.target),op.oldSHA256,'Installation target changed');assert.equal(fileHash(op.source),op.newSHA256);atomicCopy(op.source,op.target);completed.push(op);assert.equal(fileHash(op.target),op.newSHA256)}
  if(fs.existsSync(journal.cache)){assert.ok(!fs.existsSync(journal.cacheBackup));fs.renameSync(journal.cache,journal.cacheBackup);journal.cacheMoved=true}
  journal.status='applied';save(journal,journalFile);
 }catch(error){
  for(const op of completed.reverse()){if(op.existed)atomicCopy(op.backup,op.target);else if(existsHash(op.target)===op.newSHA256)fs.unlinkSync(op.target)}
  if(runtimeCreated&&fs.existsSync(runtime))fs.renameSync(runtime,path.join(backup,'failed-runtime'));
  journal.status='failed-and-restored';journal.error=error.message;save(journal,journalFile);throw error;
 }
 const result=verify(journalFile);assert.deepEqual(result.failures,[]);
 return{installed:true,releaseVersion:manifest.releaseVersion,verifiedOperations:operations.length,skippedExternal:skippedExternal.length,transaction:journalFile};
}
function install(config){
 const base=path.resolve(config.base),runtime=path.join(base,manifest.appVersion,'runtime'),existed=fs.existsSync(runtime);
 try{return installWork(config)}catch(error){
  if(!existed&&fs.existsSync(runtime)&&!fs.existsSync(path.join(base,'installation.json'))){const backup=path.join(base,'backups','failed-preparation-'+nowId());fs.mkdirSync(backup,{recursive:true});fs.renameSync(runtime,path.join(backup,'runtime'))}
  throw error;
 }
}
module.exports={install,rollback,verify,readJson,atomicCopy};
if(require.main===module){try{const[action,file]=process.argv.slice(2);let result;if(action==='install')result=install(readJson(file));else if(action==='rollback')result=rollback(file,{allowExternalChanges:true});else if(action==='verify'){const r=verify(file,{allowExternalChanges:true});result={status:r.journal.status,failures:r.failures,changedExternal:r.changedExternal};if(r.failures.length)process.exitCode=1}else throw Error('Unknown action');console.log(JSON.stringify(result,null,2))}catch(error){console.error(error.stack);process.exitCode=1}}

