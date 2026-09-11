const previousByScope=new WeakMap();
function closeQuietly(tab,scope,panelId){
  const close=tab?.__localSideRawClose??tab?.onClose;
  try{Promise.resolve(close?.(scope,panelId)).catch(()=>{})}catch{}
}

export function createSideChatTabUpdate(scope,panel,sourceId){
  const listed=(scope.get(panel.tabs$)??[]).find(tab=>tab.props?.conversationId===sourceId&&tab.props?.SideChatTab);
  const original=listed&&scope.get(panel.tabById$,listed.tabId);
  if(!original)throw Error('The original side-chat tab is unavailable.');
  const key=scope.node??scope;
  let backups=previousByScope.get(key);if(!backups){backups=new Map();previousByScope.set(key,backups)}
  let prepared=null,committed=false,discarded=false;
  const current=()=>panel.isCurrentTabInstance(scope,original);
  const pending={tabId:original.tabId,isCurrent:current,
    complete(type,options){if(!current()||type.kind!==original.tabType.kind)return false;prepared=options;return true},
    fail(){prepared=null}
  };
  const commit=()=>{
    if(committed)return;
    if(!prepared||discarded||!current())throw Error('The original side-chat tab changed before the update completed.');
    const live=scope.get(panel.tabById$,original.tabId),nextClose=prepared.onClose;
    const oldClose=original.__localSideRawClose??original.onClose;
    panel.updateTab(scope,original.tabId,{...prepared,tabId:original.tabId,kind:original.kind,title:live.title,
      __localSideRawClose:nextClose,
      onClose(...args){try{nextClose?.(...args)}finally{try{oldClose?.(...args)}finally{backups.delete(original.tabId)}}}
    });
    committed=true;
    const previous=backups.get(original.tabId);backups.set(original.tabId,original);
    if(previous&&previous!==original)closeQuietly(previous,scope,panel.panelId);
  };
  const rollback=()=>{if(committed||discarded)return;discarded=true;closeQuietly(prepared,scope,panel.panelId);prepared=null};
  return {title:original.title,pending,bind(conversationId){
    if(!prepared||prepared.props?.conversationId!==conversationId){rollback();throw Error('The replacement side chat is not ready.');}
    return{conversationId,inPlace:true,commit,rollback};
  }};
}
