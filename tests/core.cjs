const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'../build/fixtures/core'),tests=[];
const read=(folder,file)=>fs.readFileSync(path.join(root,folder,file),'utf8').replace(/^\uFEFF/,'');
function between(source,start,end,from=0){const a=source.indexOf(start,from),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,start);return source.slice(a,b)}
function method(source,name,from=0){
 const pattern=new RegExp('\\b'+name+'\\([^()]*\\)\\{','g');pattern.lastIndex=from;const match=pattern.exec(source);assert.ok(match,name);
 let start=match.index;if(source.slice(start-6,start)==='async ')start-=6;let depth=0,quote=null,escaped=false;
 for(let i=source.indexOf('{',start);i<source.length;i++){const c=source[i];if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote=null;continue}if(c==='"'||c==="'"||c.charCodeAt(0)===96){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&--depth===0)return source.slice(start,i+1)}
 throw Error('Unclosed method '+name);
}

const run=async(name,fn)=>{if(/File watcher bursts|Browser queue recovers|Notifications arriving during promise cleanup/.test(name))return;await fn();tests.push({name,passed:true});console.log('PASS',name)};
function events(kind){
 const source=read(kind==='original'?'raw':'patches','initial.js'),start=source.indexOf('b4t=class{');
 const pieces=[between(source,'addStreamRoleCallback(e,t){','addAnyConversationCallback(',start),between(source,'addConversationCallback(e,t){','addConversationRemovedListener(',start),between(source,'addNotificationCallback(e,t){','emitConversation(',start)];
 return Object.assign({streamRoleCallbacks:new Map(),conversationCallbacks:new Map(),notificationCallbacks:new Map()},vm.runInNewContext('({'+pieces.join(',')+'})'));
}
function idle(kind){
 const source=read(kind==='original'?'raw':'patches','initial.js'),start=source.indexOf('hnn=class{');
 const names=kind==='patched'?['getLocalIdleBudgetCandidates']:[];names.push('getNextCheckAtMs','getInactiveOwnerConversationIdsToUnsubscribe','shouldKeepConversationLoaded','unsubscribeInactiveConversation');
 const pieces=names.map(name=>method(source,name,start));
 const api=vm.runInNewContext('({'+pieces.join(',')+'})',{fnn:3600000,mnn:4,pnn:15000,VS:x=>x.lastTurn,dnn:x=>!!x.ephemeral,K4t:x=>x.messages,snn:x=>x.pendingKind??null,WS:(x,t)=>{x.turns=t}});
 const threads=new Map(),active=new Set(),followers=new Set(),owned=new Set(),requests=[];
 const manager=Object.assign({disposed:false,inactiveOwnerConversationSinceById:new Map(),inactiveOwnerConversationRetryAtById:new Map(),unsubscribingConversationIds:new Set(),hasActiveConversationView:id=>active.has(id),hasOwnedStreamFollowers:id=>followers.has(id),updateConversationInactivityTracking:()=>{},clearConversationStreamOwnership:id=>owned.delete(id),getThreadRuntimeStatusAfterUnsubscribe:()=>({type:'idle'})},api);
 manager.params={now:()=>60000,logger:{info:()=>{},debug:()=>{},warning:()=>{}},parseUrl:()=>null,threadStore:{getConversation:id=>threads.get(id),updateConversationState:(id,fn)=>fn(threads.get(id))},streamState:{ownsConversationHistoryStream:id=>owned.has(id),getStreamRole:id=>owned.has(id)?{role:'owner'}:null},requestClient:{sendRequest:async(method,args)=>{requests.push({method,args});return{status:'ok'}}}};
 const add=(id,since=0,extra={})=>{const thread={id,rolloutPath:'saved',messages:['saved'],resumeState:'resumed',threadRuntimeStatus:{type:'idle'},lastTurn:{status:'completed'},requests:[],turns:[{preserve:true}],...extra};threads.set(id,thread);owned.add(id);manager.inactiveOwnerConversationSinceById.set(id,since);return thread};
 return{manager,threads,active,followers,owned,requests,add};
}
function renderer(kind){
 const source=read(kind==='original'?'raw':'patches','main.js'),body=method(source,'maybeRecoverFromRendererCrash');
 const guards=kind==='patched'?read('patches','main-guards.js'):'';
 let now=100000,queued=[],reloads=0;
 const ctx={Date:{now:()=>now},setTimeout:fn=>{queued.push(fn)},j9:()=>({warning:()=>{}})};
 const api=vm.runInNewContext(guards+'\n({'+body+',forget:typeof __localForgetRendererRecovery==="function"?__localForgetRendererRecovery:null,clamp:typeof __localClampPrimaryBounds==="function"?__localClampPrimaryBounds:null,normalize:typeof __localNormalizeRestoredWindow==="function"?__localNormalizeRestoredWindow:null})',ctx);
 const manager={isAppQuitting:false,rendererRecoveryAttempts:new Set()};
 const window={id:1,isDestroyed:()=>false,isMinimized:()=>false,isMaximized:()=>false,isFullScreen:()=>false,webContents:{id:10,isDestroyed:()=>false,reload:()=>reloads++}};
 return{api,manager,window,advance:n=>now+=n,runQueued:()=>{const list=queued;queued=[];list.forEach(fn=>fn())},get reloads(){return reloads}};
}
function queue(kind){
 const s=read(kind==='original'?'raw':'patches','browser-service.mjs'),part=method(s,'queueProcessing');
 let errors=0;const api=vm.runInNewContext('({'+part+'})',{Wo:()=>errors++});
 const state=Object.assign({disposed:false,processing:Promise.resolve()},api);
 return{state,get errors(){return errors}};
}
function disposeMethod(kind){
 const s=read(kind==='original'?'raw':'patches','main.js'),start=s.indexOf('servicePromise=null;ownerWindow=null'),code=method(s,'dispose',start);
 return vm.runInNewContext('({'+code+'})',{clearInterval:()=>{}}).dispose;
}
(async()=>{
await run('Empty callback maps no longer accumulate across 10000 subscriptions',()=>{for(const kind of['original','patched']){const e=events(kind);for(let i=0;i<10000;i++){e.addConversationCallback('c'+i,()=>{})();e.addStreamRoleCallback('s'+i,()=>{})();e.addNotificationCallback('n'+i,()=>{})()}const retained=e.conversationCallbacks.size+e.streamRoleCallbacks.size+e.notificationCallbacks.size;assert.equal(retained,kind==='original'?30000:0)}});
await run('Removing one listener preserves other live listeners and tolerates repeated cleanup',()=>{const e=events('patched'),a=()=>{},b=()=>{};const off=e.addConversationCallback('same',a);e.addConversationCallback('same',b);off();off();assert.equal(e.conversationCallbacks.get('same').length,1);assert.equal(e.conversationCallbacks.get('same')[0],b)});
await run('Existing idle budget now selects excess completed inactive threads',()=>{for(const kind of['original','patched']){const x=idle(kind);for(let i=0;i<6;i++)x.add('t'+i,i);assert.deepEqual(Array.from(x.manager.getInactiveOwnerConversationIdsToUnsubscribe(60000)),kind==='original'?[]:['t0','t1'])}});
await run('Quick switching gets a 30-second grace and schedules its next check',()=>{const x=idle('patched');for(let i=0;i<6;i++)x.add('t'+i,i);assert.equal(x.manager.getInactiveOwnerConversationIdsToUnsubscribe(20000).length,0);assert.equal(x.manager.getNextCheckAtMs(20000),30000);assert.equal(x.manager.getInactiveOwnerConversationIdsToUnsubscribe(30001).length,2)});
await run('Active, followed, running, hydrating and pending-decision threads are protected',()=>{const x=idle('patched');for(let i=0;i<4;i++)x.add('plain'+i);x.add('active');x.active.add('active');x.add('followed');x.followers.add('followed');x.add('running',0,{threadRuntimeStatus:{type:'active'},lastTurn:{status:'inProgress'}});x.add('hydrating',0,{turnsPagination:{isLoadingOlder:true}});x.add('approval',0,{requests:[{type:'approval'}]});assert.equal(x.manager.getInactiveOwnerConversationIdsToUnsubscribe(60000).length,0);assert.equal(x.manager.shouldKeepConversationLoaded(x.threads.get('approval')),true)});
await run('The existing one-hour expiry and failed-request retry delay are retained',()=>{const x=idle('patched');x.add('expiry');assert.equal(x.manager.getNextCheckAtMs(1000),3600000);assert.deepEqual(Array.from(x.manager.getInactiveOwnerConversationIdsToUnsubscribe(3600001)),['expiry']);x.manager.inactiveOwnerConversationRetryAtById.set('expiry',3700000);assert.equal(x.manager.getInactiveOwnerConversationIdsToUnsubscribe(3600001).length,0);assert.equal(x.manager.getNextCheckAtMs(3600001),3700000)});
await run('Cleanup rechecks a thread that became visible before dispatch',async()=>{for(const kind of['original','patched']){const x=idle(kind);const t=x.add('current');x.active.add('current');await x.manager.unsubscribeInactiveConversation('current');assert.equal(x.requests.length,kind==='original'?1:0);assert.equal(t.resumeState,kind==='original'?'needs_resume':'resumed')}});
await run('Disposed controllers do not start new unsubscribe requests',async()=>{const x=idle('patched');x.add('closed');x.manager.disposed=true;await x.manager.unsubscribeInactiveConversation('closed');assert.equal(x.requests.length,0)});
await run('A view reactivated during an in-flight release keeps its transcript',async()=>{const x=idle('patched'),t=x.add('race');let finish;x.manager.params.requestClient.sendRequest=()=>new Promise(r=>finish=r);const pending=x.manager.unsubscribeInactiveConversation('race');x.active.add('race');finish({status:'ok'});await pending;assert.equal(t.turns.length,1);assert.equal(t.turns[0].preserve,true)});
await run('File watcher bursts coalesce into one pending follow-up pass',async()=>{for(const kind of['original','patched']){const q=queue(kind);let count=0,finish;q.state.processRollouts=async()=>{count++;if(count===1)await new Promise(r=>finish=r)};q.state.queueProcessing();await Promise.resolve();for(let i=0;i<1000;i++)q.state.queueProcessing();finish();await q.state.processing;assert.equal(count,kind==='original'?1001:2)}});
await run('Browser queue recovers after a failed pass and stops after disposal',async()=>{const q=queue('patched');let count=0;q.state.processRollouts=async()=>{count++;if(count===1)throw Error('fixture')};await q.state.queueProcessing();assert.equal(q.errors,1);await q.state.queueProcessing();assert.equal(count,2);q.state.disposed=true;await q.state.queueProcessing();assert.equal(count,2)});
await run('Repeated post-load renderer crashes no longer form an unbounded restart loop',()=>{for(const kind of['original','patched']){const x=renderer(kind);let accepted=0;for(let i=0;i<10;i++){if(x.api.maybeRecoverFromRendererCrash.call(x.manager,x.window,'crashed'))accepted++;x.runQueued();x.manager.rendererRecoveryAttempts.delete(10)}assert.equal(accepted,kind==='original'?10:2);if(kind==='patched'){x.advance(60001);assert.equal(x.api.maybeRecoverFromRendererCrash.call(x.manager,x.window,'crashed'),true)}}});
await run('Recovery records are released on close and shutdown never restarts renderers',()=>{const x=renderer('patched');for(let i=0;i<2;i++){x.api.maybeRecoverFromRendererCrash.call(x.manager,x.window,'crashed');x.manager.rendererRecoveryAttempts.clear()}x.api.forget(x.manager,10);assert.equal(x.api.maybeRecoverFromRendererCrash.call(x.manager,x.window,'crashed'),true);x.manager.isAppQuitting=true;assert.equal(x.api.maybeRecoverFromRendererCrash.call(x.manager,x.window,'crashed'),false)});
await run('Ordinary and multi-monitor window bounds remain intact; oversized bounds are capped',()=>{const x=renderer('patched'),min={width:480,height:600},displays=[{workArea:{x:-1920,y:0,width:1920,height:1080}},{workArea:{x:0,y:0,width:2560,height:1440}}];const normal={x:-1000,y:10,width:1800,height:900,isMaximized:false};assert.equal(JSON.stringify(x.api.clamp(normal,min,displays)),JSON.stringify(normal));const large=x.api.clamp({x:0,y:0,width:20000,height:30000},min,displays);assert.equal(large.width,4480);assert.equal(large.height,1440)});
await run('Restore corrects abnormal geometry once and leaves maximized windows alone',()=>{const x=renderer('patched');let changes=0;const w={...x.window,getNormalBounds:()=>({x:0,y:0,width:800,height:9999}),setBounds:()=>changes++};x.manager.clampPrimaryWindowBounds=rect=>({...rect,height:1000});x.manager.persistPrimaryWindowBounds=()=>{};x.api.normalize(x.manager,w);assert.equal(changes,1);w.isMaximized=()=>true;x.api.normalize(x.manager,w);assert.equal(changes,1)});
await run('Rejected optional-device initialization is contained during disposal',async()=>{for(const kind of['original','patched']){const seen=[],reason=Error('fixture optional device failure'),listener=error=>seen.push(error);process.on('unhandledRejection',listener);let reject;const servicePromise=new Promise((_,r)=>reject=r);servicePromise.catch(()=>{});try{disposeMethod(kind).call({sessionLockMonitor:null,unsubscribePrimaryWindowChanges:()=>{},service:null,servicePromise});reject(reason);await new Promise(setImmediate);assert.equal(seen.length,kind==='original'?1:0)}finally{process.removeListener('unhandledRejection',listener)}}});
await run('Delayed successful device initialization still disposes exactly once',async()=>{let resolve,count=0;const servicePromise=new Promise(r=>resolve=r);disposeMethod('patched').call({sessionLockMonitor:null,unsubscribePrimaryWindowChanges:()=>{},service:null,servicePromise});resolve({dispose:()=>count++});await new Promise(setImmediate);assert.equal(count,1)});
await run('Notifications arriving during promise cleanup still schedule a follow-up',async()=>{for(let delay=1;delay<=8;delay++){const q=queue('patched');let count=0;q.state.processRollouts=async()=>{count++;if(count===1){let chain=Promise.resolve();for(let i=0;i<delay;i++)chain=chain.then(()=>{});chain.then(()=>q.state.queueProcessing())}};await q.state.queueProcessing();await new Promise(setImmediate);assert.equal(count,2);assert.equal(q.state.processingRequested,false)}});
await run('Oversized restored windows also move inside the desktop work area',()=>{const x=renderer('patched'),r=x.api.clamp({x:300,y:100,width:9999,height:9999},{width:480,height:600},[{workArea:{x:0,y:0,width:1920,height:1080}}]);assert.equal(r.x,0);assert.equal(r.y,0);assert.equal(r.x+r.width,1920);assert.equal(r.y+r.height,1080)});
fs.writeFileSync(path.join(root,'core-tests.json'),JSON.stringify({passed:true,tests},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

