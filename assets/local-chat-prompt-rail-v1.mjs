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
      const oldMargin=content.style.marginLeft,oldWidth=content.style.width;
      let applied=false;
      const measure=()=>{
        if(applied){content.style.marginLeft=oldMargin;content.style.width=oldWidth;applied=false}
        const gap=content.getBoundingClientRect().left-scroll.getBoundingClientRect().left;
        if(gap<56){content.style.marginLeft=`${56-gap}px`;content.style.width=`calc(100% - ${56-gap}px)`;applied=true}
      };
      measure();const observer=new ResizeObserver(measure);observer.observe(scroll);
      return()=>{observer.disconnect();if(applied){content.style.marginLeft=oldMargin;content.style.width=oldWidth}if(attribute===null)content.removeAttribute('data-thread-user-message-navigation-content');else content.setAttribute('data-thread-user-message-navigation-content',attribute)};
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
