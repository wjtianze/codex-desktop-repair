const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function load(kind,fn,context){const s=fs.readFileSync('build/fixtures/render/'+kind+'/chat-code.js','utf8'),a=s.indexOf('function '+fn+'('),b=s.indexOf('function ',a+10);return vm.runInNewContext(s.slice(a,b)+';'+fn,context)}
const jsx=(type,props)=>({type,props}),compiler={c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))};
for(const kind of ['raw','patches']){
 const render=load(kind,"rn",{cn:compiler,$:{jsx},an:'native-chat-code',te:'lazy-placeholder',Pt:()=>null});
 const props={content:'int x = 1;',language:'cpp',codeBlockIndex:0,turnContext:{codeBlocks:{}}};
 assert.equal(render(props).type,kind==='raw'?'lazy-placeholder':'native-chat-code');
 assert.equal(render({...props,turnContext:{codeBlocks:{0:{render_mode:'app_block'}}}}).type,'lazy-placeholder');
 console.log('PASS '+kind+' actual Chat code route distinguishes ordinary code from interactive app blocks');
}
const state={useState:value=>[value,()=>{}]},format={formatMessage:spec=>spec.defaultMessage};
const context={cn:compiler,ln:state,$:{jsx,jsxs:jsx,Fragment:'fragment'},n:()=>({get(){},set(){}}),ue:'scope',ee:()=>format,D:()=>null,N:'server-id',p:()=>false,Ke:'wrap',me:()=>({get:()=>false}),Ie:()=>false,Pt:()=>null,S:l=>({value:l,label:l==='cpp'?'C++':l}),Ce:'snippet',be:'spinner',tn:{InlineCodePane:'inline'},A:{CodeBlock:'block'},P:(...v)=>v.filter(Boolean).join(' ')};
const an=load('patches',"an",context),props={content:'int x = 1;',language:'cpp',codeBlockIndex:0,turnContext:{conversationId:'test',codeBlocks:{},isStreaming:false}};
const result=an(props);assert.equal(result.type,'snippet');assert.equal(result.props.title,'C++');assert.equal(result.props.deferEnhancementsUntilVisible,true);assert.equal(result.props.content,props.content);assert.equal(result.props.showCopyButton,true);console.log('PASS Full native Chat code component keeps title and copy action immediately while deferring highlighting');
const wrap=an({...props,forceCodeBlockWordWrap:true});assert.equal(wrap.props.shouldWrapCode,true);const stream=an({...props,isCodeFenceOpen:true});assert.equal(stream.props.showCopyButton,false);console.log('PASS Native Chat code keeps explicit wrapping and streaming copy-button restrictions');
