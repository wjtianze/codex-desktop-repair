const STORAGE_KEY = 'local-chat-scroll-memory-v1';
const MAX_CHATS = 48, MAX_HEIGHTS = 256, MAX_BYTES = 512 * 1024;
const number = value => Number.isFinite(value) && value >= 0 && value < 1e9;
const keyValid = key => typeof key === 'string' && key.length > 0 && key.length <= 512;

export function sanitizeRestoreState(value) {
  if (!value || !value.turnHeightsByKey || !keyValid(value.renderedWindow?.anchorKey)) return null;
  const heights = Object.create(null);
  for (const [key, height] of Object.entries(value.turnHeightsByKey).slice(-MAX_HEIGHTS)) {
    if (keyValid(key) && number(height)) heights[key] = height;
  }
  return {turnHeightsByKey:heights,renderedWindow:{anchorKey:value.renderedWindow.anchorKey,count:Math.min(40,Math.max(1,value.renderedWindow.count|0))}};
}

export function createScrollMemoryStore(storage) {
  const records = new Map();
  try {
    const text = storage?.getItem(STORAGE_KEY);
    if (text && text.length <= MAX_BYTES) {
      const data = JSON.parse(text);
      if (data.version === 1 && Array.isArray(data.records)) for (const [key,value] of data.records.slice(-MAX_CHATS)) {
        if (!keyValid(key) || !number(value?.offset)) continue;
        const anchor = value.anchor;
        records.set(key,{offset:value.offset,layout:sanitizeRestoreState(value.layout),anchor:anchor && keyValid(anchor.key) && Number.isFinite(anchor.within) && Math.abs(anchor.within)<1e9 ? anchor : null,restoring:false});
      }
    }
  } catch { /* Missing, malformed, or full storage must not block conversations. */ }
  function get(key) {
    if (!keyValid(key)) return {offset:null,layout:null,anchor:null,restoring:false};
    let record = records.get(key);
    if (!record) record = {offset:null,layout:null,anchor:null,restoring:false};
    records.delete(key); records.set(key,record);
    while (records.size > MAX_CHATS) records.delete(records.keys().next().value);
    return record;
  }
  function persist() {
    try {
      const values=[...records].filter(([,r])=>number(r.offset)).map(([key,r])=>[key,{offset:r.offset,layout:r.layout,anchor:r.anchor}]);
      let text=JSON.stringify({version:1,records:values});
      while(text.length>MAX_BYTES&&values.length>1){values.shift();text=JSON.stringify({version:1,records:values})}
      if(text.length<=MAX_BYTES)storage?.setItem(STORAGE_KEY,text);
    } catch { /* In-memory restoration remains available. */ }
  }
  return {get,persist};
}

let defaultStore;
function memory() {
  if (!defaultStore) {
    let storage;try{storage=globalThis.localStorage}catch{}
    defaultStore=createScrollMemoryStore(storage);
    globalThis.addEventListener?.('pagehide',()=>defaultStore.persist());
  }
  return defaultStore;
}
export function readChatScrollOffset(key, fallback) {
  const record=memory().get(key);
  if (!number(record.offset)) record.offset=number(fallback)?fallback:0;
  record.restoring=true;
  return record.offset;
}
export function rememberChatScrollOffset(key, offset) {
  const record=memory().get(key);
  if (!record.restoring && number(offset)) record.offset=offset;
}

export function readingAnchor(entries, api, distance, viewport) {
  if (distance<=24 || !api || !entries.length) return null;
  const last=api.getEntryGeometry(entries.at(-1).turnKey);
  if (!last) return null;
  const top=last.endPx-distance-viewport;
  let low=0,high=entries.length-1;
  while(low<high){const middle=Math.floor((low+high)/2),geometry=api.getEntryGeometry(entries[middle].turnKey);if(!geometry)return null;if(geometry.endPx<=top)low=middle+1;else high=middle}
  const key=entries[low].turnKey,geometry=api.getEntryGeometry(key);
  return geometry?{key,within:top-geometry.startPx}:null;
}
export function restorationDistance(record, entries, api, viewport) {
  if (record.offset<=24) return 0;
  const last=entries.length?api?.getEntryGeometry(entries.at(-1).turnKey):null;
  const anchor=record.anchor,geometry=anchor?api?.getEntryGeometry(anchor.key):null;
  return last&&geometry?Math.max(0,last.endPx-geometry.startPx-anchor.within-viewport):record.offset;
}

