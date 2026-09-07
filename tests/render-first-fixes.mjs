// Non-English strings below are intentional synthetic Unicode test data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {isInternalRetrievalImageMessage,isCompactPdfCitation} from '../assets/local-conversation-render-fixes-v1.mjs';
const root=new URL('../build/fixtures/render/',import.meta.url),cases=[];
function factory(folder){const s=fs.readFileSync(new URL(folder+'/initial.js',root),'utf8'),a=s.indexOf('function dKr('),b=s.indexOf('var hKr',a);assert.ok(a>=0&&b>a);return vm.runInNewContext(s.slice(a,b)+';dKr',{IL:v=>v&&typeof v==='object'&&!Array.isArray(v)?v:null,LL:v=>typeof v==='string'&&v.trim()?v:null,PL:e=>e.id,vTr:e=>e.output??[],__localIsRetrievalImage:isInternalRetrievalImageMessage})}
const before=factory('raw'),after=factory('patches');
const asset=(metadata=null)=>({content_type:'image_asset_pointer',asset_pointer:'sediment://fixture/page',width:512,height:512,size_bytes:123,metadata});
const message=(name,role='tool',count=1)=>({id:'fixture-message',author:{role,name},metadata:{is_visually_hidden_from_conversation:false,model_slug:'fixture-thinking'},content:{content_type:'multimodal_text',parts:Array.from({length:count},()=>asset())}});
const run=m=>after(m,{isActiveTurn:false,isStreaming:false});
const normalized=v=>JSON.parse(JSON.stringify(v));
function test(name,fn){fn();cases.push(name);console.log('PASS '+name)}
test('The actual 150-image file-search shape no longer creates an AI gallery',()=>{const m=message('file_search','tool',150);assert.equal(before(m,{isActiveTurn:false,isStreaming:false}).length,150);assert.equal(run(m).length,0)});
test('Namespaced file-search results are treated as retrieval output',()=>{for(const name of['file_search.msearch','file_search.mclick'])assert.equal(run(message(name)).length,0)});
test('Ordinary generated images and Python plots retain their original metadata',()=>{for(const name of['image_gen.text2im','dalle.text2im','python','file_search_custom']){const m=message(name);assert.deepEqual(normalized(run(m)),normalized(before(m,{isActiveTurn:false,isStreaming:false})));assert.equal(run(m).length,1)}});
test('Direct assistant pictures remain visible and user pictures keep their separate path',()=>{assert.equal(run(message(null,'assistant')).length,1);assert.equal(run(message(null,'user')).length,0)});
test('Native image-generation calls and their pending status remain intact',()=>{const m={...message(null,'assistant',0),output:[{type:'image_generation_call',id:'g',status:'in_progress'}]};assert.deepEqual(normalized(run(m)),normalized(before(m,{isActiveTurn:false,isStreaming:false})));assert.equal(run(m)[0].status,'in_progress')});
test('File citations use compact presentation independent of their extension',()=>{assert.equal(isCompactPdfCitation({type:'file',source:'my_files'},'reference.html'),true);assert.equal(isCompactPdfCitation({type:'file',input_pointer:{message_id:'fixture'}},'notes.docx'),true);assert.equal(isCompactPdfCitation({type:'file',source:'my_files'},'artifact-card'),false);assert.equal(isCompactPdfCitation({type:'file',source:'my_files'},'教材.PDF'),true);assert.equal(isCompactPdfCitation({type:'file',matched_text:'filecite:fixture'},'reference.pdf'),true)});
test('Generated downloads and unrelated document types keep the original presentation',()=>{for(const [r,name]of[[{type:'file',source:'python'},'report.pdf'],[{type:'file_navlist',source:'my_files'},'list.pdf'],[{type:'file',source:'my_files',source_type:'library_folder'},'folder.pdf']])assert.equal(isCompactPdfCitation(r,name),false)});
fs.writeFileSync(new URL('first-fix-tests.json',root),JSON.stringify({passed:true,cases},null,2));

