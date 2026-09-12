export function studioProductionCSS() { return `
.gamma-live-panel>header{position:sticky;top:-24px;z-index:2;margin:-24px -24px 16px;padding:24px;background:var(--studio-panel);border-bottom:1px solid var(--studio-line)}
.gamma-review-dialog{font-family:Archivo,system-ui,sans-serif}
.gamma-review-status{font-size:12px;line-height:1.4;white-space:nowrap}
.gamma-review-transport{flex-wrap:wrap}
.gamma-review-transport button{font-size:14px;flex-shrink:0}
.gamma-review-file{font-size:12px;overflow-wrap:anywhere}
.gamma-review-help{font-size:12px}
.gamma-review-actions{flex-wrap:wrap}
@media(max-width:900px){.gamma-live-panel>header{top:-20px;margin:-20px -20px 16px;padding:20px}}
@media(max-width:620px){
.gamma-recording-review{padding:12px}
.gamma-review-dialog{width:100%;max-height:calc(100dvh - 24px);display:block;overflow:auto;box-sizing:border-box}
.gamma-review-head{display:block;padding:20px}
.gamma-review-status{display:inline-block;margin-top:12px}
.gamma-review-body{padding:16px 20px;overflow:visible}
.gamma-review-file{flex-basis:100%;margin:8px 0 0;text-align:left}
.gamma-review-file strong{max-width:100%;white-space:normal}
.gamma-review-foot{display:block;padding:16px 20px}
.gamma-review-help{max-width:none;margin:0 0 16px}
.gamma-review-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gamma-review-actions [data-review-action=save]{grid-column:1/-1}
}

.gamma-production-note{font:500 12px/1.5 Archivo,sans-serif;color:var(--studio-muted);margin:12px 0;overflow-wrap:anywhere}
.gamma-production-note[data-error=true]{color:var(--studio-red)}
.gamma-production-quality button{margin:8px 8px 0 0}
.gamma-production-mix label{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px}
.gamma-production-mix input[type=range]{grid-column:1/-1;width:100%;min-height:44px;accent-color:var(--studio-blue-soft)}
.gamma-production-mix input[type=checkbox]{width:20px;height:20px;accent-color:var(--studio-blue-soft)}
.gamma-production-meter{display:flex;align-items:center;gap:8px;color:var(--studio-ink);font:500 12px/1.5 Archivo,sans-serif}
.gamma-production-meter meter{width:96px;height:12px;accent-color:var(--studio-green)}
.gamma-production-meter[data-clip=true]{color:var(--studio-red)}
.gamma-production-storage{font:500 12px/1.5 Archivo,sans-serif;color:var(--studio-muted)}
.gamma-production-take{padding:16px 0;border-bottom:1px solid var(--studio-line)}
.gamma-production-take p{margin:0 0 8px;font-size:12px;overflow-wrap:anywhere;color:var(--studio-muted)}
.gamma-production-take button{margin:0 8px 8px 0}
`; }

