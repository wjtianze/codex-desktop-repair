'use strict';
async function connect(url){
 const address=new URL(url);if(!['127.0.0.1','localhost','[::1]'].includes(address.hostname))throw Error('Non-local test browser');
 const socket=new WebSocket(url),pending=new Map(),handlers=new Map();let sequence=0;
 socket.addEventListener('message',event=>{const message=JSON.parse(String(event.data));const request=pending.get(message.id);if(request){pending.delete(message.id);clearTimeout(request.timer);message.error?request.reject(Error(message.error.message)):request.resolve(message.result)}if(message.method)for(const handler of handlers.get(message.method)??[])handler(message.params)});
 socket.addEventListener('close',()=>{for(const value of pending.values()){clearTimeout(value.timer);value.reject(Error('Test browser closed'))}pending.clear()});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Test browser connection timeout')),4000);socket.addEventListener('open',()=>{clearTimeout(timer);resolve()},{once:true});socket.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Test browser connection failed'))},{once:true})});
 return{send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('Test browser request timed out'))},8000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}))})},on(method,callback){const list=handlers.get(method)??[];list.push(callback);handlers.set(method,list)},close(){socket.close()},async evaluate(expression){const value=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(value.exceptionDetails)throw Error(value.exceptionDetails.text);return value.result.value}};
}
module.exports={connect};
