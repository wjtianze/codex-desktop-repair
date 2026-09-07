export function isRecoverableConversation404({serverId,localReady,isError,error,archived,shared}){
 return typeof serverId==="string"&&serverId.length>0&&localReady===true&&isError===true&&!archived&&!shared&&Number(error?.status??error?.statusCode??error?.response?.status)===404;
}
export function makeRecoveryState(id){return{id,attempts:0,total:0,wasActive:false,settledRound:false}}
export function updateRecoveryPhase(state,{turnActive,submitting}){
 if(turnActive||submitting)state.wasActive=true;
 else if(state.wasActive&&!state.settledRound){state.settledRound=true;state.attempts=0}
 return state.settledRound?1:0;
}
export function beginConversation404Recovery(client,id,state,{delays=[250,1000,3000],schedule=setTimeout,clear=clearTimeout}={}){
 let cancelled=false,timer=null,wake=null;
 const cancel=()=>{cancelled=true;if(timer!==null){clear(timer);timer=null}const resolve=wake;wake=null;resolve?.()};
 const done=(async()=>{
  const key=["chatgpt-conversation",id];
  while(!cancelled&&state.attempts<3&&state.total<6){
   await new Promise(resolve=>{wake=resolve;timer=schedule(()=>{timer=null;wake=null;resolve()},delays[state.attempts]??3000)});
   if(cancelled)break;
   const current=client.getQueryState(key);
   if(current?.status==="success")break;
   if(current?.status==="error"&&Number(current.error?.status??current.error?.statusCode??current.error?.response?.status)!==404)break;
   state.attempts++;state.total++;
   try{await client.refetchQueries({queryKey:key,exact:true},{cancelRefetch:false})}catch{}
   if(cancelled)break;
   const next=client.getQueryState(key);
   if(next?.status!=="error"||Number(next.error?.status??next.error?.statusCode??next.error?.response?.status)!==404)break;
  }
 })().catch(()=>{});
 return{cancel,done};
}
export function useConversation404Recovery(React,options){
 const ref=React.useRef(null);
 if(ref.current===null||ref.current.id!==options.serverId)ref.current=makeRecoveryState(options.serverId);
 const state=ref.current,phase=updateRecoveryPhase(state,options),eligible=isRecoverableConversation404(options),client=options.queryClient,id=options.serverId;
 React.useEffect(()=>{
  if(!eligible||typeof client?.refetchQueries!=="function"||typeof client?.getQueryState!=="function"||state.attempts>=3||state.total>=6)return;
  return beginConversation404Recovery(client,id,state).cancel;
 },[client,id,eligible,phase,state]);
 return eligible;
}

