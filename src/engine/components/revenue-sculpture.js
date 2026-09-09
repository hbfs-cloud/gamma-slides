import { escapeHtml } from '../html.js';

const money = value => '$' + (value / 1e6).toFixed(1) + 'M';

// Both ends use the same dollars-to-height conversion. Depth is a material
// treatment between the ends; it never encodes an invented third variable.
export function buildRevenueSculptureModel(deck) {
  const chart = deck.slides?.find(slide => slide.chart?.type === 'bar' && slide.chart.options?.format_y === 'currency_m' && slide.chart.data?.datasets?.length === 2)?.chart;
  if (!chart?.data.labels?.length) return null;
  const { labels, datasets } = chart.data;
  if (datasets.some(set => set.values.length !== labels.length || set.values.some(value => !Number.isFinite(value) || value < 0))) return null;
  const totals = datasets.map(set => set.values.reduce((sum, value) => sum + value, 0));
  if (!Math.max(...totals)) return null;
  const unit = 3.85 / Math.max(...totals), gap = 0.13;
  let left = (totals[0] * unit + gap * (labels.length - 1)) / 2;
  let right = (totals[1] * unit + gap * (labels.length - 1)) / 2;
  const bands = labels.map((name, index) => {
    const before = datasets[0].values[index], after = datasets[1].values[index];
    const from = { top: left, bottom: left - before * unit };
    const to = { top: right, bottom: right - after * unit };
    left = from.bottom - gap; right = to.bottom - gap;
    return { name, before, after, from, to, index };
  });
  return { years: datasets.map(set => set.label), totals, unit, gap, bands };
}

function fallbackSVG(model) {
  const y = value => 142 - value * 53;
  const bands = model.bands.map(band => `<path class="revenue-ribbon revenue-ribbon-${band.index % 5}" data-revenue-band="${band.index}" d="M20 ${y(band.from.top)} C155 ${y(band.from.top)} 325 ${y(band.to.top)} 460 ${y(band.to.top)} L460 ${y(band.to.bottom)} C325 ${y(band.to.bottom)} 155 ${y(band.from.bottom)} 20 ${y(band.from.bottom)}Z"><title>${escapeHtml(band.name)}: ${money(band.before)} to ${money(band.after)}</title></path>`).join('');
  return `<svg class="revenue-sculpture-fallback" viewBox="0 0 480 284" role="img" aria-label="Revenue rises from ${money(model.totals[0])} to ${money(model.totals[1])}. Ribbon widths share one scale.">${bands}</svg>`;
}

export function revenueSculptureHTML(deck) {
  const model = buildRevenueSculptureModel(deck);
  if (!model) return '';
  const ends = model.years.map((year, i) => `<div><span>${escapeHtml(year)}</span><strong>${money(model.totals[i])}</strong></div>`).join('');
  const key = model.bands.map(band => `<button type="button" class="revenue-segment revenue-segment-${band.index % 5}" data-revenue-segment="${band.index}" aria-pressed="false" aria-label="${escapeHtml(band.name)}: ${escapeHtml(model.years[0])} ${money(band.before)}, ${escapeHtml(model.years[1])} ${money(band.after)}"><span><i aria-hidden="true"></i>${escapeHtml(band.name)}</span><small>${money(band.before)} <span aria-hidden="true">→</span> ${money(band.after)}</small></button>`).join('');
  const json = JSON.stringify(model).replaceAll('<', '\\u003c');
  return `<figure class="revenue-sculpture" data-revenue-state="fallback" aria-label="Revenue by customer segment"><div class="revenue-sculpture-totals">${ends}</div><div class="revenue-sculpture-plot">${fallbackSVG(model)}</div><div class="revenue-sculpture-key" role="group" aria-label="Select a customer segment">${key}</div><figcaption class="revenue-sculpture-readout" aria-live="polite">Five segments. Revenue widths share one scale.</figcaption><script type="application/json" class="revenue-sculpture-model">${json}</script></figure>`;
}

