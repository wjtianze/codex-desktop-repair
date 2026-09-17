'use strict';
const path=require('node:path').win32;
const {APP_ID,source}=require('./local-taskbar-interop.cjs');
function details({root,node,executable}){
 if(![root,node,executable].every(v=>typeof v==='string'&&path.isAbsolute(v)&&!v.includes('"')))throw Error('Invalid repair taskbar path');
 if(path.dirname(node).toLowerCase()!==path.join(root,'tools').toLowerCase()||!/^node-[0-9a-f]{12}\.exe$/i.test(path.basename(node)))throw Error('Taskbar launcher must use the installed repair runtime');
 return{appId:APP_ID,appIconPath:executable,appIconIndex:0,relaunchCommand:`"${node}" "${path.join(root,'repair-tools','scripts','launch.cjs')}"`,relaunchDisplayName:'ChatGPT'};
}
function writeWindowProperties(handle,pid,metadata){
 return new Promise((resolve,reject)=>{
  const command="$ErrorActionPreference='Stop';Add-Type -TypeDefinition $env:REPAIR_TASKBAR_TYPE;[RepairShortcutIdentity]::Window([long]$env:REPAIR_TASKBAR_HANDLE,[int]$env:REPAIR_TASKBAR_PID,$env:REPAIR_TASKBAR_ID,$env:REPAIR_TASKBAR_COMMAND,$env:REPAIR_TASKBAR_ICON,'ChatGPT')";
  const child=require('node:child_process').spawn(path.join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-Command',command],{windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,REPAIR_TASKBAR_TYPE:source,REPAIR_TASKBAR_HANDLE:String(handle),REPAIR_TASKBAR_PID:String(pid),REPAIR_TASKBAR_ID:metadata.appId,REPAIR_TASKBAR_COMMAND:metadata.relaunchCommand,REPAIR_TASKBAR_ICON:metadata.appIconPath+',0'}});
  const timer=setTimeout(()=>{child.kill();reject(Error('Taskbar metadata helper timed out'))},10000);timer.unref();
  let error='';child.stderr.on('data',chunk=>{if(error.length<4096)error+=chunk.toString()});child.once('error',e=>{clearTimeout(timer);reject(e)});child.once('exit',code=>{clearTimeout(timer);code===0?resolve(true):reject(Error('Taskbar metadata helper failed: '+error))});
 });
}
function configure(window,{platform=process.platform,env=process.env,executable=process.execPath,writeNative=writeWindowProperties,pid=process.pid}={}){
 if(platform!=='win32'||!env.CODEX_DESKTOP_REPAIR_ROOT)return false;
 const metadata=details({root:env.CODEX_DESKTOP_REPAIR_ROOT,node:env.CODEX_DESKTOP_REPAIR_NODE,executable});
 if(typeof window.setAppDetails==='function'){window.setAppDetails(metadata);return true;}
 const buffer=window.getNativeWindowHandle();if(!Buffer.isBuffer(buffer)||![4,8].includes(buffer.length))throw Error('Invalid native window handle');
 const handle=buffer.length===8?buffer.readBigUInt64LE():BigInt(buffer.readUInt32LE());
 if(handle===0n)return false;
 return writeNative(handle,pid,metadata);
}
module.exports={APP_ID,details,configure};
