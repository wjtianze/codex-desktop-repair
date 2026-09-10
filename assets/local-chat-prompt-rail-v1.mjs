export function chatPromptItems(entries) {
  const result=[];
  for(const entry of entries??[]) {
    const turnKey=entry.turnKey??entry.id;
    if(!turnKey)continue;
    let current=null;
    for(const [index,item] of (entry.turn?.items??[]).entries()) {
      if(item.type==='user-message') {
        const label=typeof item.message==='string'?item.message:'';
        const currentResponse={value:''};
        current={id:`${entry.id??turnKey}:${index}:user`,turnKey,getLabel:()=>label,getPreview:()=>({outputs:[],response:currentResponse.value})};
        current._response=currentResponse;
        result.push(current);
      } else if(item.type==='assistant-message'&&current) {
        current._response.value=typeof item.content==='string'?item.content:'';
      }
    }
  }
  return result;
}

export function createChatPromptRail({React,jsx,Native}) {
  return function ChatPromptRail({entries,nativeItems,nativeProps,containerRef,apiRef}) {
    const marker=React.useRef(null);
    const items=React.useMemo(()=>nativeItems??chatPromptItems(entries),[entries,nativeItems]);
    React.useLayoutEffect(()=>{
      const root=containerRef?.current??marker.current?.parentElement;
      const scroll=root?.closest('.thread-scroll-container');
      if(!scroll||items.length<4)return;
      const content=scroll.querySelector('[data-thread-user-message-navigation-content]')??root;
      const attribute=content.getAttribute('data-thread-user-message-navigation-content');
      content.setAttribute('data-thread-user-message-navigation-content','');
      const host=scroll.parentElement;
      const compactAttribute=scroll.getAttribute('data-local-compact-prompt-rail');
      const hostAttribute=host.getAttribute('data-local-compact-prompt-rail-host');
      const oldRailLeft=host.style.getPropertyValue('--local-prompt-rail-left');
      scroll.setAttribute('data-local-compact-prompt-rail','');
      host.setAttribute('data-local-compact-prompt-rail-host','');
      const style=document.createElement('style');
      style.textContent=`[data-local-compact-prompt-rail-host] > nav:has([data-thread-user-message-navigation-rail-list]){left:var(--local-prompt-rail-left,4px)!important}
        [data-local-compact-prompt-rail-host] > nav [data-thread-user-message-navigation-item-id]{justify-content:flex-end}
        [data-local-compact-prompt-rail-host] > nav [data-thread-user-message-navigation-item-id] > span{justify-content:flex-end}
        [data-local-compact-prompt-rail-host] > nav [class*="_MarkerLine_"]{transform-origin:right!important}`;
      host.append(style);
      const oldMargin=content.style.marginLeft,oldWidth=content.style.width;
      let applied=false;
      const measure=()=>{
        if(applied){content.style.marginLeft=oldMargin;content.style.width=oldWidth;applied=false}
        const bounds=scroll.getBoundingClientRect();
        const scale=scroll.offsetWidth>0?bounds.width/scroll.offsetWidth:1;
        const gap=(content.getBoundingClientRect().left-bounds.left)/(scale||1);
        // Keep the native 30px markers and 36px hit targets. Count existing
        // transcript padding toward clearance instead of reserving it twice.
        const padding=parseFloat(getComputedStyle(content).paddingLeft)||0;
        const gutter=Math.max(0,32-padding);
        if(gap<gutter){content.style.marginLeft=`${gutter-gap}px`;content.style.width=`calc(100% - ${gutter-gap}px)`;applied=true}
        const hostBounds=host.getBoundingClientRect();
        const hostScale=host.offsetWidth>0?hostBounds.width/host.offsetWidth:1;
        const textLeft=(content.getBoundingClientRect().left-hostBounds.left)/(hostScale||1)+padding;
        host.style.setProperty('--local-prompt-rail-left',`${Math.max(-8,textLeft-40-host.clientLeft)}px`);
      };
      measure();const observer=new ResizeObserver(measure);observer.observe(scroll);
      return()=>{observer.disconnect();style.remove();if(oldRailLeft)host.style.setProperty('--local-prompt-rail-left',oldRailLeft);else host.style.removeProperty('--local-prompt-rail-left');if(compactAttribute===null)scroll.removeAttribute('data-local-compact-prompt-rail');else scroll.setAttribute('data-local-compact-prompt-rail',compactAttribute);if(hostAttribute===null)host.removeAttribute('data-local-compact-prompt-rail-host');else host.setAttribute('data-local-compact-prompt-rail-host',hostAttribute);if(applied){content.style.marginLeft=oldMargin;content.style.width=oldWidth}if(attribute===null)content.removeAttribute('data-thread-user-message-navigation-content');else content.setAttribute('data-thread-user-message-navigation-content',attribute)};
    },[containerRef,items.length>=4]);
    const reveal=React.useCallback(async item=>{
      const root=containerRef?.current??marker.current?.parentElement;
      if(!root)return;
      const find=()=>Array.from(root.querySelectorAll('[data-content-search-unit-key]')).find(node=>node.dataset.contentSearchUnitKey===item.id)??Array.from(root.querySelectorAll('[data-chatgpt-conversation-turn-id]')).find(node=>node.dataset.chatgptConversationTurnId===item.turnKey);
      if(apiRef?.current)await apiRef.current.scrollToKey(item.turnKey,node=>Array.from(node.querySelectorAll('[data-content-search-unit-key]')).find(node=>node.dataset.contentSearchUnitKey===item.id)??node,{align:'top'});
      else find()?.scrollIntoView({behavior:'smooth',block:'start'});
    },[containerRef,apiRef]);
    return jsx('span',{ref:marker,style:{display:'contents'},children:jsx(Native,{items,onRevealItem:reveal,...nativeProps})});
  };
}
