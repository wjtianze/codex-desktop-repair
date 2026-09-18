// A single virtualized turn can span thousands of lines. Keep its measured
// geometry while allowing Chromium to skip offscreen Markdown blocks.
const markdownSelector='[class*="_MarkdownRoot_"]';
const tags=new Set(['P','H1','H2','H3','H4','H5','H6','UL','OL','PRE','BLOCKQUOTE','DIV']);
export function boundedTurnRange(compute,options) {
  const count=options.overscanCount,viewport=options.viewportHeightPx;
  if(!(count>0&&Number.isFinite(viewport)&&viewport>0))return compute(options);
  const visible=compute({...options,overscanCount:0});
  const padding=Math.max(400,Math.min(1200,viewport)),distance=Math.max(0,options.distanceFromBottomPx);
  const nearby=compute({...options,overscanCount:0,distanceFromBottomPx:Math.max(0,distance-padding),viewportHeightPx:viewport+padding+Math.min(distance,padding)});
  return{startIndex:Math.max(0,visible.startIndex-count,nearby.startIndex),endIndex:Math.min(options.layout.turnKeys.length,visible.endIndex+count,nearby.endIndex)};
}
export function retainTurnRange(current,next,layout,viewport) {
  if(current.startIndex>next.startIndex||current.endIndex<next.endIndex||current.startIndex<0||current.endIndex>layout.turnKeys.length)return false;
  const top=index=>layout.topOffsetsPx[index]??layout.totalHeightPx;
  const end=range=>range.endIndex===0?0:(layout.topOffsetsPx[range.endIndex-1]??layout.totalHeightPx)+(layout.heightsPx[range.endIndex-1]??0);
  const limit=Math.max(400,Math.min(1200,Number.isFinite(viewport)?viewport:0));
  return top(next.startIndex)-top(current.startIndex)<=limit&&end(current)-end(next)<=limit;
}
export function attachChatBlockVisibility(getScrollElement,view=globalThis) {
  let frame=null,disposed=false,cleanup=()=>{};
  const attach=()=>{
    frame=null;if(disposed)return;
    const scroll=getScrollElement();
    if(scroll){cleanup=observeChatBlockVisibility(scroll);return}
    frame=view.requestAnimationFrame(attach);
  };
  // Child layout effects can run before the enclosing scroll ref is attached.
  // Wait until after the commit instead of permanently accepting a null ref.
  frame=view.requestAnimationFrame(attach);
  return()=>{disposed=true;if(frame!==null)view.cancelAnimationFrame(frame);cleanup()};
}
export function observeChatBlockVisibility(scroll) {
  const view=scroll?.ownerDocument?.defaultView;
  if(!view?.CSS?.supports('content-visibility','auto')||!view.CSS.supports('contain-intrinsic-block-size','auto 1px'))return()=>{};
  const records=new Map(),pending=new Set();let frame=null,disposed=false,refresh=false,lastWidth=null;
  const restore=(element,record)=>{
    if(element.style.contentVisibility==='auto')element.style.contentVisibility=record.visibility;
    if(element.style.containIntrinsicBlockSize===record.appliedSize)element.style.containIntrinsicBlockSize=record.size;
  };
  const schedule=()=>{if(!disposed&&frame===null)frame=view.requestAnimationFrame(flush)};
  const enqueue=node=>{
    if(node.nodeType!==1)return;
    if(node.matches(markdownSelector))pending.add(node);
    for(const root of node.querySelectorAll(markdownSelector))pending.add(root);
  };
  function flush(){
    frame=null;if(disposed)return;
    for(const [element,record] of records)if(!scroll.contains(element)){restore(element,record);records.delete(element)}
    if(refresh){for(const [element,record] of records)restore(element,record);records.clear();enqueue(scroll);refresh=false}
    const measurements=[];
    // Read all heights before writing any style: no per-block layout flushes.
    for(const root of pending){
      if(!scroll.contains(root))continue;
      for(const element of root.children){
        if(records.has(element)||!tags.has(element.tagName)||element.style.contentVisibility||element.style.containIntrinsicBlockSize)continue;
        if(element.querySelector('iframe,canvas,video,input,textarea,button,[contenteditable="true"],[data-oai-writing-block-surface]'))continue;
        const style=view.getComputedStyle(element);
        if(style.display==='contents'||style.display==='inline'||style.position==='absolute'||style.position==='fixed')continue;
        const height=element.offsetHeight;if(height<=0)continue;
        const size=Math.max(0,height-(parseFloat(style.paddingTop)||0)-(parseFloat(style.paddingBottom)||0)-(parseFloat(style.borderTopWidth)||0)-(parseFloat(style.borderBottomWidth)||0));
        measurements.push([element,{visibility:element.style.contentVisibility,size:element.style.containIntrinsicBlockSize,appliedSize:`auto ${size}px`}]);
      }
    }
    pending.clear();
    for(const [element,record] of measurements){records.set(element,record);element.style.containIntrinsicBlockSize=record.appliedSize;element.style.contentVisibility='auto'}
  }
  const mutations=new view.MutationObserver(changes=>{
    for(const change of changes){
      const parent=change.target.nodeType===1?change.target:change.target.parentElement;
      const root=parent?.closest(markdownSelector);if(root)pending.add(root);
      for(const node of change.addedNodes)enqueue(node);
    }
    schedule();
  });
  mutations.observe(scroll,{subtree:true,childList:true});
  const resize=new view.ResizeObserver(entries=>{
    const width=entries[0]?.contentRect.width;if(!Number.isFinite(width))return;
    if(lastWidth!==null&&Math.abs(width-lastWidth)>.5){refresh=true;schedule()}
    lastWidth=width;
  });
  resize.observe(scroll);enqueue(scroll);schedule();
  const fonts=scroll.ownerDocument.fonts,refreshFonts=()=>{refresh=true;schedule()};
  fonts?.addEventListener('loadingdone',refreshFonts);
  return()=>{disposed=true;mutations.disconnect();resize.disconnect();fonts?.removeEventListener('loadingdone',refreshFonts);if(frame!==null)view.cancelAnimationFrame(frame);for(const [element,record] of records)restore(element,record);records.clear();pending.clear()};
}
