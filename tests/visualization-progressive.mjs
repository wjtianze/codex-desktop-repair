import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {readVisualizationMarker,partialVisualizationDirective,createPreviewSession,bindNativePreview,resolveVisualizationSource,findPartialVisualizationStart,isProgressiveVisualizationAttributes} from '../assets/local-visualization-progressive-v1.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const start='\uE200visualize\uE202',end='\uE201',html='<section id="chart">Live <span>value</span><script>globalThis.runs++;</script></section>',marker=start+JSON.stringify({html,title:'Preview'})+end;
for(let at=marker.indexOf('>')+1;at<marker.length-1;at++){const parsed=readVisualizationMarker(marker.slice(0,at));if(parsed)assert.equal(parsed.complete,false)}
assert.equal(readVisualizationMarker(marker).html,html);assert.equal(readVisualizationMarker(start+'{"path":"/tmp/example.html"}'+end),null);assert.equal(partialVisualizationDirective(marker),null);assert.equal(partialVisualizationDirective(marker.slice(0,-1)).block,true);console.log('PASS Partial JSON strings decode without executing code or treating file paths as HTML');
const states=[],sent=[],final=[],controller=new AbortController(),session=createPreviewSession({onState:s=>states.push(s.phase),prepare:async value=>'prepared:'+value});
session.update('<div>one</div>');const ready=bindNativePreview(session.shell,{signal:controller.signal,sendPreview:async value=>sent.push(value),renderComplete:async value=>{final.push(value);return true}});await sleep(130);assert.equal(sent.length,0);ready();await sleep(140);assert.equal(sent.at(-1).html,'prepared:<div>one</div>');
session.update('<div>two</div>');await sleep(140);assert.equal(sent.length,2);assert.equal(sent[0].id,sent[1].id);session.update(html,true);await sleep(10);assert.deepEqual(final,[html]);assert.equal(states.at(-1),'complete');assert.equal(resolveVisualizationSource(session.shell),html);session.update(html,true);await sleep(10);assert.equal(final.length,1);session.dispose();assert.equal(resolveVisualizationSource(session.shell),session.shell);console.log('PASS One session receives progressive updates, finalizes exactly once and exports the actual source');
const blocked=new AbortController(),late=[],session2=createPreviewSession({prepare:async value=>{await sleep(100);return value}});const initial=bindNativePreview(session2.shell,{signal:blocked.signal,sendPreview:async value=>late.push(value),renderComplete:async()=>true});session2.update('<div>cancelled</div>');initial();await sleep(130);blocked.abort();await sleep(140);assert.equal(late.length,0);session2.dispose();console.log('PASS Aborted preview does not deliver late HTML');

const genuiStart='\uE200genui\uE202',icon='<svg><path/></svg>',payload={app_block:{language:'html',entrypoint:'index.html',title:'Two panels',icon_svg:icon,content:html,style_mode:'default',widget_type:'app_block'}};
const genui=genuiStart+JSON.stringify(payload)+end,htmlAt=genui.indexOf('content')+12;
for(let at=htmlAt;at<genui.length;at++){const raw=genui.slice(0,at),parsed=readVisualizationMarker(raw);if(!parsed)continue;assert.notEqual(parsed.html,icon);assert.equal(parsed.kind,'genui');assert.equal(partialVisualizationDirective(raw)?.attributes.marker_type,'genui')}
assert.equal(readVisualizationMarker(genui).html,html);assert.equal(readVisualizationMarker(genuiStart+JSON.stringify({app_block:{icon_svg:icon,title:'No content yet'}})),null);
assert.equal(readVisualizationMarker(genuiStart+JSON.stringify({other_widget:{content:html}})+end),null);
assert.equal(findPartialVisualizationStart('Introduction\n\n'+genui.slice(0,-1)),14);assert.equal(findPartialVisualizationStart('Inline '+genui.slice(0,-1)),undefined);
assert.equal(isProgressiveVisualizationAttributes({marker_type:'genui',marker_text:genui},[{matched_text:genui}],()=>false),false);
console.log('PASS Real app_block genui envelopes preview content during streaming while ignoring icons and unrelated widgets');
