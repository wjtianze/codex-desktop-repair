import{nativeFunction}from'./fixtures-support/native-source.cjs';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import{visualizationWantsWide}from'../assets/local-visualization-progressive-v1.mjs';
const source=fs.readFileSync(new URL('../build/fixtures/render/patches/primary.js',import.meta.url),'utf8'),jsx=(type,props)=>({type,props});
const section=(a,b)=>nativeFunction(source,/function\s*([\w$]+)\(/.exec(a)[1]);
function native(context={}){return vm.runInNewContext(section('function w5n(','function EXn(')+';w5n',{E5n:{c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))},Oe:()=>({}),yS:{},RD:()=>({conversationId:'fixture',messageId:'message'}),n0:{useContext:()=>null},JC:{},r0:{jsx,Fragment:'Fragment'},vVt:'NativeVisualization',__localVisualizationWantsWide:visualizationWantsWide,...context})}
for(const content of['<div class="grid md:grid-cols-[1.1fr_.9fr]"></div>','<div class="viz-grid"></div>']){const result=native()({reference:{data:{content}}});assert.equal(result.props.children.props.attributes.mode,'wide')}
assert.equal(native()({reference:{data:{content:'<div>Single</div>'}}}).props.children.props.attributes.mode,undefined);
assert.equal(native({RD:()=>({shouldBlockExternalEgress:true})})({reference:{data:{content:'<div class="viz-grid"></div>'}}}),null);
console.log('PASS Native visualization requests wide layout for multiple columns and keeps existing content restrictions');
class IFrame{setAttribute(key,value){this[key]=value}};const create=vm.runInNewContext(section('function jBt(','var yLt=')+';jBt',{document:{createElement:name=>name==='iframe'?new IFrame():{style:{},setAttribute(key,value){this[key]=value}}},HTMLIFrameElement:IFrame,yVe:id=>"fixture:"+id,Bde:id=>'fixture:'+id});
assert.equal(create('webview','visualization-test').style.transform,'translateZ(0)');assert.equal(create('webview','other-sandbox').style.transform,undefined);assert.equal(create('iframe','visualization-test').sandbox,'allow-scripts allow-same-origin');console.log('PASS Compositing adjustment is limited to visualization webviews and keeps native iframe isolation');
