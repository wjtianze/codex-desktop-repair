export async function saveDownloadedFile(service, loadBlob, fileName, { chunkBytes = 8 * 1024 * 1024 } = {}) {
  if (!Number.isSafeInteger(chunkBytes) || chunkBytes <= 0 || chunkBytes > 8 * 1024 * 1024) throw Error('Invalid download chunk size.');
  const reservation = await service.saveCopy({ __localSavePhase: 'prepare', fileName });
  const requestId = reservation?.requestId;
  if (requestId == null) return { path: null };
  let finished = false;
  try {
    const blob = await loadBlob();
    if (!Number.isSafeInteger(blob?.size) || blob.size < 0 || typeof blob.slice !== 'function') throw Error('The download did not produce a file.');
    for (let offset = 0; offset < blob.size; offset += chunkBytes) {
      const bytes = new Uint8Array(await blob.slice(offset, Math.min(blob.size, offset + chunkBytes)).arrayBuffer());
      await service.saveCopy({ __localSavePhase: 'write', requestId, offset, bytes });
    }
    const result = await service.saveCopy({ __localSavePhase: 'finish', requestId, totalBytes: blob.size });
    finished = true;
    return result;
  } finally {
    if (!finished) { try { await service.saveCopy({ __localSavePhase: 'cancel', requestId }); } catch {} }
  }
}
