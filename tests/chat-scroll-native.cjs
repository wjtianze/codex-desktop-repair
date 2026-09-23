const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('build/fixtures/render/patches/conversation.js','utf8');
const start=source.indexOf('var __localChatTurns;'),end=source.indexOf('function np(',start);
const calls=[],Native=()=>{},Wrapped=()=>{},controller=()=>{};
const render=vm.runInNewContext(source.slice(start,end)+';tp',{
 __localCreateChatTurns:options=>{calls.push(options);return Wrapped},__localChatPromptRail:'rail',Q:{useRef:value=>({current:value}),useCallback:Xe=>Xe},$:{jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key}),Fragment:'fragment'},rl:Native,__localUseChatScrollController:controller,G:()=>[{messageId:'retained'}],Z:{c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))},pp:'retained-key',np:()=>{}
});
let reported;const entries=[{turnKey:'first',turn:{items:[]}},{turnKey:'last',turn:{items:[]}}],onApiChange=api=>reported=api,getHeightPx=()=>120;
const tree=render({conversationKey:'chat-a',entries,onApiChange,responseSpacerState:{getHeightPx}}),[rail,view]=tree.props.children;
assert.equal(view.type,Wrapped);assert.equal(view.key,'chat-a');assert.equal(view.props.conversationKey,'chat-a');assert.equal(view.props.entries,entries);const api={scrollToKey(){}};view.props.onApiChange(api);assert.equal(reported,api);assert.equal(rail.props.apiRef.current,api);assert.equal(view.props.getBottomScrollPaddingPx,getHeightPx);assert.equal(calls[0].Native,Native);assert.equal(calls[0].useScrollController,controller);
render({conversationKey:'chat-b',entries});assert.equal(calls.length,1);console.log('PASS Native Chat turn list uses keyed restoration while retaining search and response-spacer integration');
const page=source.slice(source.indexOf('function $f('),source.indexOf('function ep('));
const key=page.match(/scrollStateConversationId:(\w+)/)?.[1];assert.ok(key);
assert.ok(page.includes('conversationKey:'+key+'}'),'Restoration must receive the scroll conversation ID rather than a work-mode boolean');
assert.ok(page.includes('t[131]!=='+key+'?'),'Memoized content must invalidate when the scroll conversation ID changes');
assert.ok(page.includes('t[131]='+key+','),'Memoized content must retain the same conversation ID');
console.log('PASS Native parent passes the actual per-conversation scroll identity through its memo cache');
