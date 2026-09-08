import{renderWebSearchProgress}from'../assets/local-web-search-progress-v1.mjs';
﻿import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../build/fixtures/render');
const jsx=(type,props,key)=>({type,props,key});
function section(s,a,b){const start=s.indexOf(a),end=s.indexOf(b,start);assert.ok(start>=0&&end>start,a);return s.slice(start,end)}
function memo(size){return Array(size).fill(Symbol.for('react.memo_cache_sentinel'))}
function fixture(patched=true){
 const source=fs.readFileSync(path.join(root,patched?'patches':'raw','viewer.js'),'utf8');
 const cache=new Map();const context={ih:{c:n=>{if(!cache.has(n))cache.set(n,memo(n));return cache.get(n)}},Q:{jsx,jsxs:jsx,Fragment:'Fragment'},Y:()=>({data:undefined}),Fn:'Fn',hl:()=>null,__localWebSearchProgress:renderWebSearchProgress,jc:'NativeSearch',la:()=>{}};
 for(const name of['Ec','Zm','Ma','gr','Ue','zo','Xu','Lm'])context[name]=name;
 const render=vm.runInNewContext(section(source,'function Ym(','function Xm(')+';Ym',context);
 const hidden=vm.runInNewContext(section(source,'function Km(','function Ym(')+';Km',{...context,Ym:render});
 const activity=fs.readFileSync(path.join(root,'raw','activity.js'),'utf8');
 const native=section(activity,'function g_(','function y_(');
 let key,instance;
 function disclose(node){
  if(node.type!=='Ec')return{node,body:null};
  if(key!==node.key){key=node.key;instance={cache:memo(37),initialized:false};
   const ctx={x_:{c:()=>instance.cache},S_:{useState:init=>{if(!instance.initialized){instance.state=typeof init==='function'?init():init;instance.initialized=true}return[instance.state,value=>{instance.state=typeof value==='function'?value(instance.state):value}]}},C_:{jsx},f:{div:'Motion'},xc:{},requestAnimationFrame:fn=>fn()};
   for(const name of['y_','da','Xc','ao'])ctx[name]=name;
   instance.render=vm.runInNewContext(native+';g_',ctx);
  }
  const tree=instance.render(node.props);
  return{node,tree,body:tree.props.body,header:tree.props.header,state:instance.state};
 }
 const base={items:[],completed:false,reasoningRecap:null,conversationId:'fixture',localConversationId:'fixture',hostId:'local',isWorkConversation:false,canRenderMcpApps:false,shouldRenderMcpApps:false};
 return{render:(items,extra={})=>disclose(render({...base,items,...extra})),hidden:extra=>hidden({...base,...extra})};
}
const thought=(content='',completed=false)=>({type:'reasoning',presentation:'thought',content,completed});
const cases=[];function test(name,fn){fn();cases.push(name);console.log('PASS '+name)}
test('The original Chat disclosure stays collapsed when the first summary arrives',()=>{const f=fixture(false);assert.equal(f.render([thought()]).body,null);const r=f.render([thought('First summary')]);assert.equal(r.node.props.canExpand,true);assert.equal(r.state,'collapsed');assert.equal(r.body,null)});
test('The repaired Chat disclosure expands on the first available summary',()=>{const f=fixture();assert.equal(f.render([thought()]).body,null);const r=f.render([thought('First summary')]);assert.equal(r.state,'expanded');assert.equal(r.body.props.animate.height,'auto');assert.equal(r.body.props.children.props.children[0].props.children.props.item.content,'First summary')});
test('A conversation mounted with an available summary starts expanded',()=>{const r=fixture().render([thought('Already available')]);assert.equal(r.state,'expanded');assert.ok(r.body)});
test('Manual collapse persists while later summary text streams in',()=>{const f=fixture();f.render([thought()]);let r=f.render([thought('First')]);r.header.props.disclosure.onToggle();r=f.render([thought('First')]);assert.equal(r.state,'closing');r.body.props.onAnimationComplete();r=f.render([thought('First plus more')]);assert.equal(r.state,'collapsed');assert.equal(r.body,null);r.header.props.disclosure.onToggle();r=f.render([thought('First plus more')]);assert.equal(r.state,'expanded')});
test('No summary data keeps the Thinking indicator without an empty expanded body',()=>{const f=fixture();for(let i=0;i<3;i++){const r=f.render([thought()]);assert.equal(r.node.key,'active');assert.equal(r.node.props.summary.type,'Ma');assert.equal(r.node.props.canExpand,false);assert.equal(r.body,null)}});
test('A completed recap follows the original collapsed recap presentation',()=>{const f=fixture();f.render([thought('Streaming')]);const r=f.render([thought('Completed',true)],{completed:true,reasoningRecap:{type:'recap',content:'Thought summary'}});assert.equal(r.node.key,'recap');assert.equal(r.state,'collapsed');assert.equal(r.node.props.summary,'Thought summary')});
test('Work conversations retain their separate native activity route',()=>{const r=fixture().render([thought('Summary')],{isWorkConversation:true});assert.equal(r.node.type,'Zm');assert.equal(r.node.props.items[0].content,'Summary')});
test('The hide_all server instruction continues to suppress the reasoning presentation',()=>{assert.equal(fixture().hidden({items:[thought('Summary')],reasoningRecap:{type:'hide_all'}}),null)});
const search=(complete=false)=>({type:'web-search',completed:complete,query:'quantum cavity',action:{type:'search',queries:['quantum cavity','Purcell effect']},searchResultSources:[{url:'https://example.org/paper',title:'Example research'}]});
test('Streaming search appears inside Thinking before a thought summary exists',()=>{const f=fixture();f.render([thought()]);const r=f.render([search()]);assert.equal(r.state,'expanded');const row=r.body.props.children.props.children[0].props.children;assert.equal(row.props['data-local-web-search'],true);assert.equal(row.props.children[0].props.item.completed,false);assert.equal(row.props.children[2].props.children[0].props.children.props.href,'https://example.org/paper')});
test('Manual collapse persists while search sources update',()=>{const f=fixture();let r=f.render([search()]);r.header.props.disclosure.onToggle();r=f.render([search()]);r.body.props.onAnimationComplete();r=f.render([search(true)]);assert.equal(r.state,'collapsed');assert.equal(r.body,null)});
test('Restricted search source rows contain no actionable external links',()=>{const r=fixture().render([search()],{shouldBlockExternalEgress:true}),row=r.body.props.children.props.children[0].props.children;assert.equal(row.props.children[2].props.children[0].props.children.type,'span')});
fs.writeFileSync(path.join(root,'chat-live-thinking-tests.json'),JSON.stringify({passed:true,cases},null,2));
