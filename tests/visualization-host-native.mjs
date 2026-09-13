import{nativeFunction}from'./fixtures-support/native-source.cjs';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import{visualizationWantsWide}from'../assets/local-visualization-progressive-v1.mjs';
const source=fs.readFileSync(new URL('../build/fixtures/render/patches/primary.js',import.meta.url),'utf8'),jsx=(type,props)=>({type,props});
const section=(a,b)=>nativeFunction(source,/function\s*([\w$]+)\(/.exec(a)[1]);
function native(context={}){return vm.runInNewContext(nativeFunction(source,'dJ')+';dJ',{Won:{c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))},Wp:()=>({conversationId:'fixture',isStreaming:true}),von:{safeParse:r=>({success:r?.type==='client_defined_widget'&&r?.category==='app_block'&&typeof r?.data?.content==='string',data:r})},Gon:{jsx},Bon:'NativeVisualization',...context})}
const reference=(data,matched_text='complete')=>({type:'client_defined_widget',category:'app_block',matched_text,data});
const completed=native()({reference:reference({content:'<div>Ready</div>',title:'Preview',style_mode:'open'}),isStreaming:false});
assert.equal(completed.type,'NativeVisualization');assert.equal(completed.props.content,'<div>Ready</div>');assert.equal(completed.props.title,'Preview');assert.equal(completed.props.styleMode,'open');assert.equal(completed.props.isStreaming,false);
console.log('PASS Native app blocks preserve content, title, document style and completed state');
const partial=reference({content:'<div>Partial</div>'},'\uE200genui\uE202{}');assert.equal(native()({reference:partial}).props.isStreaming,true);partial.data.render_immediately_during_streaming=true;assert.equal(native()({reference:partial}).props.isStreaming,false);
console.log('PASS Progressive preview requests immediate rendering without bypassing native streaming handling');
assert.equal(native()({reference:{data:{content:'invalid envelope'}}}),null);assert.equal(native({Wp:()=>null})({reference:reference({content:'<div/>'})}),null);
console.log('PASS Native validation and missing-context gates remain effective');
class IFrame{setAttribute(key,value){this[key]=value}};const create=vm.runInNewContext(section('function ftt(','var hut=')+';ftt',{document:{createElement:name=>name==='iframe'?new IFrame():{style:{},setAttribute(key,value){this[key]=value}}},HTMLIFrameElement:IFrame,Qqe:id=>"fixture:"+id,cze:id=>'fixture:'+id});
assert.equal(create('webview','visualization-test').style.transform,'translateZ(0)');assert.equal(create('webview','other-sandbox').style.transform,undefined);assert.equal(create('iframe','visualization-test').sandbox,'allow-scripts allow-same-origin');console.log('PASS Compositing adjustment is limited to visualization webviews and keeps native iframe isolation');
