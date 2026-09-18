'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {manifest}=require('../scripts/patcher.cjs'),{launchEnvironment,runningClientState}=require('../scripts/launch.cjs');
const originalHash=manifest.bundledCodexCliSHA256;
try{
 manifest.bundledCodexCliSHA256='verified-bundled-backend';
 const runtime=path.resolve('build','launcher-fixture'),profile=path.resolve('build','existing-profile');
 const inherited={Path:'preserved',CODEX_HOME:'custom-home',CODEX_CLI_PATH:'old-backend.exe',codex_cli_path:'other-old.exe',Codex_Electron_User_Data_Path:'old-profile'};
 const before={...inherited};let checked;
 const env=launchEnvironment(runtime,profile,inherited,file=>(checked=file,'verified-bundled-backend'));
 assert.equal(checked,path.join(runtime,'resources','codex.exe'));
 assert.equal(env.CODEX_CLI_PATH,checked);assert.equal(env.CODEX_ELECTRON_USER_DATA_PATH,profile);
 assert.deepEqual(Object.keys(env).filter(k=>k.toUpperCase()==='CODEX_CLI_PATH'),['CODEX_CLI_PATH']);
 assert.equal(env.Path,inherited.Path);assert.equal(env.CODEX_HOME,inherited.CODEX_HOME);assert.deepEqual(inherited,before);
 console.log('PASS Desktop launch pins its verified backend without changing parent environment or profile');
 assert.throws(()=>launchEnvironment(runtime,profile,inherited,()=> 'stale-same-sized-file'),/内置后端校验失败/);
 console.log('PASS Stale or modified bundled backends fail before process creation');
 delete manifest.bundledCodexCliSHA256;
 assert.throws(()=>launchEnvironment(runtime,profile,inherited,()=> 'anything'),/缺少内置后端摘要/);
 console.log('PASS Missing backend integrity metadata cannot silently fall back to an inherited executable');
}finally{if(originalHash===undefined)delete manifest.bundledCodexCliSHA256;else manifest.bundledCodexCliSHA256=originalHash;}
const repaired='C:/repair/runtime/ChatGPT.exe',official='C:/official/ChatGPT.exe';
assert.deepEqual(runningClientState([{ExecutablePath:repaired,CommandLine:'ChatGPT.exe'}],repaired,official),{repaired:true,official:false});
assert.deepEqual(runningClientState([{ExecutablePath:official,CommandLine:'ChatGPT.exe --type=renderer'},{ExecutablePath:'C:/CLI/codex.exe'}],repaired,official),{repaired:false,official:false});
assert.deepEqual(runningClientState([{ExecutablePath:official,CommandLine:'ChatGPT.exe'}],repaired,official),{repaired:false,official:true});
console.log('PASS Same-runtime activation is separated from official main processes, renderer remnants and unrelated CLI sessions');
