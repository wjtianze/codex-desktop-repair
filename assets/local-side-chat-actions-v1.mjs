export function getOwnedSideChatManager(scope,hostId,managerAtom) {
  const manager=scope.get(managerAtom,hostId);
  if(!manager||typeof manager.then==='function'||typeof manager.getConversation!=='function'||typeof manager.getStreamRole!=='function')throw Error('The local side-chat owner is not available.');
  return manager;
}

export function sideChatActionLabels(locale='en') {
  return {
    regenerate:'Regenerate', pending:'Updating…',
    title:'Update this reply in the current side-chat tab',
    failed:'The side-chat update could not finish. Check the current conversation state.'
  };
}

export function useSideChatMessageActions(React, options) {
  const current=React.useRef(options);current.current=options;
  const busy=React.useRef(false),mounted=React.useRef(true);
  const [pending,setPending]=React.useState(false);
  React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[]);
  const run=React.useCallback(async(kind,turn,message)=>{
    const state=current.current;
    if(!state.isSide||!state.enabled||busy.current||state.conversationId!==options.conversationId||state.hostId!==options.hostId||!turn?.turnId||turn.status==='inProgress'||!state.hasTurn(turn))throw Error('This side-chat action is unavailable.');
    if(kind==='edit'&&(typeof message!=='string'||!message.trim()))throw Error('The edited message must not be empty.');
    busy.current=true;if(mounted.current)setPending(true);
    try{return await state.createBranch(turn,kind==='regenerate'?undefined:message,kind)}
    catch(error){state.onError?.(error);throw error}
    finally{busy.current=false;if(mounted.current)setPending(false)}
  },[options.conversationId,options.hostId]);
  const regenerate=React.useCallback(turn=>run('regenerate',turn),[run]);
  const edit=React.useCallback((turn,message)=>run('edit',turn,message),[run]);
  edit.__localSideHistory=true;edit.regenerate=regenerate;
  return {onEdit:options.isSide&&options.enabled&&!pending?edit:undefined};
}

export async function sideChatReplayItems(turns,readImage) {
  const items=[];
  for(const turn of turns) {
    if(turn.status==='inProgress'||turn.itemsPagination?.hasLoadedOldest===false)throw Error('The earlier side-chat history is not ready.');
    const content=[];
    for(const input of turn.params?.input??[]) {
      if(input.type==='text')content.push({type:'input_text',text:input.text});
      else if(input.type==='image')content.push({type:'input_image',image_url:input.url});
      else if(input.type==='localImage')content.push({type:'input_image',image_url:await readImage(input.path)});
      else if(input.type==='skill'||input.type==='mention')content.push({type:'input_text',text:`[${input.type}: ${input.name??''}](${input.path})`});
      else throw Error('This side-chat input cannot be copied: '+input.type);
    }
    if(content.length)items.push({type:'message',role:'user',content});
    for(const item of turn.items??[])if(item.type==='agentMessage'&&typeof item.text==='string'&&item.text)items.push({type:'message',role:'assistant',content:[{type:'output_text',text:item.text}]});
  }
  return items;
}

export async function branchSideChatTurn({sourceId,turn,sourceTurns=[turn],message,openBranch,getManager,isBranchOpen,seedBranch,edit}) {
  if(!turn?.turnId||turn.status==='inProgress')throw Error('A completed turn is required.');
  const selected=sourceTurns.findIndex(item=>item.turnId===turn.turnId);
  if(selected<0)throw Error('The selected side-chat turn is unavailable.');
  const snapshot=structuredClone(turn),prefix=structuredClone(sourceTurns.slice(0,selected));
  const sourceManager=getManager();
  const items=await sideChatReplayItems(prefix,async path=>{
    const {dataBase64}=await sourceManager.sendRequest('fs/readFile',{path});
    const ext=path.split('.').pop().toLowerCase(),mime=({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'})[ext];
    if(!mime||typeof dataBase64!=='string')throw Error('The earlier image could not be copied.');
    return `data:${mime};base64,${dataBase64}`;
  });
  const opened=await openBranch(turn.turnId,async id=>{
    if(!id||id===sourceId)throw Error('The side-chat branch must be a new conversation.');
    const manager=getManager();
    const state=manager.getConversation(id);
    if(!state?.ephemeral||!state.sideConversation||manager.getStreamRole(id)?.role!=='owner')throw Error('The new side chat is not ready.');
    // Ephemeral threads have no rollout to fork or revert. Copy earlier visible
    // exchanges into a fresh temporary thread, excluding the selected answer.
    if(items.length)await manager.sendRequest('thread/inject_items',{threadId:id,items});
    await seedBranch(manager,id,snapshot,prefix);
  });
  const update=opened?.inPlace===true?opened:null,child=update?update.conversationId:opened;
  if(!child||child===sourceId||!update&&!isBranchOpen(child)){update?.rollback();throw Error('The new side chat was closed.');}
  const manager=getManager();
  if(manager.getStreamRole(child)?.role!=='owner'||!manager.getConversation(child)?.ephemeral){update?.rollback();throw Error('The new side chat is unavailable.');}
  try{await edit(child,turn.turnId,message)}catch(error){
    // Once sending was invoked, show the actual replacement state rather than
    // hiding a possibly accepted request or retrying it automatically.
    update?.commit();throw error;
  }
  update?.commit();
  return child;
}

export function createRegenerateControl({React,jsx}) {
  return function SideChatRegenerate({entry,locale}) {
    const [pending,setPending]=React.useState(false),mounted=React.useRef(true);
    React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[]);
    const action=entry.onEditLastTurnMessage,turn=entry.turn;
    if(!action?.__localSideHistory||entry.isReadOnly||!turn?.turnId||turn.status==='inProgress'||!turn.params?.input?.length)return null;
    const last=turn.items?.findLast(item=>item.type==='agentMessage');
    if(!last||entry.transcriptBlock&&entry.includeTranscriptTurnExtras!==true)return null;
    const labels=sideChatActionLabels(locale);
    return jsx('div',{className:'mt-1 flex items-center',children:jsx('button',{
      type:'button',disabled:pending,title:labels.title,'aria-label':labels.regenerate,
      className:'inline-flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 text-xs text-tertiary hover:text-default disabled:cursor-default disabled:opacity-50',
      onClick:async()=>{if(pending)return;setPending(true);try{await action.regenerate(turn)}catch{}finally{if(mounted.current)setPending(false)}},
      children:pending?labels.pending:labels.regenerate
    })});
  };
}
