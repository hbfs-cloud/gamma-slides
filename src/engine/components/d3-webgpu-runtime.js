/** A deterministic scene description powers both the GPU and vector fallback. */
export function buildGPUScene(model, width, height, d3) {
  const mobile = width < 600;
  const scene = { width, height, shapes: [], texts: [], marks: [], hits: [] };
  const video = model.options.video_readable === true;
  const fontSize = video ? (mobile ? 16 : 30) : (mobile ? 11 : 14);
  const text = (value, x, y, options = {}) => scene.texts.push({ value: String(value), x, y, size: fontSize, color: 'text', ...options });
  const line = (x1, y1, x2, y2, options = {}) => scene.shapes.push({ type: 'line', x1, y1, x2, y2, color: 'muted', alpha: 0.22, width: 1, ...options });
  const fmt = (value, format) => {
    if (format === 'currency_m') return '$' + d3.format('.2~f')(value / 1e6) + 'M';
    if (format === 'currency_k') return '$' + d3.format('.2~f')(value / 1e3) + 'K';
    if (format === 'percent') return d3.format('.2~f')(value) + '%';
    if (format === 'integer') return d3.format(',d')(value);
    return d3.format(',.3~g')(value);
  };
  const wrap = (value, limit) => {
    const words = String(value).split(' '), rows = [''];
    words.forEach(word => { if (rows.at(-1).length && rows.at(-1).length + word.length + 1 > limit) rows.push(word); else rows[rows.length - 1] += (rows.at(-1) ? ' ' : '') + word; });
    return rows.join('\n');
  };
  const colors = ['primary', 'secondary', 'text', 'muted'];
  const options = model.options;

  if (model.type === 'bar') {
    const hasNegative=model.series.some(series=>series.values.some(value=>value<0));
    const left = hasNegative ? (video ? (mobile ? 76 : 160) : mobile ? 50 : 156) : video ? 0 : mobile ? 0 : 156, right = width - (video ? (mobile ? 72 : 150) : mobile ? 49 : 74);
    const allValues = model.series.flatMap(series => series.values);
    const extent = [Math.min(0, d3.min(allValues)), Math.max(0, d3.max(allValues))];
    if (extent[0] === extent[1]) extent[1] = extent[0] + 1;
    const x = d3.scaleLinear().domain(extent).nice().range([left, right]);
    const band = d3.scaleBand().domain(model.labels).range([video ? (mobile ? 48 : 66) : 40, height - (video ? 42 : 25)]).paddingInner(video ? .18 : mobile ? 0.3 : 0.36);
    const barsHeight = video ? Math.max(4,Math.min(mobile ? 20 : 36,(band.step()-(mobile ? 42 : 56))/model.series.length)) : mobile ? Math.max(6, Math.min(11, (band.bandwidth() - 17) / model.series.length)) : Math.min(14, band.bandwidth() / (model.series.length + 0.5));
    x.ticks(mobile ? 3 : 5).forEach(value => {
      line(x(value), 34, x(value), height - 25, { alpha: value === 0 ? 0.36 : 0.14 });
      text(fmt(value, options.format_y), x(value), height - 8, { color: 'muted', anchor: x(value)<30?'start':x(value)>width-30?'end':'middle', size: video ? (mobile ? 14 : 22) : mobile ? 10 : 12 });
    });
    let legendX = left;
    model.series.forEach((series, seriesIndex) => {
      const color = model.series.length === 1 || seriesIndex === model.series.length - 1 ? 'primary' : colors[(seriesIndex + 1) % colors.length];
      scene.shapes.push({ type: 'rect', x: legendX, y: 4, w: 15, h: 6, radius: 2, color, alpha: 1 });
      text(series.name, legendX + 23, 7, { size: video ? (mobile ? 14 : 28) : mobile ? 11 : 12, color: 'muted' });
      legendX += 42 + series.name.length * (video ? (mobile ? 8 : 17) : mobile ? 6 : 7);
    });
    model.labels.forEach((label, index) => {
      const y = band(label);
      text(label, video || mobile ? 0 : left - 18, video || mobile ? y + 2 : y + band.bandwidth() / 2, { anchor: video || mobile ? 'start' : 'end', weight: 600, size: video ? (mobile ? 16 : 32) : mobile ? 12 : 14 });
      model.series.forEach((series, seriesIndex) => {
        const value = series.values[index];
        const color = model.series.length === 1 || seriesIndex === model.series.length - 1 ? 'primary' : colors[(seriesIndex + 1) % colors.length];
        const barY = y + (video ? Math.max(4,Math.min(mobile ? 20 : 36,(band.step()-(mobile ? 42 : 56))/model.series.length)) : mobile ? 14 : (band.bandwidth() - model.series.length * barsHeight) / 2) + seriesIndex * barsHeight;
        const shape = { type: 'rect', x: Math.min(x(0), x(value)), y: barY, w: Math.max(Math.abs(x(value) - x(0)), 0.5), h: barsHeight - 3, radius: 2, color, alpha: 1, key: index };
        scene.marks.push(shape);
        text(fmt(value, options.format_y), x(value) + (value < 0 ? -6 : 7), barY + shape.h / 2, { anchor: value < 0 ? 'end' : 'start', size: video ? (mobile ? 18 : model.series.length>1 ? 28 : 36) : mobile ? 10 : 12, color, key: index });
      });
      scene.hits.push({ x: 0, y: y - 7, w: width, h: band.bandwidth() + 10, key: index, label: label + ' · ' + model.series.map(series => series.name + ': ' + fmt(series.values[index], options.format_y)).join(' · ') });
    });
  } else if (model.type === 'scatter') {
    const left = mobile ? 36 : 70, right = width - (mobile ? 22 : 50), top = 35, bottom = height - (mobile ? 62 : 50);
    const domain = (values, min, max) => {
      let [low, high] = d3.extent(values); const pad = Math.max((high - low) * 0.15, Math.abs(high) * 0.04, 0.2);
      return [Number.isFinite(min) ? min : low - pad, Number.isFinite(max) ? max : high + pad];
    };
    const x = d3.scaleLinear().domain(domain(model.points.map(point => point.x), options.x_min, options.x_max)).range([left, right]);
    const y = d3.scaleLinear().domain(domain(model.points.map(point => point.y), options.y_min, options.y_max)).range([bottom, top]);
    const largest = d3.max(model.points, point => Math.max(0, point.size || 0)) || 1;
    const radius = d3.scaleSqrt().domain([0, largest]).range([0, mobile ? 15 : 25]);
    x.ticks(mobile ? 4 : 6).forEach(value => { line(x(value), top, x(value), bottom, { alpha: 0.12 }); text(fmt(value, options.format_x), x(value), bottom + 19, { anchor: 'middle', color: 'muted', size: video ? (mobile ? 14 : 22) : mobile ? 10 : 12 }); });
    y.ticks(4).forEach(value => { line(left, y(value), right, y(value), { alpha: 0.18 }); text(fmt(value, options.format_y), left - 10, y(value), { anchor: 'end', color: 'muted', size: video ? (mobile ? 14 : 22) : mobile ? 10 : 12 }); });
    text(options.y_label || 'Y', left, 10, { color: 'muted', size: video ? (mobile ? 14 : 28) : mobile ? 11 : 12 });
    text(options.x_label || 'X', (left + right) / 2, height - 12, { anchor: 'middle', color: 'muted', size: video ? (mobile ? 14 : 28) : mobile ? 11 : 12 });
    const positions = model.points.map((point, index) => ({ ...point, key: index, px: x(point.x), py: y(point.y), r: point.size === null ? (mobile ? 7 : 9) : radius(Math.max(0, point.size)) }));
    const occupied = [];
    positions.forEach(point => {
      const label = wrap(point.name, mobile ? 15 : 24), rows = label.split('\n');
      const labelW = Math.max(...rows.map(row => row.length)) * fontSize * 0.53, labelH = rows.length * (fontSize + 3);
      const offset = point.r + 8;
      const candidates = [[offset, -labelH / 2], [-offset - labelW, -labelH / 2], [-labelW / 2, -offset - labelH], [-labelW / 2, offset], [offset, -offset - labelH], [-offset - labelW, offset]];
      const scored = candidates.map(([dx, dy]) => {
        const cx = Math.max(2, Math.min(width - labelW - 2, point.px + dx));
        const cy = Math.max(top - 10, Math.min(bottom - labelH, point.py + dy));
        let score = 0;
        occupied.forEach(box => { if (cx < box.x + box.w + 4 && cx + labelW + 4 > box.x && cy < box.y + box.h + 3 && cy + labelH + 3 > box.y) score += 10; });
        positions.forEach(other => { if (cx < other.px + other.r && cx + labelW > other.px - other.r && cy < other.py + other.r && cy + labelH > other.py - other.r) score += 2; });
        return { cx, cy, score };
      }).sort((a, b) => a.score - b.score);
      const chosen = scored[0]; occupied.push({ x: chosen.cx, y: chosen.cy, w: labelW, h: labelH });
      scene.marks.push({ type: 'circle', x: point.px, y: point.py, r: Math.max(point.r, 1), color: 'primary', alpha: 0.74, key: point.key });
      scene.shapes.push({ type: 'circle', x: point.px, y: point.py, r: Math.max(point.r, 1), color: 'primary', alpha: 1, outline: true, width: 1.25, key: point.key });
      text(label, chosen.cx, chosen.cy + fontSize / 2, { weight: 550, key: point.key });
      scene.hits.push({ x: point.px - Math.max(point.r, 18), y: point.py - Math.max(point.r, 18), w: Math.max(point.r, 18) * 2, h: Math.max(point.r, 18) * 2, key: point.key, label: point.name + ' · ' + (options.x_label || 'X') + ': ' + fmt(point.x, options.format_x) + ' · ' + (options.y_label || 'Y') + ': ' + fmt(point.y, options.format_y) + (point.size === null ? '' : ' · ' + (options.size_label || (model.language?.startsWith('fr') ? 'Taille' : 'Size')) + ': ' + point.size) });
    });
  } else {
    const nodes = model.nodes.map((node, index) => ({ ...node, index }));
    const links = model.links.map(link => ({ ...link }));
    const categories = [...new Set(nodes.map(node => node.category))];
    const connectedExposure = node => model.links.filter(link => link.source === node.name || link.target === node.name).reduce((total, link) => total + link.value, 0);
    const hubs = new Set([...nodes].sort((a, b) => connectedExposure(b) - connectedExposure(a)).slice(0, 2).map(node => node.index));
    const radius = d3.scaleSqrt().domain([0, d3.max(nodes, node => node.value) || 1]).range([0, mobile ? 24 : 36]);
    const thickness = d3.scaleLinear().domain([0, d3.max(links, link => link.value) || 1]).range([0.5, mobile ? 4 : 6]);
    const simulation = d3.forceSimulation(nodes).randomSource(d3.randomLcg(0.42)).force('link', d3.forceLink(links).id(node => node.name).distance(mobile ? 88 : 160).strength(0.6)).force('charge', d3.forceManyBody().strength(mobile ? -150 : -420)).force('center', d3.forceCenter(width / 2, height / 2)).force('collision', d3.forceCollide(node => radius(node.value) + (mobile ? 25 : 44))).force('x', d3.forceX(width / 2).strength(0.09)).force('y', d3.forceY(height / 2).strength(0.12)).stop();
    simulation.tick(180); simulation.stop();
    const paddingX = mobile ? 56 : 112, paddingY = mobile ? 65 : 60;
    const x = d3.scaleLinear().domain(d3.extent(nodes, node => node.x)).range([paddingX, width - paddingX]);
    const y = d3.scaleLinear().domain(d3.extent(nodes, node => node.y)).range([paddingY, height - paddingY]);
    nodes.forEach(node => { node.px = x(node.x); node.py = y(node.y); });
    links.forEach(link => line(link.source.px, link.source.py, link.target.px, link.target.py, { width: thickness(link.value), color: 'secondary', alpha: 0.4, source: link.source.index, target: link.target.index }));
    nodes.forEach(node => {
      const color = colors[categories.indexOf(node.category) % colors.length], r = Math.max(radius(node.value), 2);
      if (hubs.has(node.index)) scene.shapes.push({ type: 'circle', x: node.px, y: node.py, r: r + 5, color: 'primary', alpha: 0.8, outline: true, width: 1.5, key: node.index });
      scene.marks.push({ type: 'circle', x: node.px, y: node.py, r, color, alpha: 1, key: node.index });
      text(String(node.value), node.px, node.py, { anchor: 'middle', color: 'bg', weight: 700, size: mobile ? 12 : 16, key: node.index });
      text(wrap(node.name, mobile ? 15 : 25), node.px, node.py + r + (mobile ? 12 : 16), { anchor: 'middle', weight: 550, key: node.index, size: mobile ? 10 : 13 });
      scene.hits.push({ x: node.px - Math.max(r, 22), y: node.py - Math.max(r, 22), w: Math.max(r, 22) * 2, h: Math.max(r, 22) * 2, key: node.index, label: node.name + ' · ' + node.category + ' · ' + node.value + ' · ' + model.links.filter(link => link.source === node.name || link.target === node.name).map(link => (link.source === node.name ? link.target : link.source) + ': ' + link.value).join(' / ') });
    });
  }
  return scene;
}

