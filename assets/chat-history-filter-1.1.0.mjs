// Local sidebar filtering. No polling, network calls, or conversation writes.
export const VERSION = '1.1.0';
export const STORAGE_KEY = 'chatgpt.local.sidebar-history-filter.v2';
export const MODES = Object.freeze(['all','online','local']);
export const LABELS = Object.freeze({all:'合并显示',online:'聊天与云端工作',local:'本地工作与 Codex'});
export const COMPACT_LABELS = Object.freeze({all:'合并',online:'聊天与云端',local:'本地与 Codex'});
const listeners=new Set();
let listening=false,context=null,lastDetected='online';
const defaults=Object.freeze({followContext:true,manualMode:'all'});
export function normalizeMode(value){return MODES.includes(value)?value:'all'}
function readPreferences(){
 try{const raw=globalThis.localStorage?.getItem(STORAGE_KEY);if(raw){const value=JSON.parse(raw);if(typeof value.followContext==='boolean'&&MODES.includes(value.manualMode))return Object.freeze({followContext:value.followContext,manualMode:value.manualMode})}}catch{}
 return defaults;
}
let preferences=readPreferences();
function update(value,persist){
 const next=Object.freeze({followContext:value.followContext===true,manualMode:normalizeMode(value.manualMode)});
 if(persist)try{globalThis.localStorage?.setItem(STORAGE_KEY,JSON.stringify(next))}catch{}
 if(preferences.followContext===next.followContext&&preferences.manualMode===next.manualMode)return;
 preferences=next;for(const callback of [...listeners])callback();
}
function onStorage(event){if(event.key===STORAGE_KEY||event.key===null)update(readPreferences(),false)}
export function subscribe(callback){
 if(!listening&&typeof globalThis.addEventListener==='function'){globalThis.addEventListener('storage',onStorage);listening=true;update(readPreferences(),false)}
 listeners.add(callback);
 return()=>{listeners.delete(callback);if(listening&&listeners.size===0){globalThis.removeEventListener('storage',onStorage);listening=false}};
}
export function getSnapshot(){return preferences}
export function setMode(mode){update({followContext:false,manualMode:normalizeMode(mode)},true)}
export function setFollowContext(enabled,currentMode=lastDetected){update({followContext:enabled,manualMode:enabled?preferences.manualMode:normalizeMode(currentMode)},true)}
export function detectContext({sidebarMode,route='',appMode,workLocation}={}){
 if(sidebarMode==='codex')return 'local';
 if(/^\/(?:local|remote)(?:\/|$)/.test(route))return 'local';
 if(/^\/(?:c\/|g\/[^/]+\/c\/)/.test(route))return 'online';
 if(appMode==='work'&&(workLocation==='local'||workLocation==='worktree'))return 'local';
 return 'online';
}
export function effectiveMode(detected,prefs=preferences){return prefs.followContext?(detected==='local'?'local':'online'):normalizeMode(prefs.manualMode)}
export function getContext(React){return context??=React.createContext(Object.freeze({mode:'online',detectedMode:'online',followContext:true}))}
export function useSelection(React,native){
 const prefs=React.useSyncExternalStore(subscribe,getSnapshot,getSnapshot),detected=detectContext(native);
 React.useLayoutEffect(()=>{lastDetected=detected},[detected]);
 return React.useMemo(()=>Object.freeze({mode:effectiveMode(detected,prefs),detectedMode:detected,followContext:prefs.followContext}),[prefs,detected]);
}
export function useSelectionContext(React){return React.useContext(getContext(React))}
export function useActiveMode(React){return useSelectionContext(React).mode}
export function classifyItem(item){
 if(item?.kind!=='conversation'&&item?.kind!=='project')return null;
 const key=typeof item.key==='string'?item.key:'';
 if(key.startsWith('chatgpt:conversation:')||key.startsWith('chatgpt:project:'))return 'online';
 if(key.startsWith('codex:thread:')||key.startsWith('codex:project:'))return 'local';
 return item.source==='chatgpt'?'online':item.source==='codex'?'local':'unknown';
}
export function classifyReference(reference){return reference?.source==='chatgpt'?'online':reference?.source==='codex'?'local':'unknown'}
export function filterItems(items,selected){
 selected=normalizeMode(selected);if(selected==='all')return items;
 const excludedProjects=new Set(items.filter(item=>item.kind==='project'&&classifyItem(item)!==selected).map(item=>item.key));
 const result=[];let changed=false;
 for(const item of items){const category=classifyItem(item);if(category!==null&&category!==selected){changed=true;continue}
  // Keep a matching local task discoverable if its cloud parent is filtered out.
  if(item.kind==='conversation'&&excludedProjects.has(item.projectKey)){result.push({...item,projectKey:null});changed=true}else result.push(item);
 }
 return changed?result:items;
}
export function filterReferenceMap(map,selected){
 selected=normalizeMode(selected);if(selected==='all')return map;
 const result=new Map([...map].filter(([,value])=>classifyReference(value)===selected));return result.size===map.size?map:result;
}
export function filterKeys(keys,selected,conversations,projects){
 selected=normalizeMode(selected);if(selected==='all')return keys;
 const filtered=keys.filter(key=>{
  const reference=conversations?.get(key)??projects?.get(key);
  if(reference)return classifyReference(reference)===selected;
  if(key.startsWith('chatgpt:conversation:')||key.startsWith('chatgpt:project:'))return selected==='online';
  if(key.startsWith('codex:thread:')||key.startsWith('codex:project:'))return selected==='local';
  return true;
 });return filtered.length===keys.length?keys:filtered;
}
export function getDiagnostics(){return {version:VERSION,mode:effectiveMode(lastDetected),detectedMode:lastDetected,followContext:preferences.followContext,subscribers:listeners.size,storageListener:listening}}
