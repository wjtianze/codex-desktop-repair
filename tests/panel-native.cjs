const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{nativeFunction}=require('./fixtures-support/native-source.cjs');
const source=fs.readFileSync('build/fixtures/render/patches/panel-actions.js','utf8');
function scene(routeKind,roots=[]){
 const calls=[],scope={value:{routeKind,conversationId:'source'},get:key=>key==="Bn"?'local':({danger(){}})};
 const values={right:[],bottom:[],u:{id:'local',display_name:'Local'},Te:{kind:'none',cwd:null},Je:roots};
 const ctx={Xo:{c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))},Jn:()=>scope,V:'scope',Xt:()=>({formatMessage:p=>p.defaultMessage}),U:key=>values[key]??null,W:key=>key==="On"?{isCapable:true}:["Qo","Ua","Wo"].includes(key)?[]:key==="Un"?'projectless':key==="oi"?'local':null,ui:()=>({status:'allowed'}),H:{tabs$:'right'},ri:{tabs$:'bottom'},ht:()=>false,Fr:true,I:()=>null,ei:()=>false,Oa:()=>true,Yo:()=>false,Jo:()=>false,qo(){},E:()=> 'file',Zo:{jsx:(type,props)=>({type,props})},i:{error(){}},console,
  Ja:(...args)=>{calls.push(["chat",...args]);return Promise.resolve('new')},Ia:(...args)=>{calls.push(['browser',...args]);return'tab'},we:(...args)=>calls.push(["file",...args]),__localPanelRpc:async()=>({file:{path:'C:/synthetic.txt'}})};
 for(const key of ["zt","u","Te","Je","On","Un","Lt","Wn","Kn","oi","Qt","Hn","Tn","Qo","Ua","Wo","Bn","pe","ko","Gi","Qi","Ui","Ji","ra","Ne"])ctx[key]=key;
 for(const key of ["Mt","Ka","Ra","ne","Se","ba"])ctx[key]={dropDestinations:["right"]};
 const render=vm.runInNewContext(nativeFunction(source,"Ko")+';Ko',ctx);
 return{result:render({surface:'panel-launcher',target:'right'}),calls,scope,ctx};
}
(async()=>{
 for(const kind of ['home','new-thread-panel','chatgpt-thread','local-thread']){
  const h=scene(kind),actions=h.result.actions;assert.ok(['open-file','side-chat','browser'].every(id=>actions.some(a=>a.id===id)));
  actions.find(a=>a.id==='side-chat').onSelect();await Promise.resolve();const chat=h.calls.find(c=>c[0]==='chat');assert.equal(chat[3].sourceConversationId,kind==='local-thread'?'source':null);assert.equal(chat[3].hostId,'local');
  await actions.find(a=>a.id==='open-file').onSelect();const file=h.calls.find(c=>c[0]==='file');assert.equal(file[2],'C:/synthetic.txt');assert.equal(file[3].target,'right');
  actions.find(a=>a.id==='browser').onSelect();assert.ok(h.calls.some(c=>c[0]==='browser'));console.log('PASS '+kind+' offers working browser, file picker and side-chat callbacks');
 }
 const h=scene('local-thread',['C:/workspace']);await h.result.actions.find(a=>a.id==='open-file').onSelect();assert.equal(h.calls[0][2],null);assert.equal(h.calls[0][3].workspaceRoot,'C:/workspace');console.log('PASS Existing local workspace continues to open its native file tree');
 const c=scene('home');c.ctx.__localPanelRpc=async()=>({file:null});await c.result.actions.find(a=>a.id==='open-file').onSelect();assert.equal(c.calls.length,0);console.log('PASS Cancelling file picker does not open a broken tab');
})().catch(e=>{console.error(e);process.exitCode=1});
