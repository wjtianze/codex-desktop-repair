'use strict';
const MAX_LINE_CODE_UNITS=24000;
const MAX_PENDING_LOG_BYTES=8*1024*1024;
function boundLogLine(value){
 const text=typeof value==='string'?value:String(value);
 if(text.length<=MAX_LINE_CODE_UNITS)return text+'\n';
 const marker=' [log truncated; original length '+text.length+' code units] ';
 let head=text.slice(0,MAX_LINE_CODE_UNITS-4096-marker.length),tail=text.slice(-4096);
 const last=head.charCodeAt(head.length-1),first=tail.charCodeAt(0);
 if(last>=0xd800&&last<=0xdbff)head=head.slice(0,-1);
 if(first>=0xdc00&&first<=0xdfff)tail=tail.slice(1);
 return head+marker+tail+'\n';
}
module.exports={boundLogLine,MAX_LINE_CODE_UNITS,MAX_PENDING_LOG_BYTES};