export function sceneToSVG(scene) {
  const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const color = name => 'var(--gamma-' + name + ')';
  const shape = item => {
    const common = `opacity="${item.alpha ?? 1}"`;
    if (item.type === 'line') return `<line x1="${item.x1}" y1="${item.y1}" x2="${item.x2}" y2="${item.y2}" stroke="${color(item.color)}" stroke-width="${item.width}" ${common}/>`;
    if (item.type === 'rect') return `<rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" rx="${item.radius || 0}" fill="${color(item.color)}" ${common}/>`;
    return `<circle cx="${item.x}" cy="${item.y}" r="${item.r}" fill="${item.outline ? 'none' : color(item.color)}" ${item.outline ? `stroke="${color(item.color)}" stroke-width="${item.width}"` : ''} ${common}/>`;
  };
  return [...scene.shapes, ...scene.marks].map(shape).join('') + scene.texts.map(item => `<text x="${item.x}" y="${item.y}" fill="${color(item.color)}" font-family="Archivo, sans-serif" font-size="${item.size}" font-weight="${item.weight || 450}" text-anchor="${item.anchor || 'start'}" dominant-baseline="central">${item.value.split('\n').map((row, index) => `<tspan x="${item.x}" dy="${index ? item.size + 3 : 0}">${esc(row)}</tspan>`).join('')}</text>`).join('');
}

