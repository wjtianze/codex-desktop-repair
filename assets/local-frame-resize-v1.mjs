// Keep virtualizer DOM reconciliation out of ResizeObserver's delivery loop.
export function createFrameResizeObserver(callback, host=globalThis){
 let frame=null,disposed=false;
 const pending=new Map();
 const observer=new host.ResizeObserver(entries=>{
  if(disposed)return;
  for(const entry of entries)pending.set(entry.target,entry);
  if(frame===null)frame=host.requestAnimationFrame(()=>{
   frame=null;if(disposed)return;
   const entries=[...pending.values()];pending.clear();if(entries.length)callback(entries);
  });
 });
 return {
  observe(target,options){if(!disposed)observer.observe(target,options)},
  unobserve(target){pending.delete(target);observer.unobserve(target)},
  disconnect(){disposed=true;observer.disconnect();pending.clear();if(frame!==null)host.cancelAnimationFrame(frame);frame=null}
 };
}
