const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function load(kind,fn,context){const s=fs.readFileSync('build/fixtures/render/'+kind+'/chat-code.js','utf8'),a=s.indexOf('function '+fn+'('),b=s.indexOf('function ',a+10);return vm.runInNewContext(s.slice(a,b)+';'+fn,context)}
const jsx=(type,props)=>({type,props}),compiler={c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))};
for(const kind of ['raw','patches']){
 const render=load(kind,"hr",{yr:compiler,$:{jsx},gr:'native-chat-code',j:'lazy-placeholder',Kn:()=>null});
 const props={content:'int x = 1;',language:'cpp',codeBlockIndex:0,turnContext:{codeBlocks:{}}};
 assert.equal(render(props).type,kind==='raw'?'lazy-placeholder':'native-chat-code');
 assert.equal(render({...props,turnContext:{codeBlocks:{0:{render_mode:'app_block'}}}}).type,'lazy-placeholder');
 console.log('PASS '+kind+' actual Chat code route distinguishes ordinary code from interactive app blocks');
}
const state={useState:value=>[value,()=>{}],useRef:value=>({current:value}),useEffect(){},useRef:value=>({current:value}),useEffect(){}},format={formatMessage:spec=>spec.defaultMessage};
const context={yr:compiler,br:state,$:{jsx,jsxs:jsx,Fragment:'fragment'},se:()=>({get(){},set(){}}),he:'scope',ae:()=>format,ne:()=>null,Ae:'server-id',w:()=>false,qe:'wrap',we:()=>({get:()=>false}),Vt:()=>false,Me:()=>false,Kn:()=>null,pr:{},ye:l=>({value:l,label:l==='cpp'?'C++':l}),re:'snippet',St:'spinner',tn:{InlineCodePane:'inline'},ue:{CodeBlock:'block'},We:(...v)=>v.filter(Boolean).join(' ')};
const gr=load('patches',"gr",context),props={content:'int x = 1;',language:'cpp',codeBlockIndex:0,turnContext:{conversationId:'test',codeBlocks:{},isStreaming:false}};
const result=gr(props);assert.equal(result.type,'snippet');assert.equal(result.props.title,'C++');assert.equal(result.props.deferEnhancementsUntilVisible,true);assert.equal(result.props.content,props.content);assert.equal(result.props.showCopyButton,true);console.log('PASS Full native Chat code component keeps title and copy action immediately while deferring highlighting');
const wrap=gr({...props,forceCodeBlockWordWrap:true});assert.equal(wrap.props.shouldWrapCode,true);const stream=gr({...props,isCodeFenceOpen:true});assert.equal(stream.props.showCopyButton,false);console.log('PASS Native Chat code keeps explicit wrapping and streaming copy-button restrictions');
