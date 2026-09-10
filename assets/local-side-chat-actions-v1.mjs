export function sideChatActionLabels(locale='en') {
  return /^zh\b/i.test(locale) ? {
    regenerate:'重新生成', pending:'正在创建分支…',
    title:'在新的侧边聊天分支中重新生成，保留当前对话',
    failed:'侧边聊天操作未完成，请查看新分支或稍后重试。'
  } : {
    regenerate:'Regenerate', pending:'Creating branch…',
    title:'Regenerate in a new side-chat branch and keep this conversation',
    failed:'The side-chat action could not finish. Check the new branch or try again later.'
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

export async function branchSideChatTurn({sourceId,turn,message,openBranch,getManager,isBranchOpen,seedBranch,edit}) {
  if(!turn?.turnId||turn.status==='inProgress')throw Error('A completed turn is required.');
  const snapshot=structuredClone(turn);
  const child=await openBranch(turn.turnId,async id=>{
    if(!id||id===sourceId)throw Error('The side-chat branch must be a new conversation.');
    const manager=getManager();
    if(manager.getConversation(id)?.historyMode!=='paginated'||manager.getStreamRole(id)?.role!=='owner')throw Error('The new side chat is not ready.');
    // The fork includes this exact completed turn. Seed its existing native
    // projection so editLastUserTurn can retain its inputs and attachments.
    seedBranch(manager,id,snapshot);
  });
  if(!child||child===sourceId||!isBranchOpen(child))throw Error('The new side chat was closed.');
  const manager=getManager();
  if(manager.getStreamRole(child)?.role!=='owner'||manager.getConversation(child)?.historyMode!=='paginated')throw Error('The new side chat is unavailable.');
  await edit(child,turn.turnId,message);
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
