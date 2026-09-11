const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../build/fixtures/render'),source=fs.readFileSync(path.join(root,'patches/initial.js'),'utf8'),a=source.indexOf('function $ci('),b=source.indexOf('var eli,',a),calls=[];
const create=vm.runInNewContext(source.slice(a,b)+';$ci',{bA:()=>({}),Ay:()=>({}),Q:{},Jx:()=>({}),Xx:(key,value,delay)=>calls.push({key,value,delay}),eli:250});
const atom={get:()=>({}),set:()=>{}};for(const name of['composer-prompt-drafts-v2','chatgpt-conversation-prompt-drafts-v1','unrelated-state']){const value=create(name);value.setDraft(atom,['fixture'],'最新草稿');assert.equal(calls.at(-1).delay,name==='unrelated-state'?250:750);value.setDraft({get:()=>({fixture:'old'}),set:()=>{}},['fixture'],undefined);assert.equal(calls.at(-1).delay,0)}
console.log('PASS Only composer text drafts use the longer idle delay');console.log('PASS Submit and clear still persist immediately');
const before=calls.length;create('composer-prompt-drafts-v2').setDraft({get:()=>({fixture:'same'}),set:()=>{}},['fixture'],'same');assert.equal(calls.length,before);console.log('PASS Unchanged drafts do not schedule redundant updates');

fs.writeFileSync(path.join(root,'draft-save-tests.json'),JSON.stringify({passed:true,cases:3}));
