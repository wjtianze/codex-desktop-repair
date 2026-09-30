const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const read=kind=>fs.readFileSync('build/fixtures/render/'+kind+'/slider.js','utf8');
function harness(kind){
 const source=read(kind),cache=Array(240).fill(Symbol.for('react.memo_cache_sentinel')),slots=[];let cursor=0,view,props;
 const selections=[],commits=[],previews=[];
 const React={useState(value){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v]},useReducer(fn,value){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],v=>slots[i]=fn(slots[i],v)]},useRef(value){const i=cursor++;return slots[i]??=( {current:value})},useEffect(){},useEffectEvent(fn){return fn}};
 const jsx=(type,props)=>({type,props}),ctx={xt:{},At:1,pt:1,Q:1,Z:1,vt:28,mt:1,s:()=>0,dt:{c:()=>cache},Y:React,X:{jsx,jsxs:jsx},t:()=>false,L:()=>({jump(){}}),f:()=>0,n:{span:'span'},a:'presence',ne:'presence',ft:'track',p:'slider-part',ne:'thumb',ee:'root',ye:'canvas',Ae:'particles',ce:'fast',pe:'burst',n:'lock',J:new Proxy({},{get:(_,key)=>key}),window:{setTimeout:()=>1,clearTimeout(){}},queueMicrotask:()=>{},_t:new Set(),Ft:{previewIndex:null,previewBaseOptionId:null,previewOptionIds:[],maxBurstKey:0},Pt:30,Nt:160,WheelEvent:{DOM_DELTA_PIXEL:0}};
 for(const key of ["J","Y","ft","gt","_t","st","ct","ot"])ctx[key]??=1;
 for(const key of ["kt","vt","Ct","yt","wt","St","Et","bt","Tt","Dt","Ot","Mt","jt","Ot","wt","kt","Tt","kt","Et","St"])ctx[key]??={};
 const end=source.indexOf("var dt,Y,X");vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf("function et("),end)+";this.component=et",ctx);
 props={active:true,options:[{id:'a'},{id:'b'},{id:'c',isMax:true},{id:'locked',isLocked:true}],selectedOptionId:'a',onSelectOption:v=>selections.push(v.id),onCommitOption:(v,b)=>commits.push([v.id,b.id]),onDragToMax(){},onPreviewOption:v=>previews.push(v)};
 const render=()=>{cursor=0;view=ctx.component(props);return view.props.children.props};
 return {render,props,selections,commits,previews,wheel:e=>cache[53](e)};
}
const event={stopPropagation(){},clientX:0,clientY:0,buttons:1};
function test(name,fn){fn();console.log('PASS '+name)}
test('Native baseline broadcasts every crossed option; patched dragging only previews',()=>{
 for(const kind of ['raw','patches']){const h=harness(kind);h.render().onPointerDown(event);for(let i=0;i<100;i++)h.render().onValueChange([i%2+1]);assert.equal(h.selections.length,kind==='raw'?100:0);if(kind==='patches'){h.render().onValueCommit([2]);assert.deepEqual(h.selections,['c']);assert.deepEqual(h.commits,[['c','a']]);}}
});
test('Pointer cancellation restores original selection without a save',()=>{const h=harness('patches');h.render().onPointerDown(event);h.render().onValueChange([2]);assert.deepEqual(Array.from(h.render().value),[2]);h.render().onPointerCancel(event);assert.deepEqual(Array.from(h.render().value),[0]);assert.deepEqual(h.selections,[])});
test('Dragging back to the original slot makes no model change',()=>{const h=harness('patches');h.render().onPointerDown(event);h.render().onValueChange([2]);h.render().onValueChange([0]);h.render().onValueCommit([0]);assert.deepEqual(h.selections,[]);assert.deepEqual(Array.from(h.render().value),[0])});
test('Commit uses current callback after a parent update',()=>{const h=harness('patches');h.render().onPointerDown(event);h.render().onValueChange([1]);const next=[];h.props.onSelectOption=v=>next.push(v.id);h.render().onValueCommit([1]);assert.deepEqual(next,['b']);assert.deepEqual(h.selections,[])});
test('Locked option still reaches native access handler only on release',()=>{const h=harness('patches');h.render().onPointerDown(event);h.render().onValueChange([3]);assert.deepEqual(h.selections,[]);h.render().onValueCommit([3]);assert.deepEqual(h.selections,['locked'])});
test('Disabled slider does not preview or select on value changes',()=>{const h=harness('patches');h.props.disabled=true;h.render().onValueChange([1]);assert.deepEqual(h.selections,[]);assert.deepEqual(Array.from(h.render().value),[0])});
test('Pointer-up and capture loss before native commit still save the final slot once',()=>{const h=harness('patches');h.render().onPointerDown(event);h.render().onValueChange([2]);const root=h.render();root.onPointerUp(event);root.onLostPointerCapture();root.onValueCommit([2]);assert.deepEqual(h.selections,['c'])});
test('Wheel threshold selects and commits once, while Ctrl-wheel is ignored',()=>{const h=harness('patches');h.render();const e={...event,preventDefault(){},deltaX:0,deltaY:-30,deltaMode:0,timeStamp:200};h.wheel(e);assert.deepEqual(h.selections,['b']);assert.deepEqual(h.commits,[['b','a']]);h.wheel({...e,ctrlKey:true});assert.equal(h.selections.length,1)});