export function createRestoringChatTurnList({React,jsx,Native,useScrollController,store=memory()}) {
  return function RestoringChatTurnList(props) {
    const controller=useScrollController(),ref=React.useRef(null);
    if (!ref.current) {
      const record=store.get(props.conversationKey);
      const saved={offset:record.offset??0,anchor:record.anchor,layout:record.layout};
      record.restoring=true;
      ref.current={record,saved,pending:true,ready:false,api:null,frame:null,disposed:false,latestOffset:saved.offset,props,controller};
    }
    const state=ref.current;state.props=props;state.controller=controller;
    const padding=()=>Math.max(0,state.props.getBottomScrollPaddingPx?.()??0);
    if (!state.handlers) {
      const sample=()=>{
        if(state.disposed||state.pending)return;
        const element=state.controller.getScrollElement();
        if(!element||element.clientHeight<=0)return;
        state.record.anchor=readingAnchor(state.props.entries,state.api,state.latestOffset,element.clientHeight);
      };
      const scheduleSample=()=>{if(state.frame==null)state.frame=requestAnimationFrame(()=>{state.frame=null;sample()})};
      const restore=(finish=false)=>{
        if(!state.pending||state.disposed)return;
        const element=state.controller.getScrollElement();if(!element)return;
        const desired=restorationDistance(state.saved,state.props.entries,state.api,element.clientHeight)+padding();
        state.controller.scrollToDistanceFromBottomPx(desired,'instant');
        const actual=state.controller.getLastScrollDistanceFromBottomPx();
        if(state.ready&&(Math.abs(actual-desired)<=1||finish)){
          state.pending=false;state.record.restoring=false;
          state.latestOffset=Math.max(0,actual-padding());state.record.offset=state.latestOffset;sample();
        }
      };
      state.handlers={
        onScroll(offset){state.latestOffset=Math.max(0,offset-padding());if(!state.pending){state.record.offset=state.latestOffset;scheduleSample()}},
        onUserScroll(offset){state.pending=false;state.record.restoring=false;state.latestOffset=Math.max(0,offset-padding());state.record.offset=state.latestOffset;scheduleSample()},
        onApiChange(api){state.api=api;state.props.onApiChange?.(api);if(api)restore()},
        getPending(){return state.pending?state.saved.offset:null},
        restore(){restore()},
        onReady(){state.ready=true;restore();state.props.onVisibleContentReady?.();if(state.pending&&state.frame==null)state.frame=requestAnimationFrame(()=>{state.frame=null;restore(true)})},
        onRestoreStateChange(value){const layout=sanitizeRestoreState(value);if(layout)state.record.layout=layout;state.props.onRestoreStateChange?.(value);store.persist()},
        dispose(){sample();state.disposed=true;if(state.frame!=null)cancelAnimationFrame(state.frame);state.record.restoring=false;store.persist()}
      };
    }
    React.useLayoutEffect(()=>{
      const offScroll=controller.addScrollListener(state.handlers.onScroll);
      const offUser=controller.addUserScrollListener(state.handlers.onUserScroll);
      return()=>{offScroll();offUser()};
    },[controller.addScrollListener,controller.addUserScrollListener]);
    React.useLayoutEffect(()=>{state.disposed=false;state.record.restoring=state.pending;return()=>state.handlers.dispose()},[]);
    const {conversationKey,...nativeProps}=props;
    const latest=props.entries.at(-1)?.turnKey;
    const retained=[...new Set([...(props.retainedTurnKeys??[]),...(latest==null?[]:[latest])])];
    return jsx(Native,{...nativeProps,initialRestoreState:state.saved.layout,onApiChange:state.handlers.onApiChange,onVisibleContentReady:state.handlers.onReady,onRestoreStateChange:state.handlers.onRestoreStateChange,getPendingRestoreScrollDistanceFromBottomPx:state.handlers.getPending,restoreScrollDistanceFromBottomPx:state.handlers.restore,retainedTurnKeys:retained});
  };
}