export function revenueSculptureCSS() { return `
  body.gamma-experience .revenue-sculpture { --revenue-0:var(--gamma-secondary); --revenue-1:var(--gamma-primary); --revenue-2:var(--gamma-accent); --revenue-3:var(--gamma-muted); --revenue-4:var(--gamma-text); width:100%; min-width:0; margin:0; }
  .revenue-sculpture-totals { display:flex; justify-content:space-between; align-items:end; padding:0 4%; }
  .revenue-sculpture-totals > div { display:grid; gap:4px; }
  .revenue-sculpture-totals > div:last-child { text-align:right; }
  .revenue-sculpture-totals span { color:var(--gamma-muted); font:500 12px/1.4 Archivo,system-ui,sans-serif; }
  .revenue-sculpture-totals strong { color:var(--gamma-text); font:550 32px/1.2 Archivo,system-ui,sans-serif; letter-spacing:-.025em; font-variant-numeric:tabular-nums; }
  .revenue-sculpture-totals > div:last-child strong { color:var(--gamma-primary); }
  .revenue-sculpture-plot { position:relative; width:100%; aspect-ratio:480/284; }
  .revenue-sculpture-plot canvas,.revenue-sculpture-fallback { position:absolute; inset:0; display:block; width:100%; height:100%; }
  .revenue-sculpture-plot canvas { touch-action:pan-y; }
  .revenue-sculpture[data-revenue-state="ready"] .revenue-sculpture-fallback { visibility:hidden; }
  .revenue-ribbon { fill:var(--revenue-color); }
  .revenue-ribbon-0,.revenue-segment-0 { --revenue-color:var(--revenue-0); }
  .revenue-ribbon-1,.revenue-segment-1 { --revenue-color:var(--revenue-1); }
  .revenue-ribbon-2,.revenue-segment-2 { --revenue-color:var(--revenue-2); }
  .revenue-ribbon-3,.revenue-segment-3 { --revenue-color:var(--revenue-3); }
  .revenue-ribbon-4,.revenue-segment-4 { --revenue-color:var(--revenue-4); }
  .revenue-sculpture-key { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:4px 12px; margin-top:8px; }
  .revenue-sculpture-key .revenue-segment { display:flex; flex-direction:column; align-items:start; gap:5px; min-height:48px; min-width:0; margin:0; padding:6px 0; background:transparent; color:var(--gamma-text); border:0; border-bottom:1px solid transparent; font:500 12px/1.4 Archivo,system-ui,sans-serif; cursor:pointer; text-align:left; }
  .revenue-segment > span { display:flex; align-items:center; gap:7px; white-space:nowrap; }
  .revenue-segment i { display:block; width:7px; height:7px; background:var(--revenue-color); }
  .revenue-sculpture-key .revenue-segment small { color:var(--gamma-muted); font:450 12px/1.4 Archivo,system-ui,sans-serif; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .revenue-sculpture-key .revenue-segment:is(:hover,[aria-pressed="true"]) { border-color:var(--revenue-color); }
  .revenue-sculpture-key .revenue-segment:focus-visible { outline:2px solid var(--gamma-primary); outline-offset:4px; }
  body.gamma-experience .revenue-sculpture figcaption { min-height:1.4em; margin:12px 0 0; color:var(--gamma-muted); font:450 12px/1.4 Archivo,system-ui,sans-serif; }
  @media(max-width:900px) { .revenue-sculpture-key { gap:4px 8px; } .revenue-segment > span { gap:5px; } .revenue-sculpture-totals strong { font-size:24px; } }
  @media(max-width:360px) { .revenue-sculpture-key { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media print { .revenue-sculpture-plot canvas { display:none!important; } .revenue-sculpture .revenue-sculpture-fallback { visibility:visible!important; } .revenue-sculpture-key { pointer-events:none; } }
`; }

