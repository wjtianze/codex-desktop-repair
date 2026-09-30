import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
// Synthetic inputs parsed by the supported client's actual Markdown parser.
// These contain no conversation data or official program source.
const cases=JSON.parse(fs.readFileSync(new URL('fixtures-support/sandbox-image-cases.json',import.meta.url)));
const asts=JSON.parse(fs.readFileSync(new URL('fixtures-support/sandbox-image-asts.json',import.meta.url)));
export const context={Hi:text=>{assert.ok(asts[text],'Missing native-parser fixture');return structuredClone(asts[text])},Cc:()=>null};
const code=['v120-PQn','v120-nQn'].map(name=>fs.readFileSync(new URL('../patches/initial/'+name+'.txt',import.meta.url),'utf8')).join('\n');
const api=vm.runInNewContext(code+';({Iur:non,aur:text=>_on(text,[])})',context);
for(const item of cases){
 const links=api.Iur(item.text),ranges=api.aur(item.text),points=Array.from(item.text);
 assert.equal(links.length,item.links,item.name);assert.equal(ranges.length,item.links,item.name);
 assert.equal(links.filter(x=>x.matchedText.startsWith('![')).length,item.images,item.name);
 for(const link of links){assert.equal(points.slice(link.startIndex,link.endIndex).join(''),link.matchedText);assert.ok(ranges.some(r=>r.startIndex===link.startIndex&&r.endIndex===link.endIndex));assert.ok(link.sandboxHref.startsWith('sandbox:'))}
 console.log('PASS Sandbox image parsing and Unicode ranges: '+item.name);
}
