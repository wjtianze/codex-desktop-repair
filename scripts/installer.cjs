'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {ROOT,manifest,fileHash,build}=require('./patcher.cjs'),transaction=require('./transaction.cjs'),windows=require('./windows.cjs');
function read(file){return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))}
// This supported MSIX package explicitly disables file-system write virtualization.
function resolveProfile(prior,appData=process.env.APPDATA){return typeof prior?.Profile==='string'&&path.isAbsolute(prior.Profile)?prior.Profile:path.join(appData,'Codex')}
function clientClosed(source,base){const wanted=[path.join(source,'ChatGPT.exe'),path.join(base,manifest.appVersion,'runtime','ChatGPT.exe')].map(x=>x.toLowerCase()),prefix=(path.resolve(base)+path.sep).toLowerCase();if(windows.runningClients().some(p=>{const exe=String(p.ExecutablePath).toLowerCase();return wanted.includes(exe)||exe.startsWith(prefix)}))throw Error('Save any unsent content and quit ChatGPT before running the installer.')}
function locked(base,fn){fs.mkdirSync(base,{recursive:true});const directory=path.join(base,'install-running');try{fs.mkdirSync(directory)}catch{throw Error('Another installation is running, or the previous installation was interrupted. Keep the backups and inspect the process record in install-running.')}fs.writeFileSync(path.join(directory,'owner.json'),JSON.stringify({pid:process.pid,time:new Date().toISOString()}));try{return fn()}finally{fs.unlinkSync(path.join(directory,'owner.json'));fs.rmdirSync(directory)}}
function main(){
 const args=process.argv.length>2?process.argv.slice(2):(process.env.DESKTOP_REPAIR_ARGS||'install').trim().split(/\s+/);
 const action=args.shift()||'install',flags=new Set(args);
 assert.ok(['install','check','uninstall','build'].includes(action),'Unknown action');
 for(const flag of flags)assert.ok(['--without-sidebar','--no-launch'].includes(flag),'Unknown argument: '+flag);
 const sidebar=!flags.has('--without-sidebar'),base=path.join(process.env.LOCALAPPDATA,'ChatGPT-PerformanceFix'),stateFile=path.join(base,'repair-state.json');
 if(action==='uninstall'){
  if(!fs.existsSync(stateFile)){console.log('No installation record from this project was found. Nothing to restore.');return}
  const meta=read(path.join(base,'installation.json'));clientClosed(windows.packageInfo()?.InstallLocation?path.join(windows.packageInfo().InstallLocation,'app'):meta.Runtime,base);
  locked(base,()=>{let count=0;const seen=new Set();while(fs.existsSync(stateFile)){const state=read(stateFile);assert.ok(count<128&&!seen.has(state.transaction),'Recovery records contain a cycle or exceed the per-run recovery limit');seen.add(state.transaction);const result=transaction.rollback(state.transaction,{allowExternalChanges:true});count++;console.log('Restored one installation record; backup retained: '+result.backupDirectory);if(result.skippedExternal)console.log('Some browser components changed after installation; their current files were preserved.')}console.log('Restore complete. Chat and account data were preserved, and backups remain on this computer.')});return;
 }
 const info=windows.packageInfo();assert.ok(info,'Install the official OpenAI.Codex app from the Microsoft Store first.');
 assert.ok(info.Version===manifest.packageVersion&&info.Architecture.toLowerCase()==='x64','Unsupported version. This patch supports only Windows x64 Store package '+manifest.packageVersion+'; the client was not modified.');
 const source=path.join(info.InstallLocation,'app');
 for(const [relative,hash]of[['ChatGPT.exe',manifest.originalExecutableSHA256],['resources/app.asar',manifest.originalArchiveSHA256],['resources/cua_node/bin/node.exe',manifest.bundledNodeSHA256]])assert.equal(fileHash(path.join(source,relative)),hash,'Official file version or integrity mismatch: '+relative);
 assert.equal(windows.signature(path.join(source,'ChatGPT.exe')),'Valid','The official client signature check failed.');
 const browserSpec=manifest.files.find(f=>f.id==='browser');
 for(const kind of['browser','chrome'])assert.equal(fileHash(path.join(source,'resources','plugins','openai-bundled','plugins',kind,'scripts','browser-service.mjs')),browserSpec.originalSHA256);
 if(action==='check'){console.log('Environment check passed: Windows x64, app '+manifest.appVersion+'; official signature and file integrity verified.');return}
 if(action==='install')clientClosed(source,base);
 locked(base,()=>{
  if(action==='install'&&fs.existsSync(stateFile)){const previous=read(path.join(base,'installation.json')),state=read(stateFile);if(previous.RepairRelease===manifest.releaseVersion&&Boolean(previous.SidebarPlugin)===sidebar){const check=transaction.verify(state.transaction,{allowExternalChanges:true});if(check.failures.length)throw Error('Installed repair files have changed. Run Uninstall-Restore.cmd and review its messages first.');if(!check.changedExternal.length){console.log('This version is already installed and verified.');if(!flags.has('--no-launch'))require('./launch.cjs').launch();return}}}
  if(fs.statfsSync(base).bavail*fs.statfsSync(base).bsize<3*1024**3)throw Error('At least 3 GB of free disk space is required.');
  const staging=path.join(base,'staging',crypto.randomUUID());fs.mkdirSync(staging,{recursive:true});
  const output=path.join(staging,'full');console.log('Building the patch and verifying each resource...');
  const report=build(source,output,{sidebar});console.log('Verified '+report.verifiedPackedEntries+' resource files.');
  if(action==='build'){console.log('Build complete: '+output);return}
  let performanceOutput=null;
  if(fs.existsSync(path.join(base,'backups','before-sidebar-filter-v1','installation.json'))){performanceOutput=path.join(staging,'performance-only');build(source,performanceOutput,{sidebar:false})}
  const shortcutSource=path.join(staging,'ChatGPT.lnk'),shortcut=path.join(process.env.APPDATA,'Microsoft','Windows','Start Menu','Programs','ChatGPT.lnk');
  windows.shortcut(shortcutSource,path.join(base,'Start-ChatGPT-Fixed.cmd'),path.join(base,manifest.appVersion,'runtime','ChatGPT.exe'));
  const shortcutPeers=[],pinned=path.join(process.env.APPDATA,'Microsoft','Internet Explorer','Quick Launch','User Pinned','TaskBar','Codex.lnk');
  if(fs.existsSync(pinned))shortcutPeers.push({source:shortcutSource,target:pinned});
  const priorMeta=fs.existsSync(path.join(base,'installation.json'))?read(path.join(base,'installation.json')):null;
  const profile=resolveProfile(priorMeta);
  clientClosed(source,base);assert.equal(windows.packageInfo().Version,manifest.packageVersion,'The official client updated during the build. Installation was stopped.');
  const result=transaction.install({base,source,output,performanceOutput,profile,codexHome:process.env.CODEX_HOME||path.join(process.env.USERPROFILE,'.codex'),staging,repo:ROOT,shortcut,shortcutSource,shortcutPeers});
  console.log('Installation complete: '+result.verifiedOperations+' file checks passed. Launch ChatGPT from the Start menu.');
  if(result.skippedExternal)console.log('Some browser caches have a different version and were preserved; the local runtime copy contains the repaired components.');
  if(!flags.has('--no-launch'))require('./launch.cjs').launch();
 });
}
module.exports={main,locked,clientClosed,resolveProfile};
if(require.main===module){try{main()}catch(error){console.error(error.message);process.exitCode=1}}