function initStudioProduction() {
  const panel = document.querySelector('.gamma-live-panel'), api = window.__gammaStudio;
  if (!panel || !api) return;
  const node = (tag, props = {}) => Object.assign(document.createElement(tag), props);
  const details = title => {
    const section = node('details'); section.append(node('summary', { textContent: title })); panel.append(section); return section;
  };
  const quality = node('div', { className: 'gamma-production-quality' });
  const qualityNote = node('p', { className: 'gamma-production-note' }); qualityNote.setAttribute('role', 'status');
  const enlarge = node('button', { textContent: 'Enlarge output' });
  const useSource = node('button', { textContent: 'Keep source resolution' });
  quality.append(qualityNote, enlarge, useSource);
  panel.querySelector('[data-live-support]').after(quality);
  enlarge.onclick = () => window.__gammaResizeOutput?.(api.snapshot().output);
  useSource.onclick = () => api.setOutput('source');
  const unblock = node('button', { textContent: 'Activer le son de sortie', hidden: true });
  quality.append(unblock);
  unblock.onclick = async () => { try { await window.__gammaOutputWindow?.__gammaResumeOutputAudio?.(); unblock.hidden = true; } catch { qualityNote.textContent = 'Click in the output window to allow its audio.'; } };

  const devices = details('Devices');
  const selectors = {};
  for (const [kind, title] of [['camera', 'Camera'], ['mic', 'Microphone']]) {
    const label = node('label', { textContent: title }), select = node('select');
    select.setAttribute('aria-label', 'Studio ' + title.toLowerCase()); select.dataset.productionDevice = kind;
    select.append(node('option', { value: '', textContent: 'Default device' })); label.append(select); devices.append(label); selectors[kind] = select;
    select.onchange = async () => { select.disabled = true; try { await api.setDevice(kind, select.value); } finally { select.disabled = false; } };
  }
  const deviceNote = node('p', { className: 'gamma-production-note', textContent: 'You can replace a camera or microphone during a take, including while paused.' }); devices.append(deviceNote);
  async function refreshDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const all = await navigator.mediaDevices.enumerateDevices(), state = api.snapshot();
    for (const [kind, select] of Object.entries(selectors)) {
      const current = state.devices[kind + 'Id'], options = all.filter(d => d.kind === (kind === 'camera' ? 'videoinput' : 'audioinput'));
      const signature = JSON.stringify(options.map(d => [d.deviceId, d.label]));
      if (signature !== select.dataset.signature) {
        select.replaceChildren(node('option', { value: '', textContent: 'Default device' }));
        options.forEach((d, i) => select.append(node('option', { value: d.deviceId, textContent: d.label || 'Device ' + (i + 1) })));
        if (current && !options.some(d => d.deviceId === current)) select.append(node('option', { value: current, textContent: 'Disconnected device' }));
        select.dataset.signature = signature;
      }
      select.value = current || '';
    }
  }
  devices.addEventListener('toggle', () => { if (devices.open) refreshDevices().catch(() => {}); });
  navigator.mediaDevices?.addEventListener('devicechange', () => refreshDevices().catch(() => {}));
  // Replace the legacy wizard entry with the selectors that remain usable while recording.
  const configure = panel.querySelector('[data-live=configure]'); configure.hidden = true;

  const mix = details('Program audio'); mix.className = 'gamma-production-mix';
  for (const [key, title] of [['micGain', 'Voice'], ['sharedGain', 'Media and browser']]) {
    const label = node('label', { textContent: title }), value = node('output', { textContent: '100 %' });
    const input = node('input', { type: 'range', min: '0', max: '200', step: '5', value: '100' }); input.setAttribute('aria-label', 'Volume ' + title.toLowerCase()); input.dataset.productionGain = key;
    label.append(value, input); mix.append(label);
    input.oninput = () => { value.value = input.value + ' %'; api.setAudio({ [key]: Number(input.value) / 100 }); };
  }
  const duckLabel = node('label', { textContent: 'Lower media while I speak' }), duck = node('input', { type: 'checkbox' });
  duck.dataset.productionDuck = ''; duckLabel.append(duck); mix.append(duckLabel); duck.onchange = () => api.setAudio({ ducking: duck.checked });
  const stemsLabel = node('label', { textContent: 'Raw tracks for editing (before gain)' }), stems = node('input', { type: 'checkbox' }); stems.dataset.productionStems = ''; stemsLabel.append(stems); mix.append(stemsLabel); stems.onchange = () => api.setAudio({ audioStems: stems.checked });
  mix.append(node('p', { className: 'gamma-production-note', textContent: 'Separate tracks are optional. Muting the microphone also mutes the voice track.' }));
  mix.append(node('p', { className: 'gamma-production-note', textContent: 'The limiter protects the mix. If the signal clips before the mixer, lower the device volume.' }));
  const meter = node('div', { className: 'gamma-production-meter' });
  const meterLabel = node('span', { textContent: 'Audio' }), level = node('meter', { min: -60, max: 0, value: -60 }), peak = node('span', { textContent: '— dBFS' });
  level.setAttribute('aria-label', 'Recorded audio peak'); meter.append(meterLabel, level, peak);
  const storageStatus = node('span', { className: 'gamma-production-storage' }); storageStatus.setAttribute('role', 'status');
  const transport = document.querySelector('.gamma-recording-badge'); transport?.append(meter, storageStatus);
  window.addEventListener('gamma:studio-audio', e => {
    const data = e.detail, db = 20 * Math.log10(Math.max(0.001, data.output || 0)); level.value = db; peak.textContent = db <= -60 ? 'Silence' : db.toFixed(1) + ' dBFS'; meter.dataset.clip = String(!!data.clipping); meterLabel.textContent = data.clipping ? 'Lower gain' : data.ducked ? 'Voice priority' : 'Audio';
  });

  const takes = details('Takes stored on this device');
  const takeList = node('div'), takeStatus = node('p', { className: 'gamma-production-note' }); takeStatus.setAttribute('role', 'status');
  takes.append(takeStatus, takeList);
  const bytes = size => (size / 1048576).toFixed(1) + ' Mo';
  let takeTimer;
  async function refreshTakes() {
    if (!window.__gammaTakeStore) return;
    try {
      const list = await window.__gammaTakeStore.list();
      takeStatus.textContent = list.length ? 'Local copies are retained until deletion. Export important takes.' : 'New takes will be progressively saved here.';
      takeList.replaceChildren();
      for (const take of list) {
        const row = node('article', { className: 'gamma-production-take' }); row.dataset.takeId = take.id;
        row.append(node('p', { textContent: (take.label ? take.label + ' · ' : '') + take.filename + ' · ' + bytes(take.size) + ' · ' + (take.status === 'complete' ? 'Complete' : 'Take to recover') }));
        const restore = node('button', { textContent: 'Review / recover' }), save = node('button', { textContent: 'Export' }), remove = node('button', { textContent: 'Delete' });
        const active = ['starting','countdown','recording','paused','finalizing'].includes(api.snapshot().phase);
        restore.disabled = active || !take.size; save.disabled = active || !take.size; remove.disabled = active;
        restore.onclick = () => api.recover(take.id).catch(e => takeStatus.textContent = e.message);
        save.onclick = async () => { try { const result = await window.__gammaTakeStore.save(take.id); takeStatus.textContent = result.saved ? 'File saved.' : 'Download started. Check the file.'; } catch (e) { takeStatus.textContent = 'Copy retained: ' + e.message; } };
        remove.onclick = async () => { if (remove.dataset.armed !== 'true') { remove.dataset.armed = 'true'; remove.textContent = 'Confirm deletion'; return; } try { await window.__gammaTakeStore.remove(take.id); await refreshTakes(); } catch (e) { takeStatus.textContent = e.message; } };
        row.append(restore, save, remove); takeList.append(row);
      }
    } catch (e) { takeStatus.textContent = 'Local storage unavailable: ' + e.message; }
  }
  takes.addEventListener('toggle', () => { if (takes.open) refreshTakes(); });
  window.addEventListener('gamma:studio-takes', () => { if (!takes.open || takeTimer) return; takeTimer = setTimeout(() => { takeTimer = null; refreshTakes(); }, 1000); });
  window.__gammaTakeStore?.list().then(list => { if (list.some(t => t.size)) { takes.open = true; refreshTakes(); } }).catch(() => {});

  function sync() {
    const state = api.snapshot(), source = state.sourceSettings;
    const desired = { landscape: [1920,1080], portrait: [1080,1920], square: [1080,1080] }[state.output];
    const insufficient = source && desired && (source.width < desired[0] || source.height < desired[1]);
    qualityNote.textContent = source ? 'Captured source: ' + source.width + ' × ' + source.height + (insufficient ? '. Too small for ' + desired.join(' × ') + '.' : '. No artificial upscaling.') : '';
    qualityNote.dataset.error = String(!!insufficient); enlarge.hidden = useSource.hidden = !insufficient;
    if (insufficient) panel.querySelector('[data-live=record]').disabled = true;
    unblock.hidden = !window.__gammaOutputAudioBlocked;
    storageStatus.textContent = state.storage?.error ? 'Storage interrupted' : state.storage?.bytes ? 'Protected · ' + bytes(state.storage.bytes) : '';
    for (const input of mix.querySelectorAll('[data-production-gain]')) { if (document.activeElement !== input) { input.value = String(state.audio[input.dataset.productionGain] * 100); input.previousElementSibling.value = input.value + ' %'; } }
    duck.checked = state.audio.ducking; stems.checked = state.audio.audioStems; stems.disabled = !['ready','setup'].includes(state.phase);
  }
  window.addEventListener('gamma:studio-state', sync); window.addEventListener('gamma:studio-open', sync);
  setInterval(() => { if (!panel.hidden) sync(); }, 1000);
  const applyScene = () => {
    const scene = window.__gammaScenes?.[Reveal.getIndices().h]?.camera;
    api.sceneCamera(scene || null);
    if (!scene) return;
    const camera = document.querySelector('.gamma-camera'), width = Math.max(140,Math.min(innerWidth - 32,innerWidth * (scene.width || .18))), height = width * .625, position = scene.position || 'br';
    camera.style.width = width + 'px'; camera.style.height = height + 'px';
    camera.style.left = (position.endsWith('r') ? innerWidth - width - 24 : 24) + 'px'; camera.style.top = (position.startsWith('b') ? innerHeight - height - 80 : 80) + 'px';
    camera.style.right = camera.style.bottom = 'auto';
  };
  Reveal.on('slidechanged', applyScene); applyScene(); sync();
}
export const studioProductionJS = () => `(${initStudioProduction.toString()})();`;
