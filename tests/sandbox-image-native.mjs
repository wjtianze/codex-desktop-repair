import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {nativeFunction} from './fixtures-support/native-source.cjs';
import {context} from './sandbox-image-patches.mjs';
const cases=JSON.parse(fs.readFileSync(new URL('fixtures-support/sandbox-image-cases.json',import.meta.url)));
function factory(kind){
 const s=fs.readFileSync(new URL('../build/fixtures/render/'+kind,import.meta.url),'utf8');
 const names=['Iur','aur','Nur','Fur','Rur','qur','Lur','iur','our','yur','bur','xur','Sur','Tur','QO','Eur'];if(s.includes('function __local_uncached_dUr('))names.push('__local_uncached_dUr');
 return vm.runInNewContext(names.map(n=>nativeFunction(s,n)).join('\n')+';({Iur,aur,Nur,qur,iur,yur})',{
  ...context,xO:e=>typeof e==='string'&&e.trim()?e:null,bO:e=>e&&typeof e==='object'?e:null,gO:e=>e.id,jO:e=>e?.content_references??[],vO:e=>e.content.parts.join(''),__localMemoObject:(f,e)=>f(e),VO:'chatgpt-content-reference',zur:/\[([^\]\r\n]+)\]\(/g,
  $O:'\uE200',ek:'\uE201',Osr:()=>false,cur:(_r,index)=>':chatgpt-content-reference{index="'+index+'"}'
 });
}
const before=factory('raw/initial.js');
for(const file of ['patches/initial.js','patches/initial-performance.js']){
 const after=factory(file);
 for(const item of cases){
  const refs=after.Nur({id:'fixture',metadata:{},content:{parts:[item.text]}}),result=after.qur(item.text,refs);
  if(!item.links)assert.equal(result,item.text,item.name);
  if(item.images){
   assert.ok(!result.includes('!:chatgpt-content-reference'),item.name);
   // Server ranges may describe only the URL, link, or the whole image.
   for(const link of after.Iur(item.text).filter(x=>x.matchedText.startsWith('!['))){
    const points=Array.from(item.text),urlStart=points.join('').indexOf('sandbox:',Array.from(item.text).slice(0,link.startIndex).join('').length);
    for(const start of [link.startIndex,link.startIndex+1,Array.from(item.text.slice(0,urlStart)).length]){
     const metadata=[{type:'file',start_idx:start,end_idx:link.endIndex,matched_text:points.slice(start,link.endIndex).join('')}];
     const replaced=after.yur(points,after.iur(item.text,points,metadata,false));
     assert.ok(!replaced.includes('!:chatgpt-content-reference'),item.name+' metadata');
     assert.equal(replaced,points.slice(0,link.startIndex).join('')+':chatgpt-content-reference{index="0"}'+points.slice(link.endIndex).join(''));
    }
   }
  }
 }
 console.log('PASS Native fallback and server-reference paths consume full image syntax: '+file);
}
const broken=cases[0].text,refs=before.Nur({id:'fixture',metadata:{},content:{parts:[broken]}});
assert.ok(before.qur(broken,refs).includes('!:chatgpt-content-reference'));
console.log('PASS Unmodified official fallback reproduces the orphan exclamation mark');
