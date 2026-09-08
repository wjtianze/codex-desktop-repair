const reconciled = new WeakMap();
const finite = value => typeof value === 'number' && Number.isFinite(value);
function sourceMessage(mapping, id) { return mapping?.[id]?.message; }
function recordedEnd(turn, mapping, upperBound) {
  if (finite(turn.workCompletedAtMs)) return turn.workCompletedAtMs;
  const started = turn.workStartedAtMs;
  if (!finite(started)) return undefined;
  let end;
  for (const id of turn.messageIds ?? []) {
    const message = sourceMessage(mapping, id);
    if (!message || message.author?.role === 'user' || message.status === 'in_progress') continue;
    for (const seconds of [message.metadata?.reasoning_end_time, message.update_time, message.create_time]) {
      const candidate = seconds * 1000;
      if (finite(seconds) && candidate >= started && (!finite(upperBound) || candidate <= upperBound)) end = Math.max(end ?? started, candidate);
    }
  }
  return end;
}
export function reconcileHistoricalWorkTurns(turns, mapping) {
  if (!Array.isArray(turns) || turns.length < 2 || !mapping) return turns;
  const prior = reconciled.get(turns);
  if (prior?.mapping === mapping) return prior.result;
  const latestId = turns.at(-1)?.id;
  let changed = false;
  const result = turns.map((entry, index) => {
    const turn = entry.turn;
    if (index === turns.length - 1 || entry.id === latestId || turn?.status !== 'in_progress') return entry;
    const groups = turn.items.filter(item => item.type === 'chatgpt-reasoning-group');
    if (!groups.some(item => !item.completed)) return entry;
    changed = true;
    const next = turns[index + 1].turn;
    const nextUser = (next.messageIds ?? []).map(id => sourceMessage(mapping, id)).find(message => message?.author?.role === 'user');
    const upperBound = finite(nextUser?.create_time) ? nextUser.create_time * 1000 : next.workStartedAtMs;
    const end = recordedEnd(turn, mapping, upperBound);
    return { ...entry, turn: { ...turn, status: 'complete', workCompletedAtMs: end,
      items: turn.items.map(item => item.type !== 'chatgpt-reasoning-group' ? item : {
        ...item, completed: true, items: item.items.map(child => child.type === 'reasoning' && !child.completed ? { ...child, completed: true } : child),
      }),
    } };
  });
  const value = changed ? result : turns;
  reconciled.set(turns, { mapping, result: value });
  return value;
}
export function workPollHints(mapping, currentNode) {
  const found = {}, seen = new Set(); let id = currentNode;
  for (let count = 0; id && !seen.has(id) && count < 128; count++) {
    seen.add(id); const node = mapping?.[id]; if (!node) break;
    const metadata = node.message?.metadata;
    for (const key of ['poll_interval_ms', 'poll_on_websocket_inactivity_ms', 'poll_freshness_max_mins']) if (found[key] == null && finite(metadata?.[key]) && metadata[key] > 0) found[key] = metadata[key];
    if (Object.keys(found).length === 3) break;
    id = node.parent;
  }
  const intervalMs = Math.min(60000, Math.max(5000, found.poll_interval_ms ?? 10000));
  return { intervalMs, silenceMs: Math.min(120000, Math.max(intervalMs, found.poll_on_websocket_inactivity_ms ?? 30000)), freshnessMs: Math.min(240, Math.max(1, found.poll_freshness_max_mins ?? 10)) * 60000 };
}
function activeBranchContains(mapping, from, target) {
  const seen = new Set(); let id = from;
  while (id && !seen.has(id) && seen.size < 10000) { if (id === target) return true; seen.add(id); id = mapping?.[id]?.parent; }
  return false;
}
function contentSize(message) { try { return JSON.stringify(message?.content ?? null).length; } catch { return 0; } }
export function canApplyWorkSnapshot(before, after, snapshot) {
  if (!before || !after || before.mapping !== after.mapping || before.currentNode !== after.currentNode || before.streamRequestId !== after.streamRequestId) return false;
  if (!snapshot?.mapping || !snapshot.current_node || !before.currentNode || !activeBranchContains(snapshot.mapping, snapshot.current_node, before.currentNode)) return false;
  const local = sourceMessage(before.mapping, before.currentNode), remote = sourceMessage(snapshot.mapping, before.currentNode);
  if (local && remote) {
    if (local.status === 'finished_successfully' && remote.status === 'in_progress') return false;
    if (finite(local.update_time) && finite(remote.update_time) && remote.update_time < local.update_time) return false;
    if (snapshot.current_node === before.currentNode && local.content?.content_type === remote.content?.content_type && contentSize(remote) < contentSize(local) && remote.status === 'in_progress') return false;
  }
  return true;
}
export function createWorkProgressMonitor({ refresh, now = Date.now, schedule = setTimeout, unschedule = clearTimeout, document: doc = globalThis.document, window: win = globalThis.window }) {
  let state, timer = null, controller = null, disposed = false, lastActivity = now(), recovery = false, ownMapping, failures = 0, activeSince = lastActivity, generation = 0, applying = false;
  const visible = () => !doc?.hidden;
  const active = () => !disposed && state?.enabled && state.busy && state.serverId != null && visible();
  const clear = () => { if (timer != null) unschedule(timer); timer = null; };
  function queue(delay) { clear(); if (active()) timer = schedule(poll, Math.max(0, delay)); }
  async function poll() {
    timer = null;
    if (!active() || controller) return;
    const hints = workPollHints(state.mapping, state.currentNode);
    if (now() - activeSince > hints.freshnessMs) return;
    const silence = now() - lastActivity;
    if (!recovery && silence < hints.silenceMs) { queue(hints.silenceMs - silence); return; }
    recovery = true;
    const request = new AbortController(), startedGeneration = generation;
    controller = request;
    try {
      const result = await refresh(state, request.signal);
      if (!disposed && !request.signal.aborted && generation === startedGeneration) { applying = true; try { const applied = typeof result?.apply === 'function' ? result.apply() : result; ownMapping = applied?.mapping; failures = 0; } finally { applying = false; } }
    } catch (error) {
      if (!request.signal.aborted) { failures++; if ([401, 403].includes(error?.responseStatus ?? error?.status)) activeSince = -Infinity; }
    } finally {
      if (controller === request) controller = null;
      if (active()) queue(recovery ? Math.min(60000, hints.intervalMs * 2 ** Math.min(failures, 3)) : Math.max(0, hints.silenceMs - (now() - lastActivity)));
    }
  }
  const wake = () => { if (!active()) { clear(); return; } const hints = workPollHints(state.mapping, state.currentNode); queue(recovery || now() - lastActivity >= hints.silenceMs ? 0 : hints.silenceMs - (now() - lastActivity)); };
  doc?.addEventListener?.('visibilitychange', wake); win?.addEventListener?.('online', wake);
  return {
    update(next) {
      const wasActive = !!state?.enabled && !!state.busy && state.serverId != null;
      const changedIdentity = state && (state.serverId !== next.serverId || state.conversationId !== next.conversationId);
      const changedData = state && (state.mapping !== next.mapping || state.currentNode !== next.currentNode);
      if (changedIdentity || changedData && !applying && next.mapping !== ownMapping) { generation++; lastActivity = now(); activeSince = lastActivity; recovery = false; failures = 0; ownMapping = undefined; controller?.abort(); }
      state = next;
      if (!next.enabled || !next.busy || next.serverId == null) { generation++; clear(); controller?.abort(); recovery = false; return; }
      if (!wasActive || changedIdentity) { lastActivity = now(); activeSince = lastActivity; recovery = false; failures = 0; }
      if (!controller && timer == null) { const hints = workPollHints(state.mapping, state.currentNode); queue(recovery ? hints.intervalMs : Math.max(0, hints.silenceMs - (now() - lastActivity))); }
    },
    dispose() { disposed = true; generation++; clear(); controller?.abort(); doc?.removeEventListener?.('visibilitychange', wake); win?.removeEventListener?.('online', wake); },
  };
}
export function useWorkProgressSync(React, options) {
  const latest = React.useRef(options); latest.current = options;
  const monitor = React.useRef(null);
  React.useEffect(() => {
    const id = options.conversationId;
    const instance = createWorkProgressMonitor({ refresh: (state, signal) => latest.current.conversationId === id ? latest.current.refresh(latest.current.scope, state.serverId, signal) : Promise.resolve(null) });
    monitor.current = instance; instance.update(latest.current);
    return () => { instance.dispose(); if (monitor.current === instance) monitor.current = null; };
  }, [options.scope, options.conversationId]);
  React.useEffect(() => { monitor.current?.update(options); }, [options.enabled, options.busy, options.serverId, options.mapping, options.currentNode, options.conversationId]);
}
