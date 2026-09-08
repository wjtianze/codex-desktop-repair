const END='\uE201';
const MAX_HTML=5_000_000;
const sessions=new Map();
const SHELL_PREFIX='<!--local-visualization-progressive:';

function readString(text,start){
  let value='';
  for(let at=start+1;at<text.length;at++){
    const char=text[at];
    if(char==='"')return{value,end:at+1,closed:true};
    if(char==='\\'){
      if(++at>=text.length)return{value,end:text.length,closed:false};
      const escaped=text[at],simple={'"':'"','\\':'\\','/':'/',b:'\b',f:'\f',n:'\n',r:'\r',t:'\t'};
      if(escaped==='u'){
        const hex=text.slice(at+1,at+5);
        if(hex.length<4)return{value,end:text.length,closed:false};
        if(!/^[a-f\d]{4}$/i.test(hex))return null;
        value+=String.fromCharCode(parseInt(hex,16));at+=4;
      }else if(Object.hasOwn(simple,escaped))value+=simple[escaped];else return null;
    }else{
      if(char<' ')return null;
      value+=char;
    }
  }
  if(/[\uD800-\uDBFF]$/.test(value))value=value.slice(0,-1);
  return{value,end:text.length,closed:false};
}

function parseVisualizationMarker(raw){
  if(typeof raw!=='string'||raw.length>MAX_HTML*2)return null;
  const start=/^\uE200(visualize|genui)\uE202/.exec(raw);if(!start)return null;
  const kind=start[1],closing=raw.indexOf(END,start[0].length),complete=closing!==-1,payload=raw.slice(start[0].length,complete?closing:undefined);
  let html=null,title=null,path=null,hasAppBlock=kind==='visualize',depth=0;
  const consider=value=>{if(typeof value==='string'&&/^\s*<(?:!doctype|html|head|body|style|div|section|svg|main|article|figure|canvas|p|h[1-6])(?:\s|>)/i.test(value)&&(!html||value.length>html.length))html=value};
  consider(payload);
  if(html!==null&&hasAppBlock)return{kind,html,title,path,complete,raw:complete?raw.slice(0,closing+END.length):raw};
  for(let at=0;at<payload.length;at++){
    if(payload[at]==='{'){depth++;continue}if(payload[at]==='}'){depth--;continue}
    if(payload[at]!=='"')continue;
    const key=readString(payload,at);if(!key)return null;consider(key.value);if(!key.closed)break;
    at=key.end;while(/\s/.test(payload[at]??'')&&at<payload.length)at++;
    if(payload[at]!==':'){at--;continue;}
    at++;while(/\s/.test(payload[at]??'')&&at<payload.length)at++;
    if(kind==='genui'&&depth===1&&key.value==='app_block'&&payload[at]==='{')hasAppBlock=true;
    if(payload[at]!=='"'){at--;continue;}
    const value=readString(payload,at);if(!value)return null;
    if(!['icon_svg','icon','thumbnail','thumbnail_svg','title','display_name','description','alt'].includes(key.value))consider(value.value);
    if(['title','display_name'].includes(key.value)&&value.closed)title=value.value.slice(0,200);
    if(['path','entrypoint'].includes(key.value)&&value.closed)path=value.value;
    at=value.end-1;if(!value.closed)break;
  }
  if(!hasAppBlock||html==null||html.length>MAX_HTML)return null;
  return{kind,html,title,path,complete,raw:complete?raw.slice(0,closing+END.length):raw};
}

let cachedMarkerInput=null,cachedMarkerValue=null;
export function readVisualizationMarker(raw){
  if(typeof raw==='string'&&raw===cachedMarkerInput)return cachedMarkerValue;
  const result=parseVisualizationMarker(raw);
  if(typeof raw==='string'&&raw.length<=262144){cachedMarkerInput=raw;cachedMarkerValue=result?Object.freeze(result):null;}
  return result;
}

export function partialVisualizationDirective(raw,block=true){
  const marker=readVisualizationMarker(raw);
  if(!marker||marker.complete)return null;
  return{type:'codexDirective',raw:marker.raw,name:'chatgpt-content-reference',attributes:{marker_text:marker.raw,marker_type:marker.kind},block};
}

export function isProgressiveVisualizationAttributes(attributes,references,validate){
  if(!['visualize','genui'].includes(attributes?.marker_type))return false;
  const marker=readVisualizationMarker(attributes.marker_text);if(!marker)return false;
  const reference=Array.isArray(references)?references.find(value=>value?.matched_text===marker.raw):null;
  return !reference||!validate||validate(reference);
}

