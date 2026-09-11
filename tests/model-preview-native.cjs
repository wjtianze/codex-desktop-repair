const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const jsx=(type,props)=>({type,props}),find=(node,type)=>{if(!node||typeof node!=='object')return null;if(node.type===type)return node;for(const child of [node.props?.children].flat(Infinity)){const value=find(child,type);if(value)return value}return null};
function hooks(){const values=[],cache=Array(220).fill(Symbol.for('react.memo_cache_sentinel'));let cursor=0;const React={useId:()=> 'test-id',useRef(initial){const i=cursor++;return values[i]??={current:initial}},useState(initial){const i=cursor++;if(!(i in values))values[i]=initial;return[values[i],next=>values[i]=typeof next==='function'?next(values[i]):next]},useLayoutEffect(){},useEffect(){}};return {React,cache,reset:()=>cursor=0};}
function component(source,name,end,globals){const h=hooks(),ctx={...globals,P6:h.React,kOr:h.React,ekr:{c:()=>h.cache},OOr:{c:()=>h.cache},F6:{jsx,jsxs:jsx},k6:{jsx,jsxs:jsx}};const start=source.indexOf('function '+name+'(');const fn=vm.runInNewContext(source.slice(start,source.indexOf(end,start))+';'+name,ctx);return props=>{h.reset();return fn(props)}}
const base={O6:new Proxy({},{get:(_,key)=>key}),Rd:new Proxy({},{get:(_,key)=>key}),X:'message',UOr:'header',COr:'slider',JDr:'power',$Or:p=>!!p.isLocked,QOr:p=>p.reasoningEffort==='ultra',zi:()=>false,ag:()=>({formatMessage:p=>p.defaultMessage}),DOr:p=>p.sliderLabel,HDr:'ComposerNavigation',WDr:{},jT:'check',uNe:'lock'};
const options=[{id:'a',model:'instant',modelLabel:'Instant',sliderLabel:'Instant',reasoningEffort:'none'},{id:'b',model:'thinking',modelLabel:'Thinking',sliderLabel:'Thinking Standard',reasoningEffort:'medium'}];
for(const file of ['primary.js','primary-performance.js']){
 const source=fs.readFileSync('build/fixtures/render/patches/'+file,'utf8'),parent=component(source,"XOr",'function ZOr(',base),child=component(source,"COr",'function wOr(',{...base,wOr:p=>p.isLocked,TOr(){},EOr(){}});
 const saved=[],props={active:true,menuView:'simple',modelListConfig:{options:[]},powerSelections:options,selectedPowerSelection:options[0],selectedEffortLabel:'Instant',onSelectPower:p=>saved.push(p.id),onToggleMenuView(){}};
 let view=parent(props),slider=find(view,'slider'),power=find(child(slider.props),'power');assert.equal(typeof power.props.onPreviewOption,'function');
 power.props.onPreviewOption('b');view=parent(props);assert.equal(find(view,'header').props.selectedEffortLabel,'Thinking Standard');assert.equal(saved.length,0);
 power.props.onPreviewOption(null);view=parent(props);assert.equal(find(view,'header').props.selectedEffortLabel,'Instant');assert.equal(saved.length,0);
 console.log('PASS '+file+' unlocked drag updates heading immediately without saving; cancellation restores label');
 props.powerSelections=[...options,{id:'locked',model:'locked',modelLabel:'Locked model',sliderLabel:'Locked',reasoningEffort:'high',isLocked:true}];
 view=parent(props);power=find(child(find(view,'slider').props),'power');power.props.onPreviewOption('locked');view=parent(props);assert.equal(find(view,'header').props.selectedPowerSelection.isLocked,true);assert.equal(saved.length,0);
 console.log('PASS '+file+' locked preview keeps access state without model mutation');
}
