const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const shell=fs.readFileSync('build/fixtures/render/patches/panel-shell.js','utf8');
function scene(routeKind,roots=[]){
 const calls=[],scope={value:{routeKind,conversationId:'source'},get:()=>({danger(){}})};
 const token=new Proxy({},{get:(_,k)=>k}),G={tabs$:'right'},O={tabs$:'bottom'};
 const values={right:[],bottom:[],Qe:null,lt:{id:'local',display_name:'Local'},D:{kind:'none',cwd:null},yi:roots};
 const ctx={rt:"chatIcon",In:"browserIcon",Qr:"reviewIcon",ur:"terminalIcon",Bt:()=>"file",x:"current-host",zr:"zr",ui:"ui",L:"shortcuts",uo:{c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))},c:()=>scope,W:'scope',Ue:()=>({formatMessage:p=>p.defaultMessage}),P:key=>values[key]??null,Gn:()=>({status:'allowed'}),U:G,xi:O,z:key=>key==='zr'?{isCapable:true}:key==="po"?[]:key==="gt"?'projectless':key==="kt"?'local':null,jr:()=>true,Lt:true,Kt:()=>null,Ze:()=>false,Yi:()=>false,so(){},lo(){},co(){},le:()=> 'file',fo:{jsx:(type,props)=>({type,props})},Wt:'fileIcon',ii:'chatIcon',Xn:'browserIcon',Ar:'reviewIcon',$e:'terminalIcon',bi:'toolIcon',a:{dropDestinations:['right']},Aa:{dropDestinations:['right']},ia:{dropDestinations:['right']},si:{dropDestinations:['right']},Vi:{dropDestinations:['right']},_n:{dropDestinations:['right']},mo:{},Oa:(...args)=>{calls.push(['chat',...args]);return Promise.resolve('new')},Ta:'chat-content',na:(...args)=>{calls.push(['browser',...args]);return 'tab'},et:(...args)=>calls.push(['file',...args]),__localPanelRpc:async()=>({file:{path:'C:/synthetic.txt'}}),He:{error(){}}};
 for(const key of ["Qe","lt","D","yi","po",'d',"gt",'v',"Ft","Fe","kt","Oi",'j',"io","ca","qe","lr"])ctx[key]=key;
 const start=shell.indexOf('function oo('),end=shell.indexOf('function ',start+10),render=vm.runInNewContext(shell.slice(start,end)+';oo',ctx);
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
