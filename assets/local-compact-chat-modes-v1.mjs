// Compact surfaces keep separate identities for Chat, cloud Work and local Work.
export function compactModeLabels(locale='en') {
  return /^zh/i.test(locale) ? {chat:'聊天',work:'工作',cloud:'在云端',local:'在你的计算机上',location:'工作运行位置',loading:'正在打开…',failed:'无法打开此模式，请重试',retry:'重试',unavailable:'当前账号或项目暂不支持此模式'} : {chat:'Chat',work:'Work',cloud:'In the cloud',local:'On your computer',location:'Where Work runs',loading:'Opening…',failed:'Unable to open this mode. Try again.',retry:'Retry',unavailable:'This mode is unavailable for this account or project'};
}

let controlsContext;
export function getCompactControlsContext(React){return controlsContext??=React.createContext(null)}
export function createCompactControls(React){return function CompactControls(){return React.useContext(getCompactControlsContext(React))}}

export function createCompactModeSurface({React,jsx,useAvailability,makeId,renderCloud,renderLocal,renderProject,renderHistory}) {
  return function CompactModeSurface({surfaceId,initialMode='chat',originalMode=initialMode,children,locale='en',localProps,onStateChange,savedState}) {
    const [state,setState]=React.useState(()=>savedState??{mode:initialMode,lastWork:initialMode==='chat'?'cloud':initialMode,chatId:makeId(),cloudId:makeId()});
    const labels=compactModeLabels(locale),availability=useAvailability({projectId:state.cloudProject?.id}),mode=state.mode;
    const choose=next=>{if(!['chat','cloud','local'].includes(next)||next===mode||availability[next]===false)return;setState(previous=>({...previous,mode:next,lastWork:next==='chat'?previous.lastWork:next}))};
    React.useEffect(()=>{onStateChange?.(state)},[state]);
    const content=mode===originalMode?children:mode==='local'?renderLocal({surfaceId,localProps,conversationId:state.localId,onCreated:id=>setState(previous=>previous.localId===id?previous:{...previous,localId:id})}):renderCloud({conversationId:mode==='chat'?state.chatId:state.cloudId,origin:mode==='cloud'?'tpp':null,project:state[mode+'Project'],onProjectChange:(id,name)=>setState(previous=>({...previous,[mode+'Project']:{id,name}}))});
    const buttonStyle=active=>({borderRadius:999,padding:'4px 14px',background:active?'Canvas':'transparent',boxShadow:active?'0 1px 4px #0002':undefined,fontWeight:active?500:400});
    const controls=jsx('div',{'data-local-compact-controls':true,className:'flex shrink-0 flex-wrap items-center gap-2 px-4 py-2',children:[
        jsx('div',{role:'group','aria-label':locale.startsWith('zh')?'对话模式':'Conversation mode',className:'flex gap-1',style:{borderRadius:999,padding:2,background:'color-mix(in srgb, currentColor 6%, transparent)'},children:[
          jsx('button',{type:'button','aria-pressed':mode==='chat',disabled:availability.chat===false,title:availability.chat===false?labels.unavailable:undefined,className:'text-sm focus-visible:outline-2 focus-visible:outline-ring',style:buttonStyle(mode==='chat'),onClick:()=>choose('chat'),children:labels.chat}),
          jsx('button',{type:'button','aria-pressed':mode!=='chat',disabled:availability.cloud===false&&availability.local===false,className:'text-sm focus-visible:outline-2 focus-visible:outline-ring',style:buttonStyle(mode!=='chat'),onClick:()=>{if(mode==='chat')choose(state.lastWork&&availability[state.lastWork]!==false?state.lastWork:availability.cloud===false?'local':'cloud')},children:labels.work})]}),
        mode!=='chat'?jsx('select',{'aria-label':labels.location,value:mode,className:'min-w-0 rounded-lg bg-transparent px-2 py-1 text-sm',style:{appearance:'auto',maxWidth:'55%'},onChange:event=>choose(event.target.value),children:[
          jsx('option',{value:'local',disabled:availability.local===false,children:labels.local}),
          jsx('option',{value:'cloud',disabled:availability.cloud===false,children:labels.cloud})]}):null,
        mode==='local'&&renderProject?renderProject({localProps,conversationId:state.localId??localProps?.conversationId}):null,
        renderHistory?renderHistory():null]});
    return jsx(getCompactControlsContext(React).Provider,{value:controls,children:jsx('div',{className:'flex h-full min-h-0 w-full flex-1 flex-col',style:{height:'100%',minHeight:0,display:'flex',flexDirection:'column'},'data-local-compact-mode':mode,'data-local-compact-surface':surfaceId,children:content})});
  };
}

// One pending creation per native surface, even if React remounts while it resolves.
export function createCompactLocalCache() {
  const entries=new Map();
  return {get(key,create){if(!entries.has(key))entries.set(key,Promise.resolve().then(create).catch(error=>{entries.delete(key);throw error}));return entries.get(key)},size:()=>entries.size};
}
