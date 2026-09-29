const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {nativeFunction}=require('./fixtures-support/native-source.cjs'),p=require('../scripts/patcher.cjs');
const spec=p.manifest.files.find(x=>x.id==='initial');
const source=p.applyPatch(fs.readFileSync('build/fixtures/render/raw/initial.js'),spec).toString();
function scene(edge='left',scale=1){
 const listeners=new Map(),frames=new Map(),sizes=[],ends=[],refs=[{current:{startPointer:{x:100,y:100},startSize:500,didMove:false,actionTarget:null}},{current:false}];let id=0,cleanup;
 const context={dnt:{c:n=>Array(n).fill(Symbol.for('react.memo_cache_sentinel'))},my:()=>scale,Js:()=>scale,Uy:{useState:()=>[true,()=>{}],useRef:()=>refs.shift(),useEffect:fn=>{cleanup=fn()}},Wy:{jsx:(_,props)=>props},lnt(){},fnt:4,
  window:{addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)},requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:id=>frames.delete(id)};
 const fn=vm.runInNewContext(["Vy","snt","Hy","cnt"].map(name=>nativeFunction(source,name)).join('\n')+';Vy',context);
 const props=fn({edge,getCurrentSize:()=>500,minimumSize:240,maximumSize:900,defaultSize:500,setSize:n=>sizes.push(n),onResizeEnd:n=>ends.push(n)});
 return{sizes,ends,props,frames,cleanup:()=>cleanup(),event:(type,x,y=100)=>listeners.get(type)?.({clientX:x*scale,clientY:y*scale,pointerId:1,preventDefault(){}}),flush(){const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn())}};
}
let h=scene();for(let x=101;x<=180;x++)h.event('pointermove',x);assert.deepEqual(h.sizes,[]);assert.equal(h.frames.size,1);h.flush();assert.deepEqual(h.sizes,[420]);console.log('PASS High-rate pointer moves apply only the latest width per frame');
h.event('pointermove',190);h.event('pointerup',200);h.flush();assert.deepEqual(h.sizes,[420,400]);assert.deepEqual(h.ends,[400]);console.log('PASS Release commits the exact final position and cancels stale frames');h.cleanup();
h=scene();h.event('pointermove',200);h.cleanup();h.flush();assert.deepEqual(h.sizes,[]);console.log('PASS Effect disposal cancels pending width updates');
for(const edge of ["left","right","top",'bottom']){h=scene(edge,1.25);h.event('pointermove',140,140);h.flush();assert.equal(h.sizes[0],["left","top"].includes(edge)?460:540);h.event('pointercancel',150,150);assert.equal(h.frames.size,0);assert.equal(h.ends.length,1);h.cleanup()}console.log('PASS All panel edges retain zoom coordinates and native cancellation behavior');
h=scene();h.event('pointermove',2000);h.flush();assert.equal(h.sizes[0],240);h.event('pointermove',-2000);h.flush();assert.equal(h.sizes[1],900);h.cleanup();console.log('PASS Native minimum and maximum panel bounds remain enforced');
h=scene();h.props.onKeyDown({key:'ArrowLeft',preventDefault(){},stopPropagation(){}});assert.equal(h.sizes[0],510);h.props.onClick({detail:2,preventDefault(){}});assert.equal(h.sizes[1],500);h.cleanup();console.log('PASS Keyboard resizing and double-click reset remain immediate');
{
 const values=new Map(),sizes=[],animation={stop(){},set:n=>sizes.push(n)};
 const context={my(){throw Error('Panel must not animate')},Op(){throw Error('Panel toggle must not animate transcript width')},Hv:{}};
 for(const key of ["ket","dy","fy","dv","my","ly","uy","Oet","Oet"])context[key]=key;
 values.set("uy",animation);
 const scope={get:key=>values.get(key),set:(key,value)=>values.set(key,typeof value==='function'?value(values.get(key)||0):value)};
 const toggle=vm.runInNewContext(nativeFunction(source,"met")+';'+nativeFunction(source,"Yv")+';Yv',context);
 toggle(scope,true);assert.equal(values.get("ly"),true);assert.equal(sizes.at(-1),1);
 toggle(scope,false);assert.equal(values.get("ly"),false);assert.equal(sizes.at(-1),0);
 console.log('PASS Opening and closing apply the final layout immediately without width animation');
 values.set("dv",true);toggle(scope,false,{restoreFullWidthOnNextOpen:true});assert.equal(values.get("fy"),true);toggle(scope,true);assert.equal(values.get("dv"),true);assert.equal(values.get("fy"),false);
 console.log('PASS Toggle preserves native full-width restoration');
 values.set("ket",true);const count=sizes.length;toggle(scope,false);assert.equal(sizes.length,count);assert.equal(values.get("ly"),true);
 console.log('PASS Native protected panel close remains protected');
 for(const key of ["ry","iy","Zv","ay"])context[key]=key;
 let dismissed=0;context.Mi=()=>dismissed++;values.set("ay",animation);
 const left=vm.runInNewContext(nativeFunction(source,"met")+';'+nativeFunction(source,"qv")+';qv',context);
 values.set("ry",true);left(scope,false,{});assert.equal(sizes.at(-1),0);assert.equal(values.get("Zv"),false);assert.equal(values.get("iy"),true);assert.equal(dismissed,1);
 left(scope,true,{});assert.equal(sizes.at(-1),1);assert.equal(values.get("Zv"),true);assert.equal(values.get("iy"),false);
 console.log('PASS Left navigation toggles immediately and preserves native overlay cleanup');
 context.cy='IW';context.Det='aKi';values.set("aKi",animation);
 const bottom=vm.runInNewContext(nativeFunction(source,"met")+';'+nativeFunction(source,"Jv")+';Jv',context);
 bottom(scope,true);assert.equal(values.get("IW"),true);assert.equal(sizes.at(-1),1);
 bottom(scope,false);assert.equal(values.get("IW"),false);assert.equal(sizes.at(-1),0);
 bottom(scope,true,{animate:false});assert.equal(sizes.at(-1),1);
 console.log('PASS Codex bottom panel toggles immediately while retaining explicit no-animation behavior');
}
