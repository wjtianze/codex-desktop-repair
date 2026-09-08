// Server-provided search progress only; opening a page requires the native link action.
export function searchProgress(item){
  const queries=[...new Set([...(Array.isArray(item?.action?.queries)?item.action.queries:[]),item?.query].filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim().slice(0,4096)))].slice(0,32);
  const found=new Map();
  const add=(source,kind='result')=>{
    if(typeof source?.url!=='string'||source.url.length>8192)return;
    try{const url=new URL(source.url);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return;
      if(!found.has(url.href))found.set(url.href,{url:url.href,domain:url.hostname.replace(/^www\./,''),title:typeof source.title==='string'?source.title.slice(0,400):null,kind});
    }catch{}
  };
  for(const source of Array.isArray(item?.searchResultSources)?item.searchResultSources.slice(0,100):[])add(source);
  if(['openPage','findInPage'].includes(item?.action?.type))add({url:item.action.url},'page');
  const sources=[...found.values()],domains=[...new Set(sources.map(source=>source.domain))];
  return{queries,sources,domains,complete:item?.completed===true};
}
export function renderWebSearchProgress({jsx,NativeSearch,item,blocked=false,openLink,locale=globalThis.document?.documentElement?.lang||globalThis.navigator?.language||'en'}){
  const data=searchProgress(item),zh=locale.startsWith('zh');
  const link=(source,label,key)=>jsx(blocked?'span':'a',{...blocked?{}:{href:source.url,onClick:event=>{event.preventDefault();openLink?.({event,href:source.url,initiator:'open_in_browser_bridge'})}},title:source.title||source.url,style:{display:'inline-block',maxWidth:'100%',overflowWrap:'anywhere',textDecoration:'none'},children:label},key);
  const chips=data.domains.slice(0,4).map(domain=>{const source=data.sources.find(source=>source.domain===domain);return jsx('span',{style:{border:'1px solid var(--border-subtle, #8884)',borderRadius:'999px',padding:'2px 9px',fontSize:'12px'},children:link(source,domain,domain)},domain)});
  return jsx('div',{'data-local-web-search':true,style:{minWidth:0},children:[
    jsx(NativeSearch,{item},'summary'),
    data.queries.length>1?jsx('details',{style:{marginTop:'4px',fontSize:'12px'},children:[jsx('summary',{style:{cursor:'pointer'},children:zh?`View ${data.queries.length} search queries`:`View ${data.queries.length} search queries`},'toggle'),jsx('ul',{style:{margin:'4px 0',paddingLeft:'20px'},children:data.queries.map((query,index)=>jsx('li',{style:{overflowWrap:'anywhere'},children:query},String(index)))},'queries')]},'queries'):null,
    chips.length?jsx('div',{style:{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'6px'},children:chips},'domains'):null,
    data.sources.length?jsx('details',{style:{marginTop:'5px',fontSize:'12px'},children:[jsx('summary',{style:{cursor:'pointer'},children:zh?`Search sources: ${data.sources.length} pages, ${data.domains.length} sites`:`Search sources: ${data.sources.length} pages, ${data.domains.length} sites`},'toggle'),jsx('ul',{style:{margin:'6px 0',paddingLeft:'20px'},children:data.sources.map(source=>jsx('li',{style:{marginBottom:'6px'},children:link(source,source.title||source.url,source.url)},source.url))},'pages')]},'sources'):null
  ]});
}
