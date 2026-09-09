/** Schedule requested GPU frames while the operator is behind the audience window. */
function initStudioFrameClock() {
  const pending = new Map();
  let sequence = 0, worker = null;
  const background = () => document.hidden && window.__gammaBroadcastActive;
  const fire = id => {
    const frame = pending.get(id);
    if (!frame) return;
    pending.delete(id);
    frame.callback(performance.now());
  };
  const clock = () => {
    if (worker) return worker;
    const source = 'const timers=new Map();onmessage=({data:[action,id]})=>{if(action==="cancel"){clearTimeout(timers.get(id));timers.delete(id);}else{timers.set(id,setTimeout(()=>{timers.delete(id);postMessage(id);},33));}};';
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    try {
      worker = new Worker(url);
      worker.onmessage = event => { if (pending.get(event.data)?.kind === 'worker') fire(event.data); };
      return worker;
    } finally { URL.revokeObjectURL(url); }
  };
  const schedule = (id, frame) => {
    if (background()) {
      try { frame.kind = 'worker'; clock().postMessage(['schedule', id]); return; }
      catch { frame.kind = 'timer'; frame.handle = setTimeout(() => fire(id), 33); return; }
    }
    frame.kind = 'raf'; frame.handle = requestAnimationFrame(() => fire(id));
  };
  const cancel = (id, frame) => {
    if (frame.kind === 'worker') worker?.postMessage(['cancel', id]);
    else if (frame.kind === 'timer') clearTimeout(frame.handle);
    else cancelAnimationFrame(frame.handle);
  };
  window.__gammaFrame = callback => {
    const id = ++sequence, frame = { callback };
    pending.set(id, frame); schedule(id, frame); return id;
  };
  window.__gammaCancelFrame = id => {
    const frame = pending.get(id);
    if (frame) { cancel(id, frame); pending.delete(id); }
  };
  const migrate = () => {
    // Move an already queued rAF as well: a hidden document never invokes it.
    for (const [id, frame] of pending) { cancel(id, frame); schedule(id, frame); }
    if (!background() && worker) { worker.terminate(); worker = null; }
  };
  document.addEventListener('visibilitychange', migrate);
  window.addEventListener('pageshow', migrate);
  window.addEventListener('pagehide', () => { worker?.terminate(); worker = null; });
}
export const studioFrameClockJS = () => `(${initStudioFrameClock.toString()})();`;
