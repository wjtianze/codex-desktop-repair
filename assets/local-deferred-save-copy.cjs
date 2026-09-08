'use strict';
const nativeFs = require('node:fs/promises');
const nativePath = require('node:path');
const { randomUUID } = require('node:crypto');
function createDeferredSaveCopy({ fs = nativeFs, path = nativePath, makeId = randomUUID, now = Date.now, ttlMs = 60 * 60 * 1000, maxSessions = 16, chunkLimit = 8 * 1024 * 1024, sweepIntervalMs = 60000 } = {}) {
  const owners = new WeakMap();
  function stateFor(owner) {
    let state = owners.get(owner);
    if (!state) { state = { sessions: new Map(), pendingDialogs: 0, disposed: false, timer: null }; owners.set(owner, state); }
    return state;
  }
  async function fingerprint(file) {
    try { const s = await fs.lstat(file); if (!s.isFile()) throw Error('The selected destination is not a regular file.'); return [s.dev, s.ino, s.size, s.mtimeMs, s.ctimeMs].join(':'); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  function stopEmptyTimer(state) { if (state.sessions.size === 0 && state.timer) { clearInterval(state.timer); state.timer = null; } }
  async function removeTemporary(ticket) {
    const handle = ticket.handle; ticket.handle = null;
    if (handle) await handle.close().catch(() => {});
    if (ticket.createdTemporary) { try { await fs.unlink(ticket.temporary); } catch (e) { if (e.code !== 'ENOENT') throw e; } ticket.createdTemporary = false; }
  }
  async function cancel(state, id) {
    const ticket = state.sessions.get(id);
    if (!ticket) return { path: null };
    state.sessions.delete(id); stopEmptyTimer(state); ticket.cancelled = true;
    if (ticket.active) await ticket.active.catch(() => {});
    await removeTemporary(ticket);
    return { path: null };
  }
  function startTimer(state) {
    if (state.timer) return;
    state.timer = setInterval(() => {
      for (const [id, ticket] of state.sessions) if (!ticket.busy && ticket.expiresAt <= now()) cancel(state, id).catch(() => {});
      stopEmptyTimer(state);
    }, sweepIntervalMs);
    state.timer.unref?.();
  }
  async function exclusive(ticket, action) {
    if (ticket.busy) throw Error('This save request is already writing.');
    if (ticket.cancelled) throw Error('This save request was cancelled.');
    ticket.busy = true;
    const promise = action(); ticket.active = promise;
    try { return await promise; }
    finally { ticket.active = null; ticket.busy = false; }
  }
  async function openTemporary(ticket) {
    if (!ticket.handle) { ticket.handle = await fs.open(ticket.temporary, 'wx', 0o600); ticket.createdTemporary = true; }
    if (ticket.cancelled) throw Error('This save request was cancelled.');
    return ticket.handle;
  }
  return {
    async handle(owner, request, { showSaveDialog, sanitizeFileName, markSaved } = {}) {
      const state = stateFor(owner), phase = request?.__localSavePhase;
      if (state.disposed || owner.isDisposed) throw Error('Workspace file service is disposed');
      if (phase === 'prepare') {
        if (typeof request.fileName !== 'string' || !request.fileName.trim()) throw Error('A file name is required.');
        if (state.sessions.size + state.pendingDialogs >= maxSessions) throw Error('Too many pending file saves.');
        state.pendingDialogs++;
        try {
          const selected = await showSaveDialog({ defaultPath: sanitizeFileName(request.fileName) });
          if (selected.canceled || !selected.filePath) return { requestId: null };
          if (state.disposed || owner.isDisposed) throw Error('Workspace file service is disposed');
          if (!path.isAbsolute(selected.filePath)) throw Error('The selected file path is invalid.');
          const target = path.resolve(selected.filePath), original = await fingerprint(target), id = makeId();
          if (state.disposed || owner.isDisposed) throw Error('Workspace file service is disposed');
          const temporary = path.join(path.dirname(target), '.' + path.basename(target) + '.chatgpt-download-' + id + '.tmp');
          if (path.dirname(temporary) !== path.dirname(target)) throw Error('Invalid save staging path.');
          state.sessions.set(id, { target, temporary, original, handle: null, createdTemporary: false, bytes: 0, expiresAt: now() + ttlMs, busy: false, active: null, cancelled: false });
          startTimer(state);
          return { requestId: id };
        } finally { state.pendingDialogs--; }
      }
      if (phase === 'cancel') return cancel(state, request.requestId);
      if (!['write', 'finish'].includes(phase)) throw Error('Unknown save phase.');
      const ticket = state.sessions.get(request.requestId);
      if (!ticket || ticket.expiresAt <= now()) { if (ticket) await cancel(state, request.requestId); throw Error('This save request has expired.'); }
      return exclusive(ticket, async () => {
        ticket.expiresAt = now() + ttlMs;
        if (phase === 'write') {
          const bytes = request.bytes;
          if (!ArrayBuffer.isView(bytes) || bytes.BYTES_PER_ELEMENT !== 1 || bytes.byteLength > chunkLimit) throw Error('Invalid save chunk.');
          if (!Number.isSafeInteger(request.offset) || request.offset !== ticket.bytes) throw Error('Save chunk is out of order.');
          const handle = await openTemporary(ticket); let offset = 0;
          while (offset < bytes.byteLength) {
            if (ticket.cancelled) throw Error('This save request was cancelled.');
            const result = await handle.write(bytes, offset, bytes.byteLength - offset, ticket.bytes + offset);
            if (!result.bytesWritten) throw Error('The file write made no progress.');
            offset += result.bytesWritten;
          }
          ticket.bytes += bytes.byteLength;
          return { bytesWritten: ticket.bytes };
        }
        if (!Number.isSafeInteger(request.totalBytes) || request.totalBytes !== ticket.bytes) throw Error('The downloaded file size does not match.');
        try {
          const handle = await openTemporary(ticket);
          await handle.sync(); await handle.close(); ticket.handle = null;
          if (ticket.cancelled) throw Error('This save request was cancelled.');
          if (await fingerprint(ticket.target) !== ticket.original) throw Error('The destination changed while the file was downloading. Choose it again to save.');
          if (ticket.cancelled) throw Error('This save request was cancelled.');
          await fs.rename(ticket.temporary, ticket.target); ticket.createdTemporary = false;
          state.sessions.delete(request.requestId); stopEmptyTimer(state);
          markSaved?.(ticket.target);
          return { path: ticket.target };
        } catch (error) {
          state.sessions.delete(request.requestId); stopEmptyTimer(state);
          await removeTemporary(ticket); throw error;
        }
      });
    },
    async dispose(owner) {
      const state = owners.get(owner); if (!state) return;
      state.disposed = true;
      await Promise.allSettled([...state.sessions.keys()].map(id => cancel(state, id)));
      stopEmptyTimer(state);
    },
  };
}
const shared = createDeferredSaveCopy();
module.exports = { createDeferredSaveCopy, handle: shared.handle, dispose: shared.dispose };
