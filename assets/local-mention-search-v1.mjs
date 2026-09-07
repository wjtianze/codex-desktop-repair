// Serialize mention history searches per host client. Obsolete queued work is
// discarded; an already running RPC is allowed to settle before the next one.
const queues = new WeakMap();
function abortError(signal) {
  return signal?.reason ?? new DOMException('Mention search was cancelled', 'AbortError');
}
export function searchMentionThreads(client, options, signal) {
  if (signal?.aborted) return Promise.reject(abortError(signal));
  let state = queues.get(client);
  if (!state) queues.set(client, state = {running:false, jobs:[]});
  return new Promise((resolve,reject) => {
    const job = {options,signal,resolve,reject,done:false,abort:null};
    job.abort = () => {
      if (job.done) return;
      job.done = true;
      const index = state.jobs.indexOf(job);
      if (index >= 0) state.jobs.splice(index,1);
      signal?.removeEventListener('abort',job.abort);
      reject(abortError(signal));
    };
    signal?.addEventListener('abort',job.abort,{once:true});
    state.jobs.push(job);
    runNext(client,state);
  });
}
async function runNext(client,state) {
  if (state.running) return;
  const job = state.jobs.shift();
  if (!job) { queues.delete(client); return; }
  state.running = true;
  try {
    if (job.signal?.aborted) throw abortError(job.signal);
    const value = await client.searchThreads({...job.options,signal:job.signal});
    if (!job.done) { job.done = true; job.resolve(value); }
  } catch (error) {
    if (!job.done) { job.done = true; job.reject(error); }
  } finally {
    job.signal?.removeEventListener('abort',job.abort);
    state.running = false;
    runNext(client,state);
  }
}
