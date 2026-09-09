export function threeExplorationCSS() { return `
  .d3-depth-scene { display:none; position:absolute; inset:0; overflow:hidden; background:var(--gamma-bg); }
  .d3-webgpu-stage[data-d3-view="3d"] .d3-depth-scene { display:block; }
  .d3-webgpu-stage[data-d3-view="3d"] :is(.d3-webgpu-canvas,.d3-webgpu-fallback) { visibility:hidden!important; }
  .d3-webgpu-stage[data-d3-view="3d"] :is(.d3-webgpu-heading p,.d3-webgpu-readout) { display:none; }
  .d3-depth-viewport { position:absolute; inset:56px 0 44px; }
  .d3-depth-scene canvas { position:absolute; inset:0; width:100%; height:100%; cursor:grab; touch-action:none; }
  .d3-depth-scene canvas:active { cursor:grabbing; }
  .d3-depth-labels { position:absolute; inset:0; pointer-events:none; }
  .d3-depth-leaders { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
  .d3-depth-leaders line { stroke:var(--gamma-muted); stroke-width:.65; opacity:.6; }
  .d3-depth-axis-key { display:flex; gap:24px; position:absolute; left:0; right:0; bottom:26px; margin:0; padding:0; list-style:none; color:var(--gamma-secondary); font:450 11px/1.5 Archivo,sans-serif; }
  .d3-depth-label { position:absolute; color:var(--gamma-text); font:550 12px/1.25 Archivo,sans-serif; transform:translate(-50%,-50%); white-space:nowrap; }
  .d3-depth-label[data-kind="tick"] { color:var(--gamma-muted); font-size:10px; }
  .d3-depth-label[data-kind="axis"] { display:none; }
  .d3-depth-label[data-selected="true"] { color:var(--gamma-primary); font-weight:700; }
  .d3-depth-toolbar { position:absolute; inset:0 0 auto; display:flex; justify-content:space-between; gap:16px; z-index:2; }
  .d3-depth-select { max-width:220px; min-width:0; min-height:44px; color:var(--gamma-text); background:var(--gamma-bg); border:0; border-bottom:1px solid var(--gamma-muted); border-radius:0; font:550 12px/1.4 Archivo,sans-serif; text-overflow:ellipsis; cursor:pointer; }
  .d3-depth-select:focus-visible { outline:2px solid var(--gamma-primary); outline-offset:4px; }
  .d3-depth-scene .d3-depth-selection { position:absolute; top:0; left:240px; right:170px; display:flex; align-items:center; min-height:44px; margin:0; color:var(--gamma-text); font:550 12px/1.4 Archivo,sans-serif; font-variant-numeric:tabular-nums; }
  .d3-depth-controls { display:flex; gap:8px; flex-shrink:0; }
  .d3-depth-controls button { min-width:44px; border:0; background:var(--gamma-bg); padding:8px; }
  .d3-depth-controls button svg { margin:0; }
  .d3-depth-scene .d3-depth-instruction { position:absolute; bottom:0; left:0; margin:0; color:var(--gamma-muted); font:450 10px/1.4 Archivo,sans-serif; }
  .d3-depth-toggle[aria-pressed="true"] { color:var(--gamma-primary); }
  @media(max-width:900px) { .d3-depth-toolbar { gap:12px; } .d3-depth-select { flex:1; width:0; } .d3-depth-scene .d3-depth-selection { top:48px; left:0; right:0; min-height:40px; font-size:12px; } .d3-depth-viewport { inset:92px 0 74px; } .d3-depth-label { font-size:10px; } .d3-depth-axis-key { display:block; bottom:20px; font-size:10px; } .d3-webgpu-stage[data-d3-view="3d"] .d3-webgpu-plot { min-height:430px; } }
  @media print { .d3-depth-scene { display:none!important; } .d3-webgpu-stage[data-d3-view="3d"] .d3-webgpu-fallback { visibility:visible!important; } }
`; }

