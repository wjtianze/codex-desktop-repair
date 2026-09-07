'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {ROOT,manifest,fileHash,build}=require('./patcher.cjs'),transaction=require('./transaction.cjs'),windows=require('./windows.cjs');
function read(file){return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))}
function clientClosed(source,base){const wanted=[path.join(source,'ChatGPT.exe'),path.join(base,manifest.appVersion,'runtime','ChatGPT.exe')].map(x=>x.toLowerCase());if(windows.runningClients().some(p=>wanted.includes(String(p.ExecutablePath).toLowerCase())))throw Error('请先保存未发送的内容并退出 ChatGPT，再运行安装程序。')}
function locked(base,fn){fs.mkdirSync(base,{recursive:true});const directory=path.join(base,'install-running');try{fs.mkdirSync(directory)}catch{throw Error('已有安装程序运行，或上次安装被中断。请保留备份并检查 install-running 中的进程记录。')}fs.writeFileSync(path.join(directory,'owner.json'),JSON.stringify({pid:process.pid,time:new Date().toISOString()}));try{return fn()}finally{fs.unlinkSync(path.join(directory,'owner.json'));fs.rmdirSync(directory)}}
function main(){
 const args=process.argv.length>2?process.argv.slice(2):(process.env.DESKTOP_REPAIR_ARGS||'install').trim().split(/\s+/);
 const action=args.shift()||'install',flags=new Set(args);
 assert.ok(['install','check','uninstall','build'].includes(action),'未知操作');
 for(const flag of flags)assert.ok(['--without-sidebar','--no-launch'].includes(flag),'未知参数：'+flag);
 const sidebar=!flags.has('--without-sidebar'),base=path.join(process.env.LOCALAPPDATA,'ChatGPT-PerformanceFix'),stateFile=path.join(base,'repair-state.json');
 if(action==='uninstall'){
  if(!fs.existsSync(stateFile)){console.log('没有本仓库生成的安装记录，无需恢复。');return}
  const meta=read(path.join(base,'installation.json'));clientClosed(windows.packageInfo()?.InstallLocation?path.join(windows.packageInfo().InstallLocation,'app'):meta.Runtime,base);
  locked(base,()=>{let count=0;const seen=new Set();while(fs.existsSync(stateFile)){const state=read(stateFile);assert.ok(count<20&&!seen.has(state.transaction),'恢复记录存在循环');seen.add(state.transaction);const result=transaction.rollback(state.transaction,{allowExternalChanges:true});count++;console.log('已恢复一份安装记录；保留备份：'+result.backupDirectory);if(result.skippedExternal)console.log('部分浏览器组件在安装后已变更，已保留当前文件。')}console.log('恢复完成。聊天和账号数据未清除，备份仍保留在本地。')});return;
 }
 const info=windows.packageInfo();assert.ok(info,'请先安装微软商店中的官方 OpenAI.Codex 客户端。');
 assert.ok(info.Version===manifest.packageVersion&&info.Architecture.toLowerCase()==='x64','版本不匹配。本补丁仅适配 Windows x64 商店包 '+manifest.packageVersion+'，未修改客户端。');
 const source=path.join(info.InstallLocation,'app');
 for(const [relative,hash]of[['ChatGPT.exe',manifest.originalExecutableSHA256],['resources/app.asar',manifest.originalArchiveSHA256],['resources/cua_node/bin/node.exe',manifest.bundledNodeSHA256]])assert.equal(fileHash(path.join(source,relative)),hash,'官方文件版本或完整性不匹配：'+relative);
 assert.equal(windows.signature(path.join(source,'ChatGPT.exe')),'Valid','官方客户端签名校验失败。');
 const browserSpec=manifest.files.find(f=>f.id==='browser');
 for(const kind of['browser','chrome'])assert.equal(fileHash(path.join(source,'resources','plugins','openai-bundled','plugins',kind,'scripts','browser-service.mjs')),browserSpec.originalSHA256);
 if(action==='check'){console.log('环境检查通过：Windows x64，客户端 '+manifest.appVersion+'，官方签名和文件校验通过。');return}
 if(action==='install')clientClosed(source,base);
 locked(base,()=>{
  if(action==='install'&&fs.existsSync(stateFile)){const previous=read(path.join(base,'installation.json')),state=read(stateFile);if(previous.RepairRelease===manifest.releaseVersion&&Boolean(previous.SidebarPlugin)===sidebar){const check=transaction.verify(state.transaction,{allowExternalChanges:true});if(check.failures.length)throw Error('现有修复文件发生变化，请先运行卸载恢复并检查提示。');if(!check.changedExternal.length){console.log('相同版本已安装并通过校验。');if(!flags.has('--no-launch'))require('./launch.cjs').launch();return}}}
  if(fs.statfsSync(base).bavail*fs.statfsSync(base).bsize<3*1024**3)throw Error('可用磁盘空间不足 3 GB。');
  const staging=path.join(base,'staging',crypto.randomUUID());fs.mkdirSync(staging,{recursive:true});
  const output=path.join(staging,'full');console.log('正在生成补丁并逐项校验资源……');
  const report=build(source,output,{sidebar});console.log('已校验 '+report.verifiedPackedEntries+' 个资源文件。');
  if(action==='build'){console.log('构建完成：'+output);return}
  let performanceOutput=null;
  if(fs.existsSync(path.join(base,'backups','before-sidebar-filter-v1','installation.json'))){performanceOutput=path.join(staging,'performance-only');build(source,performanceOutput,{sidebar:false})}
  const shortcutSource=path.join(staging,'ChatGPT.lnk'),shortcut=path.join(process.env.APPDATA,'Microsoft','Windows','Start Menu','Programs','ChatGPT.lnk');
  windows.shortcut(shortcutSource,path.join(base,'Start-ChatGPT-Fixed.cmd'),path.join(base,manifest.appVersion,'runtime','ChatGPT.exe'));
  const profile=path.join(process.env.LOCALAPPDATA,'Packages',info.PackageFamilyName,'LocalCache','Roaming','Codex');
  clientClosed(source,base);assert.equal(windows.packageInfo().Version,manifest.packageVersion,'客户端在构建期间已更新，已停止安装。');
  const result=transaction.install({base,source,output,performanceOutput,profile,codexHome:process.env.CODEX_HOME||path.join(process.env.USERPROFILE,'.codex'),staging,repo:ROOT,shortcut,shortcutSource});
  console.log('安装完成，'+result.verifiedOperations+' 项文件校验通过。请从开始菜单的 ChatGPT 启动。');
  if(result.skippedExternal)console.log('部分浏览器缓存版本不同，已保留原文件；本地运行副本的组件已修复。');
  if(!flags.has('--no-launch'))require('./launch.cjs').launch();
 });
}
module.exports={main,locked,clientClosed};
if(require.main===module){try{main()}catch(error){console.error(error.message);process.exitCode=1}}

