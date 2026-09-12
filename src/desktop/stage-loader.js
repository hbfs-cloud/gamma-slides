/** Share in-flight navigation so Present and a source rebuild cannot abort each other. */
export function createStageRevisionLoader({ getRevision, getUrl }) {
  const pending = new WeakMap();
  return async function loadStageRevision(stage) {
    while (!stage.isDestroyed()) {
      const active = pending.get(stage);
      if (active) {
        await active;
        continue;
      }
      const revision = getRevision();
      if (stage.__gammaRevision === revision) return;
      const url = getUrl();
      const loading = Promise.resolve().then(async () => {
        await stage.loadURL(url);
        stage.__gammaRevision = revision;
      });
      pending.set(stage, loading);
      try {
        await loading;
      } finally {
        if (pending.get(stage) === loading) pending.delete(stage);
      }
      // An edit can land during navigation. Finish on the newest revision.
    }
    throw new Error('The presentation window was closed while loading.');
  };
}