/** Called explicitly after Reveal and the embedded libraries are ready. */
export function initGPUCharts(buildScene, writeSVG) {
  if (window.__gammaGPUCharts) return window.__gammaGPUCharts;
  const roots = [...document.querySelectorAll('.d3-webgpu-stage')];
  if (!roots.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const params = new URLSearchParams(location.search);
  const exported = params.has('gamma-export') || params.has('print-pdf') || document.documentElement.classList.contains('gamma-export');
  const states = roots.map(root => ({ root, model: JSON.parse(root.querySelector('.d3-webgpu-model').textContent), plot: root.querySelector('.d3-webgpu-plot'), svg: root.querySelector('.d3-webgpu-fallback'), app: null, pending: null, frame: 0, selected: -1, failed: false, active: false, generation: 0 }));

  function palette(root) {
    const style = getComputedStyle(root), result = {};
    ['primary', 'secondary', 'muted', 'text', 'bg'].forEach(name => { result[name] = new PIXI.Color(style.getPropertyValue('--gamma-' + name).trim()).toNumber(); });
    return result;
  }
  function dispose(state) {
    (window.__gammaCancelFrame || cancelAnimationFrame)(state.frame); state.frame = 0;
    if (state.app) { const app = state.app; state.app = null; state.root._pixiApp = null; try { app.destroy({ removeView: false }, { children: true, texture: true, textureSource: true }); } catch {} }
  }
  function fallback(state, error) {
    state.failed = true; state.generation++;
    if (error) state.root.dataset.d3Error = String(error.message || error).slice(0, 180);
    state.root.dataset.d3Renderer = 'svg'; state.root.dataset.d3State = 'fallback'; dispose(state); state.svg.removeAttribute('aria-hidden');
  }
  function refreshScene(state) {
    const width = Math.max(240, state.plot.clientWidth), height = Math.max(200, state.plot.clientHeight);
    if (typeof d3 === 'undefined') return;
    state.scene = buildScene(state.model, width, height, d3);
    state.svg.setAttribute('viewBox', `0 0 ${width} ${height}`); state.svg.innerHTML = writeSVG(state.scene); state.root.dataset.d3DataCount = String(state.scene.marks.length);
  }
  function draw(state, progress = 1) {
    if (!state.app || !state.active || (document.hidden && !window.__gammaBroadcastActive)) return;
    try {
      const app = state.app, scene = state.scene, colors = palette(state.root);
      // Opaque theme backing preserves antialiasing in canvas.captureStream video.
      app.renderer.background.alpha = 1; app.renderer.background.color = colors.bg;
      const related = new Set([state.selected]);
      if (state.model.type === 'network' && state.selected >= 0) scene.shapes.forEach(shape => { if (shape.source === state.selected || shape.target === state.selected) { related.add(shape.source); related.add(shape.target); } });
      const alpha = shape => state.selected < 0 || (shape.key === undefined && shape.source === undefined) || related.has(shape.key) || shape.source === state.selected || shape.target === state.selected ? 1 : 0.22;
      const colorKey = Object.values(colors).join(',');
      if (state.builtScene !== scene || state.builtColors !== colorKey || !state.displayObjects) {
        app.stage.removeChildren().forEach(child => child.destroy({ children: true }));
        state.displayObjects = [];
        const addShape = (shape, mark) => {
          const graphic = new PIXI.Graphics(), fill = { color: colors[shape.color], alpha: shape.alpha ?? 1 };
          if (shape.type === 'line') graphic.moveTo(shape.x1, shape.y1).lineTo(shape.x2, shape.y2).stroke({ ...fill, width: shape.width });
          else if (shape.type === 'rect') {
            graphic.position.set(shape.x, shape.y);
            if (mark && shape.w > 6) {
              // A shallow upper face gives the comparison material depth;
              // the front face still ends at the exact D3-scaled value.
              graphic.poly([0, 0, 3, -3, shape.w, -3, shape.w, 0]).fill({ color: colors[shape.color], alpha: 0.38 });
            }
            graphic.roundRect(0, 0, Math.max(0.2, shape.w), shape.h, shape.radius || 0).fill(fill);
          } else {
            graphic.position.set(shape.x, shape.y);
            graphic.circle(0, 0, shape.r);
            if (shape.outline) graphic.stroke({ ...fill, width: shape.width });
            else {
              graphic.fill(fill);
              if (mark) {
                // Nested curved faces retain the bubble's true outer area.
                graphic.ellipse(-shape.r * 0.17, -shape.r * 0.28, shape.r * 0.67, shape.r * 0.48).fill({ color: colors.text, alpha: 0.10 });
                graphic.ellipse(-shape.r * 0.24, -shape.r * 0.43, shape.r * 0.35, shape.r * 0.18).fill({ color: colors.text, alpha: 0.15 });
              }
            }
          }
          app.stage.addChild(graphic); state.displayObjects.push({ object: graphic, item: shape, mark });
        };
        scene.shapes.forEach(shape => addShape(shape, false)); scene.marks.forEach(shape => addShape(shape, true));
        scene.texts.forEach(item => {
          const label = new PIXI.Text({ text: item.value, resolution: app.renderer.resolution, style: { fontFamily: 'Archivo', fontSize: item.size, fontWeight: String(item.weight || 450), fill: colors[item.color], lineHeight: item.size + 3, align: item.anchor === 'middle' ? 'center' : item.anchor === 'end' ? 'right' : 'left' } });
          label.anchor.set(item.anchor === 'middle' ? 0.5 : item.anchor === 'end' ? 1 : 0, item.value.includes('\n') ? 0 : 0.5);
          label.position.set(item.x, item.y - (item.value.includes('\n') ? item.size / 2 : 0)); app.stage.addChild(label); state.displayObjects.push({ object: label, item, mark: false });
        });
        state.builtScene = scene; state.builtColors = colorKey;
      }
      state.displayObjects.forEach(({ object, item, mark }) => {
        object.alpha = item.value !== undefined ? 1 : alpha(item) * (mark ? progress : 1);
        if (mark) { if (item.type === 'rect') object.scale.x = progress; else object.scale.set(0.75 + progress * 0.25); }
      });
      app.render();
      state.root.dataset.d3Draws = String(Number(state.root.dataset.d3Draws) + 1); state.root.dataset.d3Marks = String(scene.marks.length);
      state.root.dataset.d3Renderer = 'pixijs-' + (app.renderer.gpu ? 'webgpu' : 'webgl'); state.root.dataset.d3State = 'ready'; state.svg.setAttribute('aria-hidden', 'true');
    } catch (error) { fallback(state, error); }
  }
  function render(state, animate = false) {
    (window.__gammaCancelFrame || cancelAnimationFrame)(state.frame); state.frame = 0;
    if (!animate || reduced.matches) { draw(state); return; }
    const start = performance.now();
    const frame = now => {
      state.frame = 0;
      if (!state.active || (document.hidden && !window.__gammaBroadcastActive) || !state.app) return;
      const t = Math.min(1, (now - start) / 600); draw(state, 1 - Math.pow(1 - t, 4));
      if (t < 1 && state.app) state.frame = (window.__gammaFrame || requestAnimationFrame)(frame);
    };
    state.frame = (window.__gammaFrame || requestAnimationFrame)(frame);
  }
  async function activate(state) {
    refreshScene(state);
    if (!state.scene || exported || typeof PIXI === 'undefined' || state.failed) { state.root.dataset.d3State = 'fallback'; return; }
    if (state.app) { state.app.renderer.resize(state.scene.width, state.scene.height, Math.min(devicePixelRatio || 1, 2)); render(state); return; }
    if (state.pending) return;
    const generation = state.generation;
    state.pending = (async () => {
      const app = new PIXI.Application();
      try {
        await app.init({ canvas: state.root.querySelector('canvas'), width: state.scene.width, height: state.scene.height, resolution: Math.min(devicePixelRatio || 1, 2), autoDensity: true, autoStart: false, sharedTicker: false, preference: 'webgpu', preserveDrawingBuffer: true, antialias: true, backgroundAlpha: 1, backgroundColor: palette(state.root).bg });
        app.stop();
        if (generation !== state.generation || !state.active) { app.destroy({ removeView: false }, { children: true }); return; }
        state.app = app; state.root._pixiApp = app;
        app.canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(state); }, { once: true });
        app.renderer.gpu?.device?.lost.then(() => { if (state.app === app) fallback(state); });
        render(state, true);
      } catch (error) { try { app.destroy({ removeView: false }, { children: true }); } catch {} fallback(state, error); }
      finally {
        state.pending = null;
        // Navigation can return to this slide while its earlier init is pending.
        if (state.active && generation !== state.generation && !state.failed) activate(state);
      }
    })();
    await state.pending;
  }
  function sync() {
    const current = typeof Reveal !== 'undefined' ? Reveal.getCurrentSlide() : null;
    states.forEach(state => {
      const active = (!document.hidden || window.__gammaBroadcastActive) && state.root.dataset.d3View !== '3d' && (current ? current.contains(state.root) : state.root === roots[0]); state.active = active;
      if (active) activate(state);
      else { state.generation++; dispose(state); state.root.dataset.d3Renderer = 'svg'; state.root.dataset.d3State = state.failed ? 'fallback' : 'idle'; state.root.querySelector('dialog')?.close(); }
    });
  }
  states.forEach(state => {
    const readout = state.root.querySelector('.d3-webgpu-readout'), hint = readout.textContent;
    function select(key) { if (state.selected === key) return; state.selected = key; readout.textContent = state.scene?.hits.find(hit => hit.key === key)?.label || hint; render(state); }
    const pointAt = event => {
      if (!state.scene || state.root.dataset.d3View === '3d') return;
      const rect = state.plot.getBoundingClientRect(), x = (event.clientX - rect.left) * state.scene.width / rect.width, y = (event.clientY - rect.top) * state.scene.height / rect.height;
      const hit = state.scene.hits.find(hit => x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h); select(hit?.key ?? -1);
    };
    state.plot.addEventListener('pointermove', pointAt);
    state.plot.addEventListener('pointerdown', pointAt);
    state.plot.addEventListener('pointerleave', event => { if (state.root.dataset.d3View !== '3d' && event.pointerType === 'mouse') select(-1); });
    state.plot.addEventListener('keydown', event => {
      if (!state.scene || state.root.dataset.d3View === '3d') return;
      if (event.key === 'Escape') { event.stopPropagation(); select(-1); return; }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const total = state.scene.hits.length, delta = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1; select((state.selected + delta + total) % total);
    });
    const dialog = state.root.querySelector('dialog');
    state.root.querySelector('[data-d3-action="values"]').addEventListener('click', () => dialog.showModal());
    state.root.querySelector('[data-d3-action="close"]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', event => { event.stopPropagation(); if (event.key === 'Escape') { event.preventDefault(); dialog.close(); } });
    state.observer = new ResizeObserver(() => { if (!state.active) return; refreshScene(state); if (state.app) { state.app.renderer.resize(state.scene.width, state.scene.height, Math.min(devicePixelRatio || 1, 2)); render(state); } });
    state.observer.observe(state.plot);
  });
  if (typeof Reveal !== 'undefined') Reveal.on('slidechanged', sync);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('gamma:gpu-view-changed', sync);
  window.addEventListener('gamma:theme-changed', () => states.forEach(state => { if (state.active) render(state); }));
  reduced.addEventListener('change', () => states.forEach(state => { if (state.active) render(state); }));
  window.addEventListener('pagehide', () => states.forEach(state => { state.active = false; state.generation++; dispose(state); }));
  window.addEventListener('pageshow', sync);
  window.__gammaGPUCharts = { states, sync }; sync(); return window.__gammaGPUCharts;
}
