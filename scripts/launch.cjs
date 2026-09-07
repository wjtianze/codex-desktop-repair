'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {fileHash,inside,manifest}=require('./patcher.cjs'),{packageInfo,runningClients}=require('./windows.cjs');
function launch({checkOnly=false,diagnose=false}={}){
 const base=path.join(process.env.LOCALAPPDATA,'ChatGPT-PerformanceFix'),metadata=JSON.parse(fs.readFileSync(path.join(base,'installation.json'),'utf8').replace(/^\uFEFF/,''));
 const installed=packageInfo();assert.ok(installed&&installed.Version===metadata.PackageVersion,'官方客户端版本已改变，请先重新验证补丁。');
 const runtime=path.resolve(metadata.Runtime),expected=path.join(base,manifest.appVersion,'runtime');assert.equal(runtime.toLowerCase(),expected.toLowerCase(),'运行路径不匹配');
 const exe=path.join(runtime,'ChatGPT.exe');assert.equal(fileHash(exe),metadata.ExecutableSHA256,'本地运行文件校验失败');
 assert.equal(fileHash(path.join(runtime,'resources','app.asar')),metadata.ArchiveSHA256,'本地资源校验失败');
 for(const[name,hash]of Object.entries(metadata.ExternalRuntimeHashes||{}))assert.equal(fileHash(inside(runtime,name)),hash,'浏览器组件校验失败');
 if(checkOnly)return{verified:true,releaseVersion:metadata.RepairRelease};
 const original=path.join(installed.InstallLocation,'app','ChatGPT.exe');
 if(runningClients().some(p=>[exe.toLowerCase(),original.toLowerCase()].includes(String(p.ExecutablePath).toLowerCase())))throw Error('ChatGPT 已在运行，请先退出客户端。');
 const profile=path.join(metadata.Profile,'web','Codex'),args=['--user-data-dir='+profile];
 if(diagnose)args.push('--remote-debugging-address=127.0.0.1','--remote-debugging-port=0');
 const child=spawn(exe,args,{cwd:runtime,env:{...process.env,CODEX_ELECTRON_USER_DATA_PATH:metadata.Profile},detached:true,stdio:'ignore',windowsHide:false});
 child.on('error',error=>{console.error(error.message);process.exitCode=1});child.unref();
 return{started:true,pid:child.pid,diagnostic:diagnose};
}
module.exports={launch};
if(require.main===module){try{console.log(JSON.stringify(launch({checkOnly:process.argv.includes('--check-only'),diagnose:process.argv.includes('--diagnose')})))}catch(error){console.error(error.message);process.exitCode=1}}