function initRevenueSculptures() {
  const T = window.GammaThree;
  const roots = [...document.querySelectorAll('.revenue-sculpture')];
  if (!roots.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const printing = matchMedia('print');
  const params = new URLSearchParams(location.search);
  const exported = params.has('gamma-export') || params.has('print-pdf') || document.documentElement.classList.contains('gamma-export');
  const states = [];
  const currency = value => '$' + (value / 1e6).toFixed(1) + 'M';
  const visible = state => !exported && !printing.matches && !document.hidden && (!window.Reveal || Reveal.getCurrentSlide()?.contains(state.root));

  // Closed, curved strips: equal-unit end caps stay in z=0 for every segment.
  // The common orthographic camera preserves their proportional measurements.
  function geometry(band) {
    const positions = [], indices = [], along = 72, across = 8;
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i <= along; i++) {
        const t = i / along, ease = t * t * (3 - 2 * t), arch = Math.sin(Math.PI * t);
        const top = band.from.top + (band.to.top - band.from.top) * ease;
        const bottom = band.from.bottom + (band.to.bottom - band.from.bottom) * ease;
        for (let j = 0; j <= across; j++) {
          const u = j / across, crown = Math.sin(Math.PI * u) * 0.13;
          const z = arch * (0.62 + 0.15 * Math.cos(band.index * 0.85) + crown) - side * 0.075 * arch;
          positions.push(-3.9 + 7.8 * t, top + (bottom - top) * u, z);
        }
      }
    }
    const stride = across + 1, layer = (along + 1) * stride;
    for (let side = 0; side < 2; side++) for (let i = 0; i < along; i++) for (let j = 0; j < across; j++) {
      const a = side * layer + i * stride + j, b = a + stride;
      if (side === 0) indices.push(a, a + 1, b, b, a + 1, b + 1);
      else indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    for (let i = 0; i < along; i++) for (const j of [0, across]) {
      const a = i * stride + j, b = a + stride;
      indices.push(a, b, a + layer, b, b + layer, a + layer);
    }
    const result = new T.BufferGeometry();
    result.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); result.setIndex(indices); result.computeVertexNormals();
    return result;
  }

  function render(state) {
    if (!state.renderer || !visible(state)) return;
    const selected = state.selected ?? state.hover;
    state.meshes.forEach((mesh, i) => {
      mesh.material.opacity = selected === null || selected === i ? 1 : 0.22;
      mesh.material.depthWrite = mesh.material.opacity === 1;
    });
    state.renderer.render(state.scene, state.camera);
    state.draws++; state.root.dataset.revenueDraws = String(state.draws);
  }
  function request(state) {
    if (state.frame || !state.renderer || !visible(state)) return;
    state.frame = requestAnimationFrame(() => { state.frame = 0; render(state); });
  }
  function resize(state) {
    if (!state.renderer) return;
    // Reveal scales its logical stage with a CSS transform. Backing pixels must
    // cover the displayed bounds, then apply the device pixel ratio once.
    const { width, height } = state.plot.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height, viewWidth = 8.6, viewHeight = viewWidth / aspect;
    Object.assign(state.camera, { left: -viewWidth / 2, right: viewWidth / 2, top: viewHeight / 2, bottom: -viewHeight / 2 });
    state.camera.updateProjectionMatrix();
    state.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); state.renderer.setSize(Math.ceil(width), Math.ceil(height), false);
    request(state);
  }
  function dispose(state) {
    cancelAnimationFrame(state.frame); state.frame = 0;
    state.scene?.traverse(object => { object.geometry?.dispose(); if (object.material) object.material.dispose(); });
    const renderer = state.renderer; state.renderer = null;
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
    state.scene = null; state.meshes = []; state.root.dataset.revenueState = 'fallback'; state.root.dataset.revenueRenderer = 'svg';
  }
  function select(state, index) {
    state.selected = state.selected === index ? null : index;
    state.buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === state.selected)));
    const band = state.model.bands[state.selected];
    state.readout.textContent = band ? `${band.name}: ${currency(band.after - band.before)} added · ${band.before > 0 ? (band.after / band.before).toFixed(1) + '× revenue' : 'new revenue'}` : 'Five segments. Revenue widths share one scale.';
    state.root.querySelectorAll('[data-revenue-band]').forEach((path, i) => path.style.opacity = state.selected === null || state.selected === i ? '1' : '.22');
    request(state);
  }
  function build(state) {
    if (state.renderer || state.failed || !T || !visible(state)) return;
    try {
      const style = getComputedStyle(state.root), color = key => style.getPropertyValue('--gamma-' + key).trim();
      const palette = ['secondary', 'primary', 'accent', 'muted', 'text'].map(color);
      state.scene = new T.Scene();
      state.camera = new T.OrthographicCamera(-4.3, 4.3, 2.6, -2.6, 0.1, 40);
      state.camera.position.set(0, 2.4, 12); state.camera.lookAt(0, 0, 0);
      state.renderer = new T.WebGLRenderer({preserveDrawingBuffer:true, antialias: true, alpha: true });
      state.renderer.setClearColor(color('bg'), 0);
      state.renderer.outputColorSpace = T.SRGBColorSpace; state.renderer.toneMapping = T.ACESFilmicToneMapping; state.renderer.toneMappingExposure = 1.2;
      const ambient = new T.HemisphereLight(color('text'), color('bg'), 2.8); state.scene.add(ambient);
      state.keyLight = new T.DirectionalLight(color('text'), 4.8); state.keyLight.position.set(-3, 6, 8); state.scene.add(state.keyLight);
      const rim = new T.DirectionalLight(color('secondary'), 3.1); rim.position.set(4, -3, 4); state.scene.add(rim);
      state.meshes = state.model.bands.map(band => {
        const material = new T.MeshPhysicalMaterial({ color: palette[band.index % 5], metalness: 0.38, roughness: 0.26, clearcoat: 0.8, clearcoatRoughness: 0.25, transparent: true, side: T.DoubleSide });
        const mesh = new T.Mesh(geometry(band), material); mesh.userData = band; state.scene.add(mesh); return mesh;
      });
      const canvas = state.renderer.domElement; canvas.setAttribute('aria-hidden', 'true');
      const activeRenderer = state.renderer;
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); if (state.renderer === activeRenderer) { state.failed = true; dispose(state); } }, { once: true });
      const raycaster = new T.Raycaster();
      const hit = event => {
        const rect = canvas.getBoundingClientRect();
        raycaster.setFromCamera(new T.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), state.camera);
        return raycaster.intersectObjects(state.meshes)[0]?.object.userData.index ?? null;
      };
      canvas.addEventListener('pointermove', event => { if (event.pointerType === 'touch') return; const index = hit(event); if (state.hover !== index) { state.hover = index; canvas.style.cursor = index === null ? 'default' : 'pointer'; request(state); } });
      canvas.addEventListener('pointerleave', () => { state.hover = null; request(state); });
      let down = null;
      canvas.addEventListener('pointerdown', event => { down = { x: event.clientX, y: event.clientY }; });
      canvas.addEventListener('pointerup', event => { if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 8) select(state, hit(event)); down = null; });
      canvas.addEventListener('pointercancel', () => { down = null; });
      state.plot.append(canvas); resize(state); render(state);
      state.root.dataset.revenueState = 'ready'; state.root.dataset.revenueRenderer = 'webgl';
      // A single light pass reveals the actual surfaces. The financial geometry
      // is complete on frame one, and no renderer keeps running at rest.
      if (!reduced.matches && !state.introduced) {
        state.introduced = true; const start = performance.now(); cancelAnimationFrame(state.frame);
        const frame = now => {
          state.frame = 0; if (!state.renderer || !visible(state)) return;
          const t = Math.min(1, (now - start) / 850), eased = 1 - Math.pow(1 - t, 4);
          state.keyLight.position.x = -3 + eased * 6; render(state);
          if (t < 1) state.frame = requestAnimationFrame(frame);
        };
        state.frame = requestAnimationFrame(frame);
      }
    } catch (error) { state.failed = true; state.root.dataset.revenueError = String(error.message || error); dispose(state); }
  }
  roots.forEach(root => {
    const state = { root, plot: root.querySelector('.revenue-sculpture-plot'), model: JSON.parse(root.querySelector('.revenue-sculpture-model').textContent), buttons: [...root.querySelectorAll('[data-revenue-segment]')], readout: root.querySelector('.revenue-sculpture-readout'), meshes: [], renderer: null, scene: null, frame: 0, draws: 0, selected: null, hover: null, introduced: false, failed: false };
    root._revenueSculpture = state; states.push(state);
    state.buttons.forEach((button, i) => button.addEventListener('click', () => select(state, i)));
    root.addEventListener('keydown', event => {
      // Keep native Enter/Space button activation without Reveal treating the
      // same key as presentation navigation. Arrow navigation is handled below.
      if (event.target.closest('[data-revenue-segment]')) event.stopPropagation();
      if (event.key === 'Escape' && state.selected !== null) { event.preventDefault(); event.stopPropagation(); select(state, state.selected); }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) || !event.target.matches('[data-revenue-segment]')) return;
      event.preventDefault(); event.stopPropagation();
      const current = state.buttons.indexOf(event.target), delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? state.buttons.length - 1 : (current + delta + state.buttons.length) % state.buttons.length;
      state.buttons[next].focus();
    });
    state.observer = new ResizeObserver(() => resize(state)); state.observer.observe(state.plot);
  });
  const sync = () => states.forEach(state => visible(state) ? build(state) : dispose(state));
  window.Reveal?.on('slidechanged', sync); document.addEventListener('visibilitychange', sync);
  window.Reveal?.on('resize', () => states.forEach(resize));
  window.addEventListener('resize', () => states.forEach(resize));
  printing.addEventListener('change', sync);
  window.addEventListener('gamma:theme-changed', () => states.forEach(state => { dispose(state); state.failed = false; build(state); }));
  reduced.addEventListener('change', () => states.forEach(state => { if (reduced.matches) { cancelAnimationFrame(state.frame); state.frame = 0; render(state); } }));
  window.addEventListener('pagehide', () => states.forEach(dispose)); window.addEventListener('pageshow', sync); sync();
}

export function revenueSculptureJS() { return initRevenueSculptures.toString(); }