function initThreeExploration() {
  const T = window.GammaThree;
  const toggles = [...document.querySelectorAll('.d3-depth-toggle')];
  if (!toggles.length) return;
  const states = [];
  const params = new URLSearchParams(location.search);
  const exported = params.has('gamma-export') || params.has('print-pdf') || document.documentElement.classList.contains('gamma-export');
  const printing = matchMedia('print');
  const request = state => {
    if (state.frame || !state.renderer || !state.active || (document.hidden && !window.__gammaBroadcastActive)) return;
    state.frame = (window.__gammaFrame || requestAnimationFrame)(() => { state.frame = 0; render(state); });
  };
  function render(state) {
    if (!state.renderer || !state.active) return;
    const radius = 11;
    state.camera.position.set(Math.sin(state.azimuth) * Math.cos(state.elevation) * radius, Math.sin(state.elevation) * radius, Math.cos(state.azimuth) * Math.cos(state.elevation) * radius);
    state.camera.lookAt(0, 0, 0); state.camera.updateMatrixWorld();
    const aspect = state.width / state.height;
    let fittedHeight = state.baseViewHeight;
    for (const bound of state.fitBounds) {
      const p = bound.position.clone().applyMatrix4(state.camera.matrixWorldInverse);
      fittedHeight = Math.max(fittedHeight, 2 * (Math.abs(p.x) + bound.radius) / aspect, 2 * (Math.abs(p.y) + bound.radius));
    }
    // Keep the authored opening frame; widen only when an allowed pose needs it.
    if (fittedHeight > state.baseViewHeight) fittedHeight *= 1 + 12 / Math.min(state.width,state.height);
    state.camera.left = -fittedHeight * aspect / 2; state.camera.right = fittedHeight * aspect / 2;
    state.camera.top = fittedHeight / 2; state.camera.bottom = -fittedHeight / 2; state.camera.updateProjectionMatrix();
    state.renderer.render(state.scene, state.camera); state.draws++;
    state.host.dataset.depthDraws = String(state.draws);
    const occupied = [], leaders = [];
    const spheres = state.points.map(mesh => { const p = mesh.position.clone().project(state.camera); return { x:(p.x + 1) * state.width / 2, y:(1 - p.y) * state.height / 2, r:mesh.geometry.parameters.radius * state.height / (state.camera.top - state.camera.bottom) }; });
    const rect = (x, y, w, h, pad = 4) => ({ left:x - w / 2 - pad, right:x + w / 2 + pad, top:y - h / 2 - pad, bottom:y + h / 2 + pad });
    const intersects = (a, b) => Math.min(a.right,b.right) > Math.max(a.left,b.left) && Math.min(a.bottom,b.bottom) > Math.max(a.top,b.top);
    state.labels.filter(label => label.kind !== 'axis').forEach(label => {
      label.element.style.removeProperty('display');
      const point = label.position.clone().project(state.camera);
      const px = (point.x + 1) * state.width / 2, py = (1 - point.y) * state.height / 2;
      let x = px, y = py;
      label.element.textContent = label.name;
      const w = label.element.offsetWidth, h = label.element.offsetHeight;
      if (label.kind === 'point') {
        const r = spheres[label.index].r, candidates = [];
        for (const dy of [-1,1]) for (const dx of [-1,0,1]) candidates.push({ x:px + dx * (w / 2 + r + 8), y:py + dy * (h / 2 + r + 8) });
        for (const dx of [-1,1]) candidates.push({ x:px + dx * (w / 2 + r + 10), y:py });
        // Search the nearby free field when a point is close to another label.
        for (let cy = h / 2 + 4; cy <= state.height - h / 2 - 4; cy += 12) for (let cx = w / 2 + 4; cx <= state.width - w / 2 - 4; cx += 16) candidates.push({x:cx,y:cy});
        const scored = candidates.map(candidate => {
          const box = rect(candidate.x,candidate.y,w,h);
          const collisions = occupied.filter(other => intersects(box,other)).length + spheres.filter(sphere => intersects(box,rect(sphere.x,sphere.y,sphere.r * 2,sphere.r * 2,3))).length;
          const outside = box.left < 0 || box.right > state.width || box.top < 0 || box.bottom > state.height;
          return { ...candidate, score:Math.hypot(candidate.x-px,candidate.y-py) + collisions * 10000 + (outside ? 100000 : 0) };
        }).sort((a,b) => a.score - b.score);
        x = scored[0].x; y = scored[0].y;
      }
      x = Math.max(w / 2 + 2, Math.min(state.width - w / 2 - 2, x));
      y = Math.max(h / 2 + 2, Math.min(state.height - h / 2 - 2, y));
      // A near-overhead axis needs fewer tick captions; keep its actual grid.
      if (label.kind === 'tick' && occupied.some(other => intersects(rect(x,y,w,h,1),other))) { label.element.style.display = 'none'; return; }
      label.element.style.left = x + 'px'; label.element.style.top = y + 'px';
      occupied.push(rect(x,y,w,h));
      if (label.kind === 'point') { const endX = Math.max(x - w / 2, Math.min(px,x + w / 2)), endY = Math.max(y - h / 2,Math.min(py,y + h / 2)); leaders.push(`<line x1="${px}" y1="${py}" x2="${endX}" y2="${endY}"/>`); }
    });
    state.leaders.setAttribute('viewBox', `0 0 ${state.width} ${state.height}`); state.leaders.innerHTML = leaders.join('');
  }
  function resize(state) {
    if (!state.renderer) return;
    const compact = matchMedia('(max-width:900px)').matches;
    if (state.compact !== compact) { state.elevation = compact ? 0.35 : 0.15; dispose(state); build(state); return; }
    state.width = state.viewport.clientWidth; state.height = state.viewport.clientHeight;
    if (state.width <= 0 || state.height <= 0) return;
    const aspect = state.width / state.height, viewH = state.compact ? Math.max(6.5,7.5 / aspect) : 5;
    state.baseViewHeight = viewH;
    state.camera.left = -viewH * aspect / 2; state.camera.right = viewH * aspect / 2;
    state.camera.top = viewH / 2; state.camera.bottom = -viewH / 2; state.camera.updateProjectionMatrix();
    const cssScale = state.viewport.getBoundingClientRect().width / state.width;
    state.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2) * cssScale); state.renderer.setSize(state.width, state.height, false); state.renderer.domElement.style.height = state.height + 'px'; request(state);
  }
  function dispose(state) {
    (window.__gammaCancelFrame || cancelAnimationFrame)(state.frame); state.frame = 0;
    if (state.scene) state.scene.traverse(object => { object.geometry?.dispose(); if (Array.isArray(object.material)) object.material.forEach(material => material.dispose()); else object.material?.dispose(); });
    const renderer = state.renderer; state.renderer = null;
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove(); state.scene = null; state.points = [];
    state.labelLayer.replaceChildren(); state.leaders.replaceChildren(); state.labels = []; state.fitBounds = [];
  }
  function select(state, index) {
    state.selected = index;
    state.select.value = String(index);
    const point = state.model.points[index];
    const number = new Intl.NumberFormat(state.fr ? 'fr-FR' : 'en-US', { maximumFractionDigits:12 });
    const dimension = (label, value) => {
      const unit = label?.match(/\(([%×])\)/)?.[1] || '';
      return (label || '').replace(/\s*\([%×]\)/g, '') + ': ' + number.format(value) + unit;
    };
    state.readout.textContent = point ? [point.name, dimension(state.model.options.x_label, point.x), dimension(state.model.options.y_label, point.y), dimension(state.model.options.depth_label, point.size)].join(' · ') : state.depthHint;
    state.selection.textContent = point ? `${number.format(point.x)}% ${state.fr ? 'croissance' : 'growth'} · ${number.format(point.y)}× EV/revenue · ${number.format(point.size)}% ${state.fr ? 'marge' : 'margin'}` : (state.fr ? 'Choisissez une entreprise pour lire ses trois valeurs.' : 'Select a company to read its three values.');
    state.selection.setAttribute('aria-label', state.readout.textContent);
    state.points.forEach((mesh, pointIndex) => mesh.material.color.set(pointIndex === index ? state.selectedColor : state.pointColor));
    state.labels.forEach(label => { if (label.kind === 'point') label.element.dataset.selected = String(label.index === index); });
    request(state);
  }
  function setMode(state, enabled) {
    if (state.active === enabled) return;
    state.active = enabled;
    state.root.dataset.d3View = enabled ? '3d' : '2d';
    state.toggle.setAttribute('aria-pressed', String(enabled));
    state.toggle.textContent = enabled ? (state.fr ? 'Comparer en 2D' : 'Compare in 2D') : (state.fr ? 'Explorer en 3D' : 'Explore in 3D');
    const subtitle = state.root.querySelector('.d3-webgpu-heading p');
    if (subtitle) subtitle.textContent = enabled ? (state.fr ? 'Croissance en X, multiple en Y, marge brute en profondeur.' : 'Growth on X, valuation multiple on Y, gross margin in depth.') : state.subtitle;
    const flatState = window.__gammaGPUCharts?.states.find(candidate => candidate.root === state.root);
    const flatSelection = flatState?.scene?.hits.find(hit => hit.key === flatState.selected)?.label;
    state.readout.textContent = enabled ? state.depthHint : flatSelection || state.hint;
    document.dispatchEvent(new CustomEvent('gamma:gpu-view-changed'));
    if (enabled) build(state); else dispose(state);
  }
  function build(state) {
    if (!T || !window.d3) { setMode(state, false); state.toggle.disabled = true; return; }
    try {
      const css = getComputedStyle(state.root), color = name => css.getPropertyValue('--gamma-' + name).trim();
      state.pointColor = color('primary'); state.selectedColor = color('secondary');
      const model = state.model;
      state.compact = matchMedia('(max-width:900px)').matches;
      state.scene = new T.Scene(); state.scene.background = new T.Color(color('bg'));
      state.fitBounds = [];
      state.camera = new T.OrthographicCamera(-5, 5, 3, -3, 0.1, 50);
      state.renderer = new T.WebGLRenderer({preserveDrawingBuffer:true, antialias: true, alpha: false });
      state.renderer.setClearColor(color('bg'));
      state.renderer.outputColorSpace = T.SRGBColorSpace; state.renderer.toneMapping = T.ACESFilmicToneMapping;
      state.renderer.toneMappingExposure = 1.15;
      state.viewport.prepend(state.renderer.domElement);
      state.host.dataset.depthRenderer = 'webgl';
      state.renderer.domElement.setAttribute('aria-hidden', 'true');
      const activeRenderer = state.renderer;
      state.renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); if (state.renderer === activeRenderer) { setMode(state, false); state.toggle.disabled = true; } }, { once: true });
      const hemi = new T.HemisphereLight(color('text'), color('bg'), 2.2); state.scene.add(hemi);
      const light = new T.DirectionalLight(color('text'), 3); light.position.set(-3, 8, 6); state.scene.add(light);
      const fill = new T.DirectionalLight(color('secondary'), 1.5); fill.position.set(5, 1, -4); state.scene.add(fill);
      const domain = values => { const [min, max] = d3.extent(values), pad = Math.max((max - min) * 0.12, 1); return [min - pad, max + pad]; };
      const xMin = state.compact ? -2.5 : -6.5, xMax = -xMin;
      const x = d3.scaleLinear().domain(domain(model.points.map(point => point.x))).nice().range([xMin, xMax]);
      const y = d3.scaleLinear().domain(domain(model.points.map(point => point.y))).nice().range([-1.45, 1.65]);
      const z = d3.scaleLinear().domain(domain(model.points.map(point => point.size))).nice().range([-2, 2]);
      state.scales = { x, y, z };
      const line = (from, to, alpha = 0.4, primary = false) => {
        state.fitBounds.push({position:new T.Vector3(...from),radius:0.025},{position:new T.Vector3(...to),radius:0.025});
        const geometry = new T.BufferGeometry().setFromPoints([new T.Vector3(...from), new T.Vector3(...to)]);
        const mesh = new T.Line(geometry, new T.LineBasicMaterial({ color: color(primary ? 'secondary' : 'muted'), transparent: true, opacity: alpha })); state.scene.add(mesh);
      };
      const label = (value, position, kind = 'tick', index = -1) => {
        const element = document.createElement('span'); element.className = 'd3-depth-label'; element.dataset.kind = kind; element.textContent = value; state.labelLayer.append(element);
        state.labels.push({ element, kind, index, name: value, position: new T.Vector3(...position) });
      };
      // Three orthogonal measurement axes: no synthetic depth coordinate.
      line([xMin, -1.45, -2], [xMax, -1.45, -2], 0.8, true);
      line([xMin, -1.45, -2], [xMin, 1.65, -2], 0.8, true);
      line([xMin, -1.45, -2], [xMin, -1.45, 2], 0.8, true);
      x.ticks(state.compact ? 2 : 4).forEach(value => { line([x(value), -1.45, -2], [x(value), -1.45, 2], 0.16); if (value > x.domain()[0]) label(value + '%', [x(value), -1.68, -2]); });
      y.ticks(state.compact ? 2 : 3).forEach(value => { line([xMin, y(value), -2], [xMax, y(value), -2], 0.13); label(value + '×', [xMin - .23, y(value), -2]); });
      z.ticks(state.compact ? 2 : 3).forEach(value => { line([xMin, -1.45, z(value)], [xMax, -1.45, z(value)], 0.16); if (value > z.domain()[0]) label(value + '%', [xMin - .25, -1.5, z(value)]); });
      label(model.options.x_label, [1.2, -2.1, -2], 'axis');
      label(model.options.y_label, [-2.5, 2.1, -2], 'axis');
      label(model.options.depth_label, [-2.6, -1.6, 2.6], 'axis');
      const sphere = new T.SphereGeometry(0.17, 32, 20);
      model.points.forEach((point, index) => {
        const position = [x(point.x), y(point.y), z(point.size)];
        const material = new T.MeshPhysicalMaterial({ color: color('primary'), roughness: 0.28, metalness: 0.12, clearcoat: 0.75, clearcoatRoughness: 0.24 });
        const mesh = new T.Mesh(sphere, material); mesh.position.set(...position); mesh.userData = { index, ...point }; state.scene.add(mesh); state.points.push(mesh);
        state.fitBounds.push({position:mesh.position,radius:sphere.parameters.radius});
        line([position[0], -1.45, position[2]], position, 0.32);
        const anchor = new T.Mesh(new T.CircleGeometry(0.055, 16), new T.MeshBasicMaterial({ color: color('secondary'), transparent: true, opacity: 0.7 })); anchor.rotation.x = -Math.PI / 2; anchor.position.set(position[0], -1.445, position[2]); state.scene.add(anchor);
        label(point.name, position, 'point', index);
      });
      const canvas = state.renderer.domElement;
      let drag = null;
      const hitAt = event => {
        const box = canvas.getBoundingClientRect(), mouse = new T.Vector2((event.clientX - box.left) / box.width * 2 - 1, -(event.clientY - box.top) / box.height * 2 + 1);
        const ray = new T.Raycaster(); ray.setFromCamera(mouse, state.camera);
        const direct = ray.intersectObjects(state.points)[0]?.object;
        if (direct) return direct.userData.index;
        // A 44px target keeps the actual data marks selectable on touch screens.
        let closest = -1, distance = 22;
        state.points.forEach(mesh => { const p = mesh.position.clone().project(state.camera); const d = Math.hypot(event.clientX - box.left - (p.x + 1) * box.width / 2, event.clientY - box.top - (1 - p.y) * box.height / 2); if (d <= distance) { closest = mesh.userData.index; distance = d; } });
        return closest;
      };
      canvas.addEventListener('pointerdown', event => { event.stopPropagation(); drag = { x: event.clientX, y: event.clientY, startX:event.clientX, startY:event.clientY, moved:false }; canvas.setPointerCapture(event.pointerId); });
      canvas.addEventListener('pointermove', event => {
        if (!drag) return;
        if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        state.azimuth = Math.max(-1.15, Math.min(1.15, state.azimuth - dx * 0.006));
        state.elevation = Math.max(0.12, Math.min(0.85, state.elevation + dy * 0.004));
        drag.x = event.clientX; drag.y = event.clientY; drag.moved = true; request(state);
      });
      const end = event => { if (drag && !drag.moved && event.type === 'pointerup') select(state, hitAt(event)); drag = null; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); };
      canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
      resize(state);
      select(state, state.selected);
    } catch (error) { state.host.dataset.depthError = String(error.message || error); setMode(state, false); state.toggle.disabled = true; }
  }
  toggles.forEach(toggle => {
    const root = toggle.closest('.d3-webgpu-stage'), plot = root.querySelector('.d3-webgpu-plot'), model = JSON.parse(root.querySelector('.d3-webgpu-model').textContent), fr = model.language.startsWith('fr');
    const host = document.createElement('div'); host.className = 'd3-depth-scene';
    host.innerHTML = `<div class="d3-depth-viewport"><svg class="d3-depth-leaders" aria-hidden="true"></svg><div class="d3-depth-labels"></div></div><div class="d3-depth-toolbar"><select class="d3-depth-select" aria-label="${fr ? 'Examiner une entreprise' : 'Inspect a company'}"><option value="-1">${fr ? 'Choisir une entreprise' : 'Inspect a company'}</option></select><nav class="d3-depth-controls" aria-label="${fr ? 'Vue 3D' : '3D view'}"><button type="button" data-depth-action="left" aria-label="${fr ? 'Tourner à gauche' : 'Rotate left'}"><svg viewBox="0 0 20 20"><path d="M12 4l-6 6 6 6"/></svg></button><button type="button" data-depth-action="reset">${fr ? 'Réinitialiser' : 'Reset'}</button><button type="button" data-depth-action="right" aria-label="${fr ? 'Tourner à droite' : 'Rotate right'}"><svg viewBox="0 0 20 20"><path d="M8 4l6 6-6 6"/></svg></button></nav></div><p class="d3-depth-selection" aria-live="polite"></p><p class="d3-depth-instruction">${fr ? 'Choisir un point · Glisser pour tourner' : 'Select a point · Drag to rotate'}</p>`;
    const axisKey = document.createElement('ul'); axisKey.className = 'd3-depth-axis-key';
    [['X',model.options.x_label],['Y',model.options.y_label],['Z',model.options.depth_label]].forEach(([axis,name]) => { const item = document.createElement('li'); item.textContent = axis + ' · ' + name; axisKey.append(item); }); host.append(axisKey);
    plot.append(host);
    const state = { root, plot, toggle, model, host, viewport:host.querySelector('.d3-depth-viewport'), selection:host.querySelector('.d3-depth-selection'), select:host.querySelector('.d3-depth-select'), readout:root.querySelector('.d3-webgpu-readout'), labelLayer: host.querySelector('.d3-depth-labels'), leaders: host.querySelector('.d3-depth-leaders'), labels: [], points: [], selected:-1, prefer3D:true, renderer: null, active: false, frame: 0, draws: 0, azimuth: -0.68, elevation:matchMedia('(max-width:900px)').matches ? 0.35 : 0.15, fr, subtitle: root.querySelector('.d3-webgpu-heading p')?.textContent || '', hint: root.querySelector('.d3-webgpu-readout').textContent, depthHint:fr ? 'Croissance, valorisation et marge. Sélectionnez une entreprise pour lire ses valeurs.' : 'Growth, valuation and margin. Select a company to inspect its values.' };
    model.points.forEach((point, index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = point.name; state.select.append(option); });
    root.dataset.d3View = '2d';
    root._threeExploration = state; states.push(state);
    toggle.disabled = exported;
    toggle.addEventListener('click', () => { state.prefer3D = !state.active; setMode(state, state.prefer3D); });
    toggle.addEventListener('keydown', event => event.stopPropagation());
    state.select.addEventListener('change', () => select(state, Number(state.select.value)));
    state.select.addEventListener('keydown', event => event.stopPropagation());
    host.querySelectorAll('[data-depth-action]').forEach(button => button.addEventListener('click', () => { const action = button.dataset.depthAction; state.azimuth = action === 'reset' ? -0.68 : Math.max(-1.15, Math.min(1.15, state.azimuth + (action === 'left' ? -0.18 : 0.18))); if (action === 'reset') state.elevation = state.compact ? 0.35 : 0.15; request(state); }));
    host.querySelectorAll('[data-depth-action]').forEach(button => button.addEventListener('keydown', event => event.stopPropagation()));
    plot.addEventListener('keydown', event => {
      if (!state.active || event.target.closest('button,select')) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); select(state, -1); return; }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') state.azimuth = Math.max(-1.15, Math.min(1.15, state.azimuth + (event.key === 'ArrowLeft' ? -0.12 : 0.12)));
      else state.elevation = Math.max(0.12, Math.min(0.85, state.elevation + (event.key === 'ArrowUp' ? 0.08 : -0.08)));
      request(state);
    });
    state.observer = new ResizeObserver(() => resize(state)); state.observer.observe(plot);
  });
  const sync = () => states.forEach(state => {
    const visible = (!document.hidden || window.__gammaBroadcastActive) && !exported && !printing.matches && Reveal.getCurrentSlide()?.contains(state.root);
    setMode(state, Boolean(visible && state.prefer3D && !state.toggle.disabled));
  });
  Reveal.on('slidechanged', sync); document.addEventListener('visibilitychange', sync);
  printing.addEventListener('change', sync);
  window.addEventListener('pagehide', () => states.forEach(state => { if (state.active) setMode(state, false); }));
  window.addEventListener('pageshow', sync);
  window.addEventListener('resize', () => states.forEach(state => { if (state.active) resize(state); }));
  window.addEventListener('gamma:theme-changed', () => states.forEach(state => { if (state.active) { dispose(state); build(state); } }));
  sync();
}

export function threeExplorationJS() { return initThreeExploration.toString(); }
