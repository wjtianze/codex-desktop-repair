const renderCaches = new WeakMap();
const objectCaches = new WeakMap();
const urlCaches = new WeakMap();
const emptyRecord = Object.freeze({});
const emptyTurns = Object.freeze([]);
const isObject = value => value !== null && typeof value === 'object';
const normalizeRecord = value => value == null || (isObject(value) && Object.keys(value).length === 0) ? emptyRecord : value;
// The native query store replaces mappings and metadata when messages change.
// Weak keys let discarded history and its derived data be collected together.
export function memoizeObjectResult(compute, input) {
  if (!isObject(input)) return compute(input);
  let cache = objectCaches.get(compute);
  if (!cache) objectCaches.set(compute, cache = new WeakMap());
  if (cache.has(input)) return cache.get(input);
  const result = compute(input); cache.set(input,result); return result;
}
export function renderConversationCached(compute, conversation, options = {}) {
  if (!conversation) return {conversation:null,turns:emptyTurns};
  const mapping = conversation.mapping;
  if (!isObject(mapping)) return {conversation,turns:compute(conversation,options)};
  let cache = renderCaches.get(compute);
  if (!cache) renderCaches.set(compute, cache = new WeakMap());
  const dependencies = [conversation.current_node ?? null, options.isStreaming ?? false, options.mode ?? 'conversation', normalizeRecord(options.moderationDisclaimersByMessageId), options.getRenderTelemetry];
  const prior = cache.get(mapping);
  if (prior && dependencies.every((value,index)=>Object.is(value,prior.dependencies[index]))) {
    const viewOnly = value => Object.keys(value).every(key=>key === "mapping" || key === "current_node");
    if (conversation !== prior.result.conversation && !(viewOnly(conversation) && viewOnly(prior.result.conversation))) prior.result = {conversation,turns:prior.result.turns};
    return prior.result;
  }
  const result = {conversation,turns:compute(conversation,options)};
  cache.set(mapping,{dependencies,result}); return result;
}
export function memoizeNormalizedUrl(compute, input) {
  if (typeof input !== 'string' || input.length > 4096) return compute(input);
  let state = urlCaches.get(compute);
  if (!state) urlCaches.set(compute, state = {entries:new Map(),units:0});
  const previous = state.entries.get(input);
  if (previous) { state.entries.delete(input); state.entries.set(input,previous); return previous.value; }
  const value = compute(input);
  if (typeof value !== 'string' || value.length > 4096) return value;
  const units = input.length + value.length;
  state.entries.set(input,{value,units}); state.units += units;
  while (state.entries.size > 512 || state.units > 262144) { const key=state.entries.keys().next().value; state.units -= state.entries.get(key).units; state.entries.delete(key); }
  return value;
}
