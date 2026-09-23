const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function load(kind,fn,context){const s=fs.readFileSync('build/fixtures/render/'+kind+'/chat-code.js','utf8'),a=s.indexOf('function '+fn+'('),b=s.indexOf('function ',a+10);return vm.runInNewContext(s.slice(a,b)+';'+fn,context)}
const jsx=(type,props)=>({type,props}),compiler={c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))};
for(const kind of ['raw','patches']){
 const render=load(kind,"gn",{yn:compiler,$:{jsx},_n:'native-chat-code',G:'lazy-placeholder',de:'mermaid-placeholder',Xt:()=>null,ze:()=>false});
 const props={content:'int x = 1;',language:'cpp',codeBlockIndex:0,turnContext:{codeBlocks:{}}};
 assert.equal(render(props).type,kind==='raw'?'lazy-placeholder':'native-chat-code');
 assert.equal(render({...props,turnContext:{codeBlocks:{0:{render_mode:'app_block'}}}}).type,'lazy-placeholder');
 console.log('PASS '+kind+' actual Chat code route distinguishes ordinary code from interactive app blocks');
}
const state={useId:()=> 'code-id',useState:value=>[value,()=>{}],useRef:value=>({current:value}),useEffect(){}},format={formatMessage:spec=>spec.defaultMessage};
const context={it:()=>false,yn:compiler,xn:state,$:{jsx,jsxs:jsx,Fragment:'fragment'},je:()=>({get(){},set(){}}),V:'scope',ee:()=>format,ie:()=>null,Pe:'server-id',se:()=>false,re:'wrap',le:()=>({get:()=>false}),We:()=>false,Xt:()=>null,ze:()=>false,mn:{},Ge:l=>({value:l,label:l==='cpp'?'C++':l}),De:'snippet',u:'spinner',tt:{InlineCodePane:'inline'},Ve:{CodeBlock:'block'},k:(...v)=>v.filter(Boolean).join(' ')};
function snippet(node){if(!node||typeof node!=='object')return null;if(node?.type==='snippet')return node;for(const c of [node?.props?.children].flat(Infinity)){const s=snippet(c);if(s)return s}return null}
const native=load('patches',"_n",context),gr=props=>snippet(native(props)),props={content:'int x = 1;',language:'cpp',codeBlockIndex:0,turnContext:{conversationId:'test',codeBlocks:{},isStreaming:false}};
const result=gr(props);assert.equal(result.type,'snippet');assert.equal(result.props.title,'C++');assert.equal(result.props.deferEnhancementsUntilVisible,true);assert.equal(result.props.content,props.content);assert.equal(result.props.showCopyButton,true);console.log('PASS Full native Chat code component keeps title and copy action immediately while deferring highlighting');
const wrap=gr({...props,forceCodeBlockWordWrap:true});assert.equal(wrap.props.shouldWrapCode,true);const stream=gr({...props,isCodeFenceOpen:true});assert.equal(stream.props.showCopyButton,false);console.log('PASS Native Chat code keeps explicit wrapping and streaming copy-button restrictions');
