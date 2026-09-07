'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),output=path.join(root,'build','results');fs.mkdirSync(output,{recursive:true});
const tests=['reader.mjs','composer.mjs','sidebar.mjs','transaction.cjs','patcher.cjs'];
if(process.argv.includes('--installed')){
 const info=require('../scripts/windows.cjs').packageInfo();if(!info)throw Error('Official Windows client is required for installed-source tests');
 require('./prepare-fixtures.cjs').prepare(path.join(info.InstallLocation,'app'));tests.push('core.cjs','tracker.cjs','cold.cjs','title.cjs','host-title.cjs');
}
const results=[];
for(const test of tests){const result=spawnSync(process.execPath,[path.join(__dirname,test)],{encoding:'utf8',cwd:root,maxBuffer:8*1024*1024});const text=(result.stdout||'')+(result.stderr||'');fs.writeFileSync(path.join(output,test+'.log'),text);const passed=result.status===0;results.push({test,passed,cases:(text.match(/^PASS /gm)||[]).length});console.log((passed?'PASS ':'FAIL ')+test+' ('+results.at(-1).cases+' cases)');if(!passed){console.error(text);process.exitCode=1}}
fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify({node:process.version,installedSource:process.argv.includes('--installed'),passed:results.every(r=>r.passed),suites:results,cases:results.reduce((sum,r)=>sum+r.cases,0)},null,2));

