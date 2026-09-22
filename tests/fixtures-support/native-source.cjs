'use strict';
// Test-only parser from the pinned Node 24 runtime. Never used by installation or launch.
const vm=require('node:vm'),assert=require('node:assert/strict');
const source=process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'];
assert.equal(typeof source,'string','Native-source tests require the supported Node 24 parser');
const moduleState={exports:{}};vm.runInNewContext(source,{exports:moduleState.exports,module:moduleState});
function nativeFunction(source,name){
 let at=source.indexOf('function '+name+'(');if(at<0)at=source.indexOf('function*'+name+'(');
 assert.ok(at>=0,'Missing native function '+name);if(source.slice(at-6,at)==='async ')at-=6;
 const node=moduleState.exports.parseExpressionAt(source,at,{ecmaVersion:'latest'});
 return source.slice(node.start,node.end);
}
function nativeClass(source,name){
 const marker=name+'=class',at=source.indexOf(marker);
 assert.ok(at>=0,'Missing native class '+name);
 const start=at+name.length+1,node=moduleState.exports.parseExpressionAt(source,start,{ecmaVersion:'latest'});
 return source.slice(start,node.end);
}
function nativeExpression(source,marker){
 const at=source.indexOf(marker);assert.ok(at>=0,'Missing native expression '+marker);
 const start=at+marker.length,node=moduleState.exports.parseExpressionAt(source,start,{ecmaVersion:'latest'});
 return source.slice(start,node.end);
}
module.exports={nativeFunction,nativeClass,nativeExpression};
