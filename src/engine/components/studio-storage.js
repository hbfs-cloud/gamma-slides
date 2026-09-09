/** Incremental browser-local recording journal. No take-sized array during capture. */
function initStudioStorage() {
  const DATABASE = 'gamma-studio-takes-v1';
  const PREVIEW_LIMIT = 128 * 1024 * 1024;
  let opening;
  const request = req => new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const complete = tx => new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('Écriture interrompue.'));
  });
  const open = () => opening ||= new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('Le stockage local est indisponible.')); return; }
    const req = indexedDB.open(DATABASE, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('takes', { keyPath: 'id' });
      req.result.createObjectStore('chunks', { keyPath: ['takeId', 'index'] });
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); opening = null; };
      resolve(db);
    };
    req.onerror = () => { opening = null; reject(req.error); };
  });
  const emit = () => window.dispatchEvent(new Event('gamma:studio-takes'));
  async function get(id) {
    const db = await open();
    return request(db.transaction('takes').objectStore('takes').get(id));
  }
  async function list() {
    const db = await open();
    const takes = await request(db.transaction('takes').objectStore('takes').getAll());
    return takes.sort((a, b) => b.createdAt - a.createdAt);
  }
  async function update(id, patch) {
    const db = await open(), tx = db.transaction('takes', 'readwrite'), done = complete(tx);
    const store = tx.objectStore('takes'), take = await request(store.get(id));
    if (!take) { await done; throw new Error('Prise introuvable.'); }
    const next = { ...take, ...patch, id, updatedAt: Date.now() };
    store.put(next); await done; emit(); return next;
  }
  async function remove(id) {
    const db = await open(), tx = db.transaction(['takes', 'chunks'], 'readwrite'), done = complete(tx);
    tx.objectStore('takes').delete(id);
    tx.objectStore('chunks').delete(IDBKeyRange.bound([id, 0], [id, Number.MAX_SAFE_INTEGER]));
    await done; emit();
  }
  async function create(meta = {}, limits = {}) {
    const db = await open(), id = crypto.randomUUID();
    // Best effort retention against eviction. Denial does not prevent recording.
    navigator.storage?.persist?.().catch(() => {});
    let take = { ...meta, id, createdAt: Date.now(), updatedAt: Date.now(), status: 'recording', size: 0, chunks: 0, durationMs: 0 };
    const tx = db.transaction('takes', 'readwrite'), done = complete(tx);
    tx.objectStore('takes').add(take); await done;
    const maxPendingBytes = limits.maxPendingBytes || 32 * 1024 * 1024;
    const maxPendingChunks = limits.maxPendingChunks || 8;
    let chain = Promise.resolve(), pendingBytes = 0, pendingChunks = 0, failure = null, writeFailure = null, closed = false;
    const writer = {
      id,
      get pendingBytes() { return pendingBytes; },
      get pendingChunks() { return pendingChunks; },
      get error() { return failure; },
      append(blob, patch = {}) {
        if (closed || failure) return Promise.reject(failure || new Error('Prise terminée.'));
        if (!blob.size) return Promise.resolve(take);
        if (pendingBytes + blob.size > maxPendingBytes || pendingChunks >= maxPendingChunks) {
          failure = new Error('Le disque ne suit pas le débit. La prise est arrêtée ; les fragments déjà écrits sont conservés.');
          failure.name = 'BackpressureError';
          return Promise.reject(failure);
        }
        pendingBytes += blob.size; pendingChunks++;
        const write = chain.then(async () => {
          if (writeFailure) throw writeFailure;
          const tx = db.transaction(['takes', 'chunks'], 'readwrite', { durability: 'strict' }), done = complete(tx);
          const next = { ...take, ...patch, id, size: take.size + blob.size, chunks: take.chunks + 1, updatedAt: Date.now() };
          tx.objectStore('chunks').add({ takeId: id, index: take.chunks, blob });
          tx.objectStore('takes').put(next);
          await done; take = next; return take;
        });
        const settled = write.finally(() => { pendingBytes -= blob.size; pendingChunks--; });
        chain = settled.catch(error => { failure ||= error; writeFailure ||= error; });
        return settled;
      },
      async finish(patch = {}) {
        closed = true;
        await chain;
        const final = { ...patch, ...(failure ? { durationMs: take.durationMs } : {}), status: failure ? 'interrupted' : (patch.status || 'complete'), error: failure?.message || failure?.name || patch.error || null };
        try { take = await update(id, final); }
        catch (error) {
          // A full quota may also reject the status update. The previous atomic
          // chunk+metadata transaction is still a complete recovery boundary.
          failure ||= error;
          take = { ...take, status: 'interrupted', error: failure.message || failure.name };
        }
        emit(); return take;
      },
    };
    emit(); return writer;
  }
  async function* chunks(id) {
    const take = await get(id);
    if (!take) throw new Error('Prise introuvable.');
    const db = await open();
    for (let index = 0; index < take.chunks; index++) {
      const row = await request(db.transaction('chunks').objectStore('chunks').get([id, index]));
      if (!row) throw new Error('Fragment manquant : ' + (index + 1));
      yield row.blob;
    }
  }
  async function toBlob(id, limit = PREVIEW_LIMIT) {
    const take = await get(id);
    if (!take) throw new Error('Prise introuvable.');
    if (take.size > Math.min(limit, PREVIEW_LIMIT)) throw new Error('Cette prise dépasse la limite de prévisualisation. Enregistrez-la sur disque pour la regarder.');
    const parts = [];
    for await (const chunk of chunks(id)) parts.push(chunk);
    return new Blob(parts, { type: take.mime || 'video/webm' });
  }
  async function save(id, options = {}) {
    const take = await get(id);
    if (!take?.size) throw new Error('Cette prise ne contient aucun fragment enregistré.');
    const mp4 = take.mime?.includes('mp4'), audio = take.mime?.startsWith('audio/');
    let handle = options.handle;
    if (!handle && window.showSaveFilePicker) handle = await window.showSaveFilePicker({
      suggestedName: take.filename,
      types: [{ description: audio ? 'Audio' : 'Vidéo', accept: audio ? (mp4 ? { 'audio/mp4': ['.m4a'] } : { 'audio/webm': ['.webm'] }) : (mp4 ? { 'video/mp4': ['.mp4'] } : { 'video/webm': ['.webm'] }) }],
    });
    if (handle) {
      const writable = await handle.createWritable();
      try {
        for await (const chunk of chunks(id)) await writable.write(chunk);
        await writable.close();
      } catch (error) { await writable.abort().catch(() => {}); throw error; }
      // Export succeeded even if a full browser quota prevents updating its
      // local bookkeeping. Never report a successfully closed file as failed.
      await update(id, { exportedAt: Date.now() }).catch(() => {});
      return { saved: true, filename: handle.name || take.filename };
    }
    const blob = await toBlob(id), url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = take.filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return { saved: false, downloadStarted: true, filename: take.filename };
  }
  window.__gammaTakeStore = { create, get, list, update, remove, chunks, toBlob, save, previewLimit: PREVIEW_LIMIT };
}
export const studioStorageJS = () => `(${initStudioStorage.toString()})();`;
