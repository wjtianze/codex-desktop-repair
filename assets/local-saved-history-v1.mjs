export function savedHistoryRows(local=[],cloud=[]) {
  const rows=new Map();
  for(const item of local){if(typeof item?.id!=='string'||item.ephemeral===true)continue;const hostId=item.hostId??'local';rows.set('local:'+hostId+':'+item.id,{kind:'local',id:item.id,hostId,cwd:item.cwd,title:item.name?.trim()||item.preview?.trim().slice(0,100)||item.id,updatedAt:Number(item.updatedAt??item.createdAt??0)*1000});}
  for(const target of cloud){const conversation=target.conversation;if(!conversation||target.kind==='optimistic'||typeof target.conversationId!=='string')continue;const origin=conversation.conversation_origin??null;if(origin!==null&&origin!=='tpp')continue;rows.set('chat:'+target.conversationId,{kind:'chat',id:target.conversationId,origin,title:conversation.title?.trim()||target.conversationId,updatedAt:Number(target.recencyAt??0)});}
  return [...rows.values()].sort((a,b)=>b.updatedAt-a.updatedAt);
}
export function filterSavedHistory(rows,query){const text=query.trim().toLocaleLowerCase();return text?rows.filter(row=>row.title.toLocaleLowerCase().includes(text)||row.cwd?.toLocaleLowerCase().includes(text)):rows}

export async function openExistingSavedSide(row,{open}) {
  if(!row||typeof row.id!=='string'||!['local','chat'].includes(row.kind))throw Error('Unknown conversation');
  return open({existingConversation:row,displayTitle:row.title,target:'right'});
}
