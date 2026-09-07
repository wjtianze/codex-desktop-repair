import {open} from 'node:fs/promises';
import {StringDecoder} from 'node:string_decoder';

export const MAX_BATCH_BYTES=4*1024*1024;
export const MAX_SCALAR_CHARS=4096;
const states=new WeakMap();
const special=/["\\\u0000-\u001f]/g;
const white=char=>char===' '||char==='\t'||char==='\r';
const digit=char=>char>='0'&&char<='9';

// Read JSONL metadata without retaining message bodies, images or tool output.
export class CompletionMetadataParser {
  constructor(onRecord){this.onRecord=onRecord;this.peakCaptured=0;this.reset()}
  reset(){this.stack=[];this.root='value';this.token=null;this.invalid=false;this.meta={rootObject:false}}
  top(){return this.stack.at(-1)}
  ready(){const f=this.top();return f?f.type==='object'?f.state==='value':f.state==='value'||f.state==='valueOrEnd':this.root==='value'}
  begin(kind){
    const f=this.top(),m=this.meta;let role='other',target=null;
    if(!f){m.rootObject=kind==='object';role=m.rootObject?'root':'other'}
    else if(f.type==='object'){
      if(f.role==='root'){
        if(f.key==='type'||f.key==='method'){m[f.key]=undefined;target=f.key}
        else if(f.key==='payload'){m.payloadObject=kind==='object';m.payloadType=undefined;m.payloadId=undefined;role=m.payloadObject?'payload':'other'}
        else if(f.key==='params'){m.paramsObject=kind==='object';m.turnObject=false;m.turnId=undefined;role=m.paramsObject?'params':'other'}
      }else if(f.role==='payload'){
        if(f.key==='type'){m.payloadType=undefined;target='payloadType'}
        else if(f.key==='turn_id'){m.payloadId=undefined;target='payloadId'}
      }else if(f.role==='params'&&f.key==='turn'){m.turnObject=kind==='object';m.turnId=undefined;role=m.turnObject?'turn':'other'}
      else if(f.role==='turn'&&f.key==='id'){m.turnId=undefined;target='turnId'}
    }
    return {role,target:kind==='string'?target:null};
  }
  done(){const f=this.top();if(f){f.state='commaOrEnd';f.key=null}else this.root='done'}
  append(text){
    const t=this.token;if(!t.capture||t.overflow)return;
    if(t.raw.length+text.length>t.limit){t.overflow=true;t.raw='';return}
    t.raw+=text;this.peakCaptured=Math.max(this.peakCaptured,t.raw.length);
  }
  stringDone(){
    const t=this.token;let value;
    if(t.capture&&!t.overflow){try{value=JSON.parse('"'+t.raw+'"')}catch{this.invalid=true}}
    this.token=null;
    if(t.key){t.frame.key=value;t.frame.state='colon'}
    else{if(t.target)this.meta[t.target]=value;this.done()}
  }
  numberStep(char){
    const t=this.token,s=t.state;
    if(s==='minus'){if(char==='0')t.state='zero';else if(char>='1'&&char<='9')t.state='int';else return false}
    else if(s==='zero'){if(char==='.')t.state='dot';else if(char==='e'||char==='E')t.state='exp';else return false}
    else if(s==='int'){if(digit(char)){}else if(char==='.')t.state='dot';else if(char==='e'||char==='E')t.state='exp';else return false}
    else if(s==='dot'){if(digit(char))t.state='fraction';else return false}
    else if(s==='fraction'){if(digit(char)){}else if(char==='e'||char==='E')t.state='exp';else return false}
    else if(s==='exp'){if(char==='+'||char==='-')t.state='expSign';else if(digit(char))t.state='expDigits';else return false}
    else if(s==='expSign'){if(digit(char))t.state='expDigits';else return false}
    else if(s==='expDigits'){if(!digit(char))return false}
    return true;
  }
  primitiveDone(){
    const t=this.token;
    const ok=t.kind==='number'?['zero','int','fraction','expDigits'].includes(t.state):t.index===t.word.length;
    if(!ok)this.invalid=true;
    this.token=null;this.done();
  }
  finish(){
    if(this.token&&this.token.kind!=='string')this.primitiveDone();
    const m=this.meta;
    if(!this.invalid&&!this.token&&this.root==='done'&&this.stack.length===0&&m.rootObject){
      if(m.method==='turn/completed'||(m.type==='event_msg'&&['task_complete','turn_aborted'].includes(m.payloadType))){
        const event={type:m.type,method:m.method};
        if(m.payloadObject)event.payload={type:m.payloadType,turn_id:m.payloadId};
        if(m.paramsObject)event.params={turn:m.turnObject?{id:m.turnId}:null};
        this.onRecord?.(event);
      }
    }
    this.reset();
  }
  write(text){
    let i=0;
    while(i<text.length){
      let char=text[i];
      if(char==='\n'){this.finish();i++;continue}
      if(this.invalid){const end=text.indexOf('\n',i);if(end<0)return;i=end;continue}
      if(this.token?.kind==='string'){
        const t=this.token;
        if(t.unicode){if(!/[0-9a-fA-F]/.test(char)){this.invalid=true;continue}this.append(char);t.unicode--;i++;continue}
        if(t.escape){if(char==='u'){this.append(char);t.unicode=4;t.escape=false;i++;continue}
          if(!'"\\/bfnrt'.includes(char)){this.invalid=true;continue}this.append(char);t.escape=false;i++;continue}
        special.lastIndex=i;const match=special.exec(text),end=match?.index??text.length;
        if(t.capture&&!t.overflow)this.append(text.slice(i,end));i=end;if(!match)break;char=text[i];
        if(char==='"'){this.stringDone();i++}
        else if(char==='\\'){this.append(char);t.escape=true;i++}
        else if(char==='\n'){continue}
        else this.invalid=true;
        continue;
      }
      if(this.token){
        const t=this.token;
        if(t.kind==='literal'&&t.index<t.word.length){if(char!==t.word[t.index]){this.invalid=true;continue}t.index++;i++;continue}
        if(t.kind==='number'&&this.numberStep(char)){i++;continue}
        if(white(char)||',]}'.includes(char)){this.primitiveDone();continue}
        this.invalid=true;continue;
      }
      if(white(char)){i++;continue}
      const f=this.top();
      if(f?.type==='object'&&(f.state==='key'||f.state==='keyOrEnd')){
        if(char==='}'&&f.state==='keyOrEnd'){this.stack.pop();this.done();i++;continue}
        if(char!=='"'){this.invalid=true;continue}
        this.token={kind:'string',key:true,frame:f,capture:true,raw:'',limit:128,escape:false,unicode:0};i++;continue;
      }
      if(f?.state==='colon'){if(char!==':'){this.invalid=true;continue}f.state='value';i++;continue}
      if(f?.state==='commaOrEnd'){
        if(char===','){f.state=f.type==='object'?'key':'value';i++;continue}
        if(char===(f.type==='object'?'}':']')){this.stack.pop();this.done();i++;continue}
        this.invalid=true;continue;
      }
      if(f?.type==='array'&&f.state==='valueOrEnd'&&char===']'){this.stack.pop();this.done();i++;continue}
      if(!this.ready()){this.invalid=true;continue}
      if(char==='{'||char==='['){
        const type=char==='{'?'object':'array',{role}=this.begin(type);
        if(this.stack.length>=128){this.invalid=true;continue}
        this.stack.push({type,role,state:type==='object'?'keyOrEnd':'valueOrEnd',key:null});i++;continue;
      }
      if(char==='"'){
        const{target}=this.begin('string');this.token={kind:'string',key:false,target,capture:target!==null,raw:'',limit:MAX_SCALAR_CHARS,escape:false,unicode:0};i++;continue;
      }
      if(char==='-'||digit(char)){
        this.begin('number');this.token={kind:'number',state:char==='-'?'minus':char==='0'?'zero':'int'};i++;continue;
      }
      if('tfn'.includes(char)){
        this.begin('literal');this.token={kind:'literal',word:char==='t'?'true':char==='f'?'false':'null',index:1};i++;continue;
      }
      this.invalid=true;
    }
  }
}

export async function readCompletionEvents(file,session,extract){
  const handle=await open(file,'r');let data,position,stat,reset;
  try{
    stat=await handle.stat();const previous=states.get(session),identity=String(stat.dev)+':'+String(stat.ino);reset=stat.size<session.fileOffset||Boolean(previous&&(previous.file!==file||previous.identity!==identity));
    position=reset?0:session.fileOffset;
    const size=Math.min(MAX_BATCH_BYTES,Math.max(0,stat.size-position));
    data=Buffer.allocUnsafe(size);let used=0;
    while(used<size){const{bytesRead}=await handle.read(data,used,size-used,position+used);if(bytesRead===0)break;used+=bytesRead}
    data=data.subarray(0,used);
  }finally{await handle.close()}
  let state=states.get(session);
  const identity=String(stat.dev)+':'+String(stat.ino);
  if(reset||!state||state.file!==file||state.offset!==position||state.identity!==identity){
    state={file,identity,offset:position,decoder:new StringDecoder('utf8'),parser:new CompletionMetadataParser()};states.set(session,state);
    if(position>0&&session.pendingFragment)state.parser.write(session.pendingFragment);
  }
  const completedTurnIds=new Set(),active=session.activeTurnIds instanceof Map?new Set(session.activeTurnIds.values()):null;
  state.parser.onRecord=event=>{const id=extract(JSON.stringify(event));if(id!=null&&(!active||active.has(id)))completedTurnIds.add(id)};
  try{state.parser.write(state.decoder.write(data));state.offset=position+data.length}
  finally{state.parser.onRecord=null}
  return {completedTurnIds,fileOffset:state.offset,pendingFragment:'',hasMore:state.offset<stat.size,diagnostics:{batchBytes:data.length,peakCapturedCharacters:state.parser.peakCaptured}};
}

