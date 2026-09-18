// Preserve each native Quick Chat row while bounding how many rows are mounted.
// Context updates the row callback without changing its component identity.
export function retainedQuickTurns(entries) {
  const latest=entries.at(-1)?.turnKey;
  return entries.filter(entry=>entry.turnKey===latest||entry.paragen!=null||(entry.turn?.items??[]).some(item=>
    ['chatgpt-writing-block-patch','chatgpt-hosted-widget','mcp-tool-call'].includes(item.type)||
    item.type==='assistant-message'&&typeof item.content==='string'&&/::(?:visualization|writing-block)\b/.test(item.content)
  )).map(entry=>entry.turnKey);
}
export function createQuickTurnWindow({React,jsx,Native,ScrollContext}) {
  const Render=React.createContext(null);
  function Row({entry}) { return React.useContext(Render)(entry); }
  return function QuickTurnWindow({entries,renderEntry,apiRef}) {
    const controller=React.useContext(ScrollContext);
    const next=retainedQuickTurns(entries),cache=React.useRef([]);
    if(next.length!==cache.current.length||next.some((key,index)=>key!==cache.current[index]))cache.current=next;
    const retained=cache.current;
    const onApiChange=React.useCallback(api=>{if(apiRef)apiRef.current=api},[apiRef]);
    if(controller==null)return jsx(React.Fragment,{children:entries.map(renderEntry)});
    return jsx(Render.Provider,{value:renderEntry,children:jsx(Native,{entries,RowComponent:Row,gapPx:6,retainedTurnKeys:retained,preserveMeasuredTurnViewport:true,onApiChange})});
  };
}