export function findPartialVisualizationStart(text){
  if(typeof text!=='string')return;
  for(const match of text.matchAll(/\uE200(?:visualize|genui)\uE202/g)){
    const start=match.index,lineStart=text.lastIndexOf('\n',start-1)+1;
    if(text.slice(lineStart,start).trim()===''&&partialVisualizationDirective(text.slice(start),true))return start;
  }
}

export function previewSessionId(fragment){
  if(typeof fragment!=='string'||!fragment.startsWith(SHELL_PREFIX))return null;
  return /^<!--local-visualization-progressive:([a-f\d-]{36})-->/.exec(fragment)?.[1]??null;
}

export function visualizationWantsWide(fragment){
  return typeof fragment==='string'&&/(?:grid-cols-(?:[2-9]|\[)|viz-grid)/.test(fragment);
}

export function visualizationIdentity(file,fragment){
  const id=previewSessionId(fragment);return id?'progressive:'+id:file;
}

// Only this host-authored receiver executes during generation. Incoming HTML is inert.
function previewReceiver(id){
  const root=document.getElementById('local-progressive-visualization');
  let last=-1;
  const update=globals=>{
    const payload=globals?.__localVisualizationPreview;
    if(!root||payload?.id!==id||!Number.isSafeInteger(payload.revision)||payload.revision<=last||typeof payload.html!=='string')return;
    last=payload.revision;
    const template=document.createElement('template');template.innerHTML=payload.html;
    for(const node of template.content.querySelectorAll('script,iframe,object,embed,base,meta[http-equiv]'))node.remove();
    for(const element of template.content.querySelectorAll('*'))for(const attribute of [...element.attributes])if(/^on/i.test(attribute.name)||attribute.name==='autofocus')element.removeAttribute(attribute.name);
    root.replaceChildren(template.content);root.inert=true;
  };
  globalThis.addEventListener('openai:set_globals',event=>update(event.detail?.globals));
  update(globalThis.openai);
}

export function previewShell(id){
  if(!/^[a-f\d-]{36}$/.test(id))throw Error('Invalid visualization preview identifier');
  return SHELL_PREFIX+id+'--><div id="local-progressive-visualization" inert></div><script>('+previewReceiver.toString()+')('+JSON.stringify(id)+');<\/script>';
}

function notify(session,phase,error=null){
  if(session.disposed)return;
  session.phase=phase;session.onState?.({phase,error});
}

function schedule(session){
  if(session.disposed||!session.ready||!session.api||session.busy||session.timer)return;
  if(session.complete){void finish(session);return;}
  session.timer=setTimeout(()=>{session.timer=null;void deliver(session)},100);
}

async function deliver(session){
  if(session.disposed||!session.ready||!session.api||session.busy||session.complete)return schedule(session);
  const revision=session.revision,html=session.html,api=session.api;
  if(session.delivered>=revision)return;
  session.busy=true;
  try{
    const prepared=await session.prepare(html);
    if(session.disposed||session.complete||session.api!==api||!session.ready)return;
    await api.sendPreview({id:session.id,revision,html:prepared});
    if(!session.disposed)session.delivered=revision;
  }catch(error){if(!session.disposed&&!session.complete)notify(session,'preview',error)}
  finally{session.busy=false;if(session.revision!==revision||session.complete)schedule(session)}
}

async function finish(session){
  if(session.disposed||session.busy||!session.api||!session.ready||!session.complete||session.finalStarted)return;
  const api=session.api;session.finalStarted=true;session.busy=true;notify(session,'finishing');
  try{
    const ready=await api.renderComplete(session.sourceHtml);
    if(session.disposed||session.api!==api)return;
    if(ready!==true)throw Error('Visualization did not finish loading');
    notify(session,'complete');session.html='';
  }catch(error){if(!session.disposed&&session.api===api)notify(session,'error',error)}
  finally{session.busy=false;if(session.api!==api)schedule(session)}
}

export function createPreviewSession({onState,prepare=async html=>html,id=globalThis.crypto.randomUUID()}={}){
  const session={id,onState,prepare,html:'',sourceHtml:'',revision:0,delivered:-1,complete:false,ready:false,api:null,busy:false,timer:null,finalStarted:false,disposed:false,phase:'preview'};
  if(sessions.has(id))throw Error('Duplicate visualization preview identifier');
  sessions.set(id,session);
  return{id,shell:previewShell(id),update(html,complete=false){
    if(session.disposed||typeof html!=='string'||html.length>MAX_HTML)return;
    if(session.complete)return html===session.sourceHtml;
    if(html!==session.html||complete){session.html=html;session.revision++;}
    if(complete){session.complete=true;session.sourceHtml=html;if(session.timer){clearTimeout(session.timer);session.timer=null;}}
    schedule(session);return true;
  },retry(){if(session.phase==='error'){session.finalStarted=false;schedule(session)}},dispose(){
    if(session.disposed)return;session.disposed=true;if(session.timer)clearTimeout(session.timer);session.abortCleanup?.();sessions.delete(id);session.html='';session.sourceHtml='';session.api=null;
  }};
}

export function bindNativePreview(fragment,{sendPreview,renderComplete,preparePreview,signal}){
  const id=previewSessionId(fragment),session=id?sessions.get(id):null;
  if(!session||signal.aborted)return null;
  const api={sendPreview,renderComplete};session.api=api;session.ready=false;session.delivered=-1;session.finalStarted=false;if(preparePreview)session.prepare=preparePreview;
  const abort=()=>{if(session.api===api){session.api=null;session.ready=false;if(session.timer){clearTimeout(session.timer);session.timer=null;}}};
  session.abortCleanup?.();signal.addEventListener('abort',abort,{once:true});session.abortCleanup=()=>signal.removeEventListener('abort',abort);
  return()=>{if(session.api===api&&!signal.aborted){session.ready=true;schedule(session)}};
}

export function resolveVisualizationSource(fragment){
  const id=previewSessionId(fragment),session=id?sessions.get(id):null;
  return session?.complete?session.sourceHtml:fragment;
}

export function createProgressiveVisualizationComponent({React,jsx,Native,useLocale,useAllowed}){
  return function ProgressiveVisualization({attributes,contentReferences}){
    const marker=readVisualizationMarker(attributes?.marker_text),locale=useLocale(),zh=locale?.startsWith('zh');
    const [state,setState]=React.useState({phase:'preview',error:null}),[generation,setGeneration]=React.useState(0),sessionRef=React.useRef(null),everPartial=React.useRef(false);
    const reference=Array.isArray(contentReferences)?contentReferences.find(item=>item?.category==='app_block'&&item?.type==='client_defined_widget'&&typeof item?.data?.content==='string'&&item.matched_text===marker?.raw):null;
    if(marker&&!marker.complete)everPartial.current=true;
    const allowed=useAllowed?useAllowed():true;
    const active=allowed&&!!marker&&everPartial.current&&reference?.data?.type!=='live'&&(reference?.data?.content?.length??0)<=MAX_HTML;
    React.useEffect(()=>{
      if(!active)return;
      const session=createPreviewSession({onState:setState});sessionRef.current=session;setState({phase:'preview',error:null});
      return()=>{session.dispose();if(sessionRef.current===session)sessionRef.current=null};
    },[active,generation]);
    React.useEffect(()=>{
      const session=sessionRef.current;if(!session||!marker)return;
      if(marker.complete&&reference?.data?.type!=='live'&&reference?.data?.content!=null){if(session.update(reference.data.content,true)===false)setGeneration(value=>value+1);}
      else if(!marker.complete&&session.update(marker.html,false)===false)setGeneration(value=>value+1);
    },[active,generation,marker?.html,marker?.complete,reference]);
    if(!marker||!allowed)return null;
    if(!active)return reference?jsx(Native,{reference}):null;
    const session=sessionRef.current;
    if(!session)return jsx('div',{'aria-busy':true,children:zh?'Generating visualization…':'Generating visualization…'});
    const finished=state.phase==='complete',title=reference?.data?.title??reference?.data?.display_name??marker.title;
    const previewReference={type:'client_defined_widget',category:'app_block',data:{content:session.shell,__localWideLayout:true,path:reference?.data?.path??reference?.data?.entrypoint??marker.path??'index.html',title,type:'inline'}};
    return jsx('div',{'data-local-progressive-visualization':true,'aria-busy':!finished,children:[
      !finished?jsx('div',{role:'status',style:{fontSize:'12px',opacity:.65,marginBottom:'8px'},children:state.phase==='error'?(zh?'Visualization failed to load':'Visualization failed to load'):state.phase==='finishing'?(zh?'Finishing visualization…':'Finishing visualization…'):(zh?'Generating visualization…':'Generating visualization…')},'status'):null,
      jsx('div',{inert:!finished,children:jsx(Native,{reference:previewReference})},'canvas'),
      state.phase==='error'?jsx('button',{type:'button',onClick:()=>session.retry(),children:zh?'Reload':'Reload'},'retry'):null
    ]});
  };
}
