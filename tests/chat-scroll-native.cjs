const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('build/fixtures/render/patches/conversation.js','utf8');
const start=source.indexOf('var __localChatTurns;'),end=source.indexOf('function Kc(',start);
const calls=[],Native=()=>{},Wrapped=()=>{},controller=()=>{};
const render=vm.runInNewContext(source.slice(start,end)+';Gc',{
 __localCreateChatTurns:options=>{calls.push(options);return Wrapped},Q:{},$:{jsx:(type,props,key)=>({type,props,key})},to:Native,__localUseChatScrollController:controller,K:()=>['retained'],rl:'retained-key',Kc:()=>{}
});
const entries=[{turnKey:'first'},{turnKey:'last'}],onApiChange=()=>{},getHeightPx=()=>120;
const view=render({conversationKey:'chat-a',entries,onApiChange,responseSpacerState:{getHeightPx}});
assert.equal(view.type,Wrapped);assert.equal(view.key,'chat-a');assert.equal(view.props.conversationKey,'chat-a');assert.equal(view.props.entries,entries);assert.equal(view.props.onApiChange,onApiChange);assert.equal(view.props.getBottomScrollPaddingPx,getHeightPx);assert.equal(calls[0].Native,Native);assert.equal(calls[0].useScrollController,controller);
render({conversationKey:'chat-b',entries});assert.equal(calls.length,1);console.log('PASS Native Chat turn list uses keyed restoration while retaining search and response-spacer integration');
