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
  write('host-title/title-'+kind+'.js',slice(main,kind==='original'?'function kb(':'const __localCatalogPreviewCache=','var Ab='));
  write('title/title-'+kind+'.js',slice(initial,kind==='original'?'function n9t(e,t){':'function __localRepairTitlePreview(e){','var r9t='));
  const fragment=slice(initial,'wAn=class{','function EAn()').slice(4).trim();assert.ok(fragment.endsWith('}));'));
  const helpers=slice(initial,'function xAn(','var SAn,');
  write('tracker/tracker-'+kind+'.cjs',helpers+'\nconst SAn={default:values=>values.length?values.reduce((a,b)=>Math.max(a,b)):undefined};const CAn={default:values=>values.reduce((a,b)=>a+b,0)};module.exports='+fragment.slice(0,-4)+';\n');
 }
 const guards=fs.readFileSync(path.join(__dirname,'fixtures-support','main-guards.js'),'utf8');
 assert.ok(read('main.patched.js').includes(guards.trim()),'Core fixture must match the shipped guard');
 write('core/patches/main-guards.js',guards);
 const menu=fs.readFileSync(path.join(__dirname,'fixtures-support','native-menu.js'),'utf8');
 assert.ok(read('primary.patched.js').includes(menu.trim()),'Native menu fixture must match the shipped menu');

 const api=require('../scripts/patcher.cjs');
 for(const kind of ['original','patched'])for(const id of ['main','initial','primary','conversation','viewer','logger','state-store','quick-chat','quick-transcript'])write('render/'+(kind==='original'?'raw':'patches')+'/'+id+'.js',read(id+'.'+kind+'.js'));
 const activityFd=fs.openSync(path.join(source,'resources','app.asar'),'r');try{const header=api.archiveHeader(activityFd),entry=api.getEntry(header.tree,'webview/assets/subagent-activity-chip-group-7235ecadfc3f.js');write('render/raw/activity.js',api.readExact(activityFd,entry.size,header.offset+Number(entry.offset)))}finally{fs.closeSync(activityFd)}
 const rawPrimary=fs.readFileSync(path.join(out,'fixtures','primary.original.js'));
 const primarySpec=api.manifest.files.find(item=>item.id==='primary');
 write('render/patches/primary-performance.js',api.applyPatch(rawPrimary,primarySpec.withoutSidebar));
 const fixedPrimary=read('primary.patched.js'),needle='ci(a.library_file_id)!=null||__localIsCompactFileCitation(a)';
 assert.equal(fixedPrimary.split(needle).length,2);
 write('render/raw/citation-broken.js',fixedPrimary.replace(needle,needle.slice(0,-1)+',o)'));
 return out;
}
module.exports={prepare};

