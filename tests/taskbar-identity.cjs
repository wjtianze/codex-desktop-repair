'use strict';
const assert=require('node:assert/strict'),taskbar=require('../assets/local-taskbar-v1.cjs'),shortcut=require('../scripts/shortcut-identity.cjs');
const root='C:\\Users\\fixture\\AppData\\Local\\ChatGPT-PerformanceFix',node=root+'\\tools\\node-123456abcdef.exe',executable=root+'\\26.911.61220\\runtime\\ChatGPT.exe';
const metadata=taskbar.details({root,node,executable});assert.equal(metadata.appId,shortcut.APP_ID);assert.equal(metadata.appIconPath,executable);assert.equal(metadata.relaunchDisplayName,'ChatGPT');assert.equal(metadata.relaunchCommand,'"'+node+'" "'+root+'\\repair-tools\\scripts\\launch.cjs"');
console.log('PASS Window and shortcut share a version-independent taskbar identity and verified-launcher command');
let actual;assert.equal(taskbar.configure({setAppDetails:x=>actual=x},{platform:'win32',env:{CODEX_DESKTOP_REPAIR_ROOT:root,CODEX_DESKTOP_REPAIR_NODE:node},executable}),true);assert.deepEqual(actual,metadata);
console.log('PASS Repaired Windows windows receive taskbar metadata without restarting the application');
for(const candidate of ['C:\\outside\\node-123456abcdef.exe',root+'\\tools\\cmd.exe'])assert.throws(()=>taskbar.details({root,node:candidate,executable}),/installed repair runtime/);
assert.equal(taskbar.configure({}, {platform:'linux',env:{}}),false);assert.equal(taskbar.configure({}, {platform:'win32',env:{}}),false);
console.log('PASS Unconfigured test windows and foreign launchers do not acquire the repaired app identity');
for(const length of [4,8]){const handle=Buffer.alloc(length);handle.writeUInt32LE(54321);let call;const result=taskbar.configure({getNativeWindowHandle:()=>handle},{platform:'win32',env:{CODEX_DESKTOP_REPAIR_ROOT:root,CODEX_DESKTOP_REPAIR_NODE:node},executable,pid:123,writeNative:(...args)=>{call=args;return 'applied'}});assert.equal(result,'applied');assert.equal(call[0],54321n);assert.equal(call[1],123);assert.deepEqual(call[2],metadata);}
console.log('PASS Owl without setAppDetails uses the owner-checked native window-property path');
