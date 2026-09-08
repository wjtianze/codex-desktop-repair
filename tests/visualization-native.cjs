'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),api=require('../scripts/patcher.cjs'),raw=fs.readFileSync(root+'/build/fixtures/render/raw/initial.js','utf8'),patched=fs.readFileSync(root+'/build/fixtures/render/patches/initial.js','utf8');
const take=(source,a,b)=>{const start=source.indexOf(a),end=source.indexOf(b,start);assert.ok(start>=0&&end>start,a);return source.slice(start,end)};
async function verifyHook(){
  const calls=[],controller=new AbortController();
  const run=vm.runInNewContext(take(patched,'async function*zpa(','async function Bpa(')+';zpa',{Hpa:()=> 'light',Ipa:{sandbox:true},upa:(html)=>{calls.push(['wrap',html]);return html},__localPrepareVisualization:async html=>{calls.push(['prepare',html]);return 'prepared:'+html},Vpa:()=>({}),Upa:()=>({}),Wpa:()=>({}),crypto:{randomUUID:()=> 'synthetic-test-id'}});
  const sandboxApi={async *runWidgetCode(input){calls.push(['run',input]);yield {ok:true}}};
  const output=[];for await(const item of run({fragment:'original',sandboxApi,signal:controller.signal}))output.push(item);
  assert.deepEqual(calls.map(x=>x[0]),['prepare','wrap','run']);assert.equal(calls[2][1].html,'prepared:original');assert.equal(calls[2][1].isFirstParty,false);assert.equal(calls[2][1].hostHandlesFollowUpMessageAuthorization,true);assert.deepEqual(output,[{ok:true}]);console.log('PASS Native sandbox receives prepared HTML and preserves authorization');
}
const builder=vm.runInNewContext(take(raw,'function upa(','function dpa(')+';upa',{Tpa:'__CONTAINER__',jpa:'',wpa:'',Cpa:''});
const nativeCSS=builder('',{innerKit:'__CONTAINER__',reportToHost:false,lockDocumentOverflow:false}).match(/<style[^>]*>[\s\S]*?<\/style>/g).join('');
const literal=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const fragment=fs.readFileSync(path.join(__dirname,'fixtures-support/visualization-legacy.html'),'utf8');
const entry=`<!doctype html><meta charset="utf-8"><script>window.errors=[];window.addEventListener('error',e=>errors.push(e.message));</script><script type="module">
import {prepareVisualization} from '/helper.js';
const prepared=await prepareVisualization(${literal(fragment)});const inert=window.fixtureExecutions===undefined;
document.body.innerHTML=${literal(nativeCSS)}+prepared;
for(const old of [...document.body.querySelectorAll('script')]){const script=document.createElement('script');script.textContent=old.textContent;old.replaceWith(script)}
const visible=()=>[...document.querySelectorAll('[role=tabpanel]')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.id);
const before=visible(),height=document.body.getBoundingClientRect().height,columns=getComputedStyle(document.querySelector('.grid')).gridTemplateColumns;
const numeric=document.getElementById('counter'),slider=document.getElementById('value');slider.value='7';slider.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('b').click();const after=visible();document.getElementById('a').click();
const result={inert,executions:window.fixtureExecutions,before,after,back:visible(),height,columns,nestedScroll:!!document.querySelector('.local-viz-scroll,[data-local-visualization-root]'),math:document.querySelectorAll('math').length,numeric:numeric.textContent,numericIdentity:numeric===document.getElementById('counter'),code:document.getElementById('code').textContent,attribute:document.getElementById('attr').getAttribute('title'),svg:document.getElementById('svg-text').textContent,styled:slider.classList.contains('form-range'),errors:window.errors};
const modern=await prepareVisualization('<div class="viz-grid" hidden id="modern-hidden"><div>hidden</div></div>');const holder=document.createElement('div');holder.innerHTML=modern;document.body.append(holder);result.modernHidden=getComputedStyle(document.getElementById('modern-hidden')).display;
const out=document.createElement('pre');out.id='result';out.textContent=JSON.stringify(result);document.body.append(out);
</script>`;
async function browserTest(){
  const exe=path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Microsoft/Edge/Application/msedge.exe');assert.ok(fs.existsSync(exe),'Microsoft Edge is required for installed-source visualization tests');
  const source=path.join(require('../scripts/windows.cjs').packageInfo().InstallLocation,'app/resources/app.asar'),fd=fs.openSync(source,'r'),routes={'/helper.js':fs.readFileSync(root+'/assets/local-visualization-compat-v1.mjs')};
  try{const h=api.archiveHeader(fd);for(const name of['katex-b55de29d0a06.js','rolldown-runtime-c05d78c594d1.js']){const e=api.getEntry(h.tree,'webview/assets/'+name);routes['/'+name]=api.readExact(fd,e.size,h.offset+Number(e.offset))}}finally{fs.closeSync(fd)}
  const server=http.createServer((req,res)=>{if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(entry)}else if(Object.hasOwn(routes,req.url)){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});res.end(routes[req.url])}else{res.writeHead(404);res.end()}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const destination=path.join(root,'build/results/visualization-browser-'+Date.now());fs.mkdirSync(destination,{recursive:true});
  try{for(const width of[620,1100]){const data=await new Promise((resolve,reject)=>{const child=spawn(exe,['--headless','--disable-gpu','--disable-background-networking','--disable-component-update','--no-first-run','--no-default-browser-check','--user-data-dir='+path.join(destination,'profile-'+width),'--window-size='+width+',1000','--virtual-time-budget=4000','--dump-dom',`http://127.0.0.1:${server.address().port}/`],{windowsHide:true});let output='',errors='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>errors+=x);const timer=setTimeout(()=>{child.kill();reject(Error('Visualization browser timeout'))},25000);child.on('error',reject);child.on('exit',code=>{clearTimeout(timer);fs.writeFileSync(path.join(destination,width+'.log'),errors);try{assert.equal(code,0);const match=output.match(/<pre id="result">([\s\S]*?)<\/pre>/);assert.ok(match,'Browser fixture did not complete');resolve(JSON.parse(match[1].replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>')))}catch(error){fs.writeFileSync(path.join(destination,width+'.html'),output);reject(error)}})});
    assert.equal(data.inert,true);assert.equal(data.executions,1);assert.deepEqual(data.before,['pa']);assert.deepEqual(data.after,['pb']);assert.deepEqual(data.back,['pa']);assert.equal(data.nestedScroll,false);assert.ok(data.height>1000);assert.equal(data.columns.split(' ').length,width<768?1:2);assert.equal(data.math,3);assert.equal(data.numeric,'7');assert.equal(data.numericIdentity,true);assert.equal(data.code,String.raw`\(literal\)`);assert.equal(data.attribute,String.raw`\(attribute\)`);assert.equal(data.svg,String.raw`\(svg\)`);assert.equal(data.styled,true);assert.equal(data.modernHidden,'none');assert.deepEqual(data.errors,[]);console.log('PASS Native styles, tabs, math, original scripts, live values and natural page flow at '+width+'px');
  }}finally{server.close()}
}
(async()=>{await verifyHook();await browserTest()})().catch(error=>{console.error(error.stack);process.exitCode=1});
