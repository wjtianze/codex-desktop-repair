'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{build,ROOT}=require('../scripts/patcher.cjs');
function slice(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a);assert.ok(a>=0&&b>a,start);return text.slice(a,b)}
function prepare(source){
 const out=path.join(ROOT,'build','test-build-'+Date.now());build(source,out,{fixtures:true});
 const destination=path.join(ROOT,'build','fixtures'),read=name=>fs.readFileSync(path.join(out,'fixtures',name),'utf8');
 function write(rel,text){const file=path.join(destination,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text)}
 for(const kind of['original','patched']){
  const main=read('main.'+kind+'.js'),initial=read('initial.'+kind+'.js');
  for(const[name,text]of[['main.js',main],['initial.js',initial],['browser-service.mjs',read('browser.'+kind+'.js')]])write('core/'+(kind==='original'?'raw':'patches')+'/'+name,text);
  write('cold/main.'+kind+'.js',main);
  write('host-title/title-'+kind+'.js',slice(main,kind==='original'?'function Sh(':'const __localCatalogPreviewCache=','var Ch='));
  write('title/title-'+kind+'.js',slice(initial,kind==='original'?'function Bun(e,t){':'function __localRepairTitlePreview(e){','var Vun='));
  const fragment=slice(initial,'ZVn=class{','function $Vn()').slice(4).trim();assert.ok(fragment.endsWith('}));'));
  const helpers=slice(initial,'function JVn(','var YVn,');
  write('tracker/tracker-'+kind+'.cjs',helpers+'\nconst YVn={default:values=>values.length?values.reduce((a,b)=>Math.max(a,b)):undefined};const XVn={default:values=>values.reduce((a,b)=>a+b,0)};module.exports='+fragment.slice(0,-4)+';\n');
 }
 const guards=fs.readFileSync(path.join(__dirname,'fixtures-support','main-guards.js'),'utf8');
 assert.ok(read('main.patched.js').includes(guards.trim()),'Core fixture must match the shipped guard');
 write('core/patches/main-guards.js',guards);
 assert.ok(read('primary.patched.js').includes('__localHistoryFilter.useSelectionContext'),'Native menu must retain the tested filter helper');

 const api=require('../scripts/patcher.cjs');
 for(const kind of ['original','patched'])for(const id of ['main','initial','primary','conversation','viewer','logger','state-store','quick-chat','quick-transcript','slider','app-server','chat-code','panel-shell','panel-entry','side-chat','local-thread','local-turn','activity','panel-actions'])write('render/'+(kind==='original'?'raw':'patches')+'/'+id+'.js',read(id+'.'+kind+'.js'));
 const cssFd=fs.openSync(path.join(source,'resources','app.asar'),'r');try{const header=api.archiveHeader(cssFd),name=[...api.entries(header.tree)].map(([name])=>name).find(name=>/^webview\/assets\/app-initial-[\w]+\.css$/.test(name));assert.ok(name);const entry=api.getEntry(header.tree,name);write('render/raw/code-style.css',api.readExact(cssFd,entry.size,header.offset+Number(entry.offset)))}finally{fs.closeSync(cssFd)}
 const rawPrimary=fs.readFileSync(path.join(out,'fixtures','primary.original.js'));
 const primarySpec=api.manifest.files.find(item=>item.id==='primary');
 write('render/patches/primary-performance.js',api.applyPatch(rawPrimary,primarySpec.withoutSidebar));
 write('render/raw/citation-broken.js',read('primary.patched.js'));
 return out;
}
module.exports={prepare};
