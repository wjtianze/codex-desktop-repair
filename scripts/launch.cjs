'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {fileHash,inside,manifest}=require('./patcher.cjs'),{packageInfo,runningClients}=require('./windows.cjs');
function launchEnvironment(runtime,profile,inherited=process.env,verifyHash=fileHash){
 const backend=path.join(runtime,'resources','codex.exe');
 assert.equal(typeof manifest.bundledCodexCliSHA256,'string','The bundled backend hash is missing. Reinstall the repair package.');
 assert.equal(verifyHash(backend),manifest.bundledCodexCliSHA256,'Bundled backend integrity check failed. Reinstall the repair package.');
 const env={...inherited};
 for(const key of Object.keys(env))if(['CODEX_CLI_PATH','CODEX_ELECTRON_USER_DATA_PATH','CODEX_DESKTOP_REPAIR_ROOT','CODEX_DESKTOP_REPAIR_NODE'].includes(key.toUpperCase()))delete env[key];
 const root=path.resolve(runtime,'..','..');
 return{...env,CODEX_DESKTOP_REPAIR_ROOT:root,CODEX_DESKTOP_REPAIR_NODE:path.join(root,'tools','node-'+manifest.bundledNodeSHA256.slice(0,12)+'.exe'),CODEX_CLI_PATH:backend,CODEX_ELECTRON_USER_DATA_PATH:profile};
}
function runningClientState(clients,exe,original){
 const normalize=value=>String(value??'').toLowerCase();
 const mains=clients.filter(p=>!/(?:^|\s)--type(?:=|\s)/.test(String(p.CommandLine??'')));
 return{repaired:mains.some(p=>normalize(p.ExecutablePath)===normalize(exe)),official:mains.some(p=>normalize(p.ExecutablePath)===normalize(original))};
}
function launch({checkOnly=false,diagnose=false}={}){
 const base=path.join(process.env.LOCALAPPDATA,'ChatGPT-PerformanceFix'),metadata=JSON.parse(fs.readFileSync(path.join(base,'installation.json'),'utf8').replace(/^\uFEFF/,''));
 const installed=packageInfo();assert.ok(installed&&installed.Version===metadata.PackageVersion,'The official client version changed. Revalidate the patch before launching.');
 const runtime=path.resolve(metadata.Runtime),expected=path.join(base,manifest.appVersion,'runtime');assert.equal(runtime.toLowerCase(),expected.toLowerCase(),'Runtime path mismatch');
 const exe=path.join(runtime,'ChatGPT.exe');assert.equal(fileHash(exe),metadata.ExecutableSHA256,'Local executable integrity check failed');
 assert.equal(fileHash(path.join(runtime,'resources','app.asar')),metadata.ArchiveSHA256,'Local resource integrity check failed');
 for(const[name,hash]of Object.entries(metadata.ExternalRuntimeHashes||{}))assert.equal(fileHash(inside(runtime,name)),hash,'Browser component integrity check failed');
 const env=launchEnvironment(runtime,metadata.Profile);
 if(checkOnly)return{verified:true,releaseVersion:metadata.RepairRelease};
 const original=path.join(installed.InstallLocation,'app','ChatGPT.exe');
 const state=runningClientState(runningClients(),exe,original);
 if(state.official)throw Error('The official desktop client is still running in the background. Quit it from its menu before opening the repaired client.');
 // The verified runtime owns single-instance activation and reopens its window.
 // Do not reject a second launch merely because its main process still exists.
 const profile=path.join(metadata.Profile,'web','Codex'),args=['--user-data-dir='+profile];
 if(diagnose)args.push('--remote-debugging-address=127.0.0.1','--remote-debugging-port=0');
 const child=spawn(exe,args,{cwd:runtime,env,detached:true,stdio:'ignore',windowsHide:false});
 child.on('error',error=>{console.error(error.message);process.exitCode=1});child.unref();
 return{started:true,pid:child.pid,diagnostic:diagnose,activationRequested:state.repaired};
}
module.exports={launch,launchEnvironment,runningClientState};
if(require.main===module){try{console.log(JSON.stringify(launch({checkOnly:process.argv.includes('--check-only'),diagnose:process.argv.includes('--diagnose')})))}catch(error){console.error(error.message);process.exitCode=1}}
