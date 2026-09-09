const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const shell=fs.readFileSync('build/fixtures/render/patches/panel-shell.js','utf8');
function scene(routeKind,roots=[]){
 const calls=[],scope={value:{routeKind,conversationId:'source'},get:()=>({danger(){}})};
 const token=new Proxy({},{get:(_,k)=>k}),G={tabs$:'right'},O={tabs$:'bottom'};
 const values={right:[],bottom:[],on:null,Bn:{id:'local',display_name:'Local'},ft:{kind:'none',cwd:null},Mi:roots};
 const ctx={qa:{c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))},vn:()=>scope,H:'scope',s:()=>({formatMessage:p=>p.defaultMessage}),W:key=>values[key]??null,ln:()=>({status:'allowed'}),G,O,q:key=>key==='d'?{isCapable:true}:key==='Ya'?[]:key==='Nn'?'projectless':key==='tn'?'local':null,Oe:()=>true,Ot:true,ni:()=>null,m:()=>false,Xi:()=>false,Wa(){},Ka(){},Ga(){},le:()=> 'file',Ja:{jsx:(type,props)=>({type,props})},An:'fileIcon',ii:'chatIcon',Xn:'browserIcon',Ar:'reviewIcon',$e:'terminalIcon',Tn:'toolIcon',Te:{dropDestinations:['right']},Aa:{dropDestinations:['right']},oa:{dropDestinations:['right']},Mn:{dropDestinations:['right']},Zi:{dropDestinations:['right']},$r:{dropDestinations:['right']},Xa:{},Oa:(...args)=>{calls.push(['chat',...args]);return Promise.resolve('new')},wa:'chat-content',ia:(...args)=>{calls.push(['browser',...args]);return 'tab'},Lr:(...args)=>calls.push(['file',...args]),__localPanelRpc:async()=>({file:{path:'C:/synthetic.txt'}}),c:{error(){}}};
 for(const key of ['on','Bn','ft','Mi','Ya','d','Nn','v','zt','ur','tn','Kt','j','Va','ua','Ai','Ye'])ctx[key]=key;
 const start=shell.indexOf('function Ua('),end=shell.indexOf('function ',start+10),render=vm.runInNewContext(shell.slice(start,end)+';Ua',ctx);
 return {result:render({surface:'panel-launcher',target:'right'}),calls,scope,ctx};
}
(async()=>{
for(const kind of ['home','new-thread-panel','chatgpt-thread','local-thread']){
 const h=scene(kind),actions=h.result.actions;assert.ok(['open-file','side-chat','browser'].every(id=>actions.some(a=>a.id===id)));
 actions.find(a=>a.id==='side-chat').onSelect();await Promise.resolve();const chat=h.calls.find(c=>c[0]==='chat');assert.equal(chat[3].sourceConversationId,kind==='local-thread'?'source':null);assert.equal(chat[3].hostId,'local');
 await actions.find(a=>a.id==='open-file').onSelect();const file=h.calls.find(c=>c[0]==='file');assert.equal(file[2],'C:/synthetic.txt');assert.equal(file[3].target,'right');
 actions.find(a=>a.id==='browser').onSelect();assert.ok(h.calls.some(c=>c[0]==='browser'));
 console.log('PASS '+kind+' offers working browser, file picker and side-chat callbacks');
}
const h=scene('local-thread',['C:/workspace']);await h.result.actions.find(a=>a.id==='open-file').onSelect();assert.equal(h.calls[0][2],null);assert.equal(h.calls[0][3].workspaceRoot,'C:/workspace');console.log('PASS Existing local workspace continues to open its native file tree');
const c=scene('home');c.ctx.__localPanelRpc=async()=>({file:null});await c.result.actions.find(a=>a.id==='open-file').onSelect();assert.equal(c.calls.length,0);console.log('PASS Cancelling file picker does not open a broken tab');
})().catch(e=>{console.error(e);process.exitCode=1});
