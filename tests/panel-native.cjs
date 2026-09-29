const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{nativeFunction}=require('./fixtures-support/native-source.cjs');
const source=fs.readFileSync('build/fixtures/render/patches/panel-toggle.js','utf8');
function scene(routeKind,roots=[]){
 const calls=[],scope={value:{routeKind,conversationId:'source'},get:key=>key==="or"?'local':({danger(){}})};
 const values={right:[],bottom:[],ki:{id:'local',display_name:'Local'},vi:{kind:'none',cwd:null},Vi:roots};
 const ctx={Po:{c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))},et:()=>scope,Ze:'scope',ke:()=>({formatMessage:p=>p.defaultMessage}),J:key=>values[key]??null,G:key=>key==="oe"?{isCapable:true}:["Io","Xa","ua"].includes(key)?[]:key==="te"?'local':null,ht:()=>({status:'allowed'}),Y:{tabs$:'right'},Yr:{tabs$:'bottom'},dn:true,Vt:()=>null,xe:()=>false,Va:()=>false,jo:()=>true,No:()=>false,Mo:()=>false,Ao(){},Bi:()=> 'file',Fo:{jsx:(type,props)=>({type,props})},n:{error(){}},console,
 io:(...args)=>{calls.push(['chat',...args]);return Promise.resolve('new')},Qn:(...args)=>{calls.push(['browser',...args]);return'tab'},di:(...args)=>calls.push(['file',...args]),__localPanelRpc:async()=>({file:{path:'C:/synthetic.txt'}})};
 for(const key of ["oi","ki","Io","oe","vi","Vi","Ir","Kt","sn","Pi","te","Ci","ri","Xa","ua","Lt","or","Ka","u","rt","w","s","$t","Le"])ctx[key]=key;
 for(const key of ["vt","ha","Cr","It","rn","Zi"])ctx[key]={dropDestinations:['right']};
 for(const key of ['gr','Ki','Fn','fe','Qt','ct','kn','Do','Za','aa','Ni','Mr','Co','xt','Ye','bt','ft','fr','f'])ctx[key]=key;for(const key of ['_i','no','Jn'])ctx[key]={dropDestinations:['right']};ctx.$t=()=>null;values.Ni={id:'local'};const render=vm.runInNewContext(nativeFunction(source,"ko")+';ko',ctx);
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
