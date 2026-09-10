const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('build/fixtures/render/patches/conversation.js','utf8');
const start=source.indexOf('var __localChatTurns;'),end=source.indexOf('function Kc(',start);
const calls=[],Native=()=>{},Wrapped=()=>{},controller=()=>{};
const render=vm.runInNewContext(source.slice(start,end)+';Gc',{
 __localCreateChatTurns:options=>{calls.push(options);return Wrapped},__localChatPromptRail:'rail',Q:{useRef:value=>({current:value}),useCallback:fn=>fn},$:{jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key}),Fragment:'fragment'},to:Native,__localUseChatScrollController:controller,K:()=>['retained'],rl:'retained-key',Kc:()=>{}
});
let reported;const entries=[{turnKey:'first'},{turnKey:'last'}],onApiChange=api=>reported=api,getHeightPx=()=>120;
const tree=render({conversationKey:'chat-a',entries,onApiChange,responseSpacerState:{getHeightPx}}),[rail,view]=tree.props.children;
assert.equal(view.type,Wrapped);assert.equal(view.key,'chat-a');assert.equal(view.props.conversationKey,'chat-a');assert.equal(view.props.entries,entries);const api={scrollToKey(){}};view.props.onApiChange(api);assert.equal(reported,api);assert.equal(rail.props.apiRef.current,api);assert.equal(view.props.getBottomScrollPaddingPx,getHeightPx);assert.equal(calls[0].Native,Native);assert.equal(calls[0].useScrollController,controller);
render({conversationKey:'chat-b',entries});assert.equal(calls.length,1);console.log('PASS Native Chat turn list uses keyed restoration while retaining search and response-spacer integration');
