import { escapeHtml } from '../html.js';
import { getIcon } from './icons.js';

// The spatial view accepts a deliberately bounded, unambiguous subset. Anything
// else remains an ordinary chart; never silently drop observations or mix axes.
export function spatialModel(spec) {
  const data = spec?.data || {};
  const options = spec?.options || {};
  const sets = data.datasets || [];
  if (!['bar', 'scatter'].includes(spec?.type) || !sets.length || sets.length > 6) return null;
  if (options.stacked || options.horizontal || sets.some(s => s.y_axis === 'right')) return null;
  const points = [];
  if (spec.type === 'bar') {
    if (!data.labels?.length || data.labels.length > 12) return null;
    for (const [series, set] of sets.entries()) {
      if (set.values?.length !== data.labels.length) return null;
      for (const [column, value] of set.values.entries()) {
        // Missing observations must stay explicit in the existing 2D renderer.
        if (value === null) return null;
        if (!Number.isFinite(value)) return null;
        points.push({ x: column, y: value, z: series, series, index: column, name: data.labels[column] });
      }
    }
  } else {
    for (const [series, set] of sets.entries()) {
      if (!set.points?.length) return null;
      for (const [index, p] of set.points.entries()) {
        if (![p.x, p.y, p.z].every(Number.isFinite)) return null;
        points.push({ x: p.x, y: p.y, z: p.z, series, index, name: String(p.name || `${set.label || 'Series'} ${index + 1}`) });
      }
    }
  }
  if (!points.length || points.length > 500) return null;
  const bounds = key => {
    const values = points.map(p => p[key]);
    let min = Math.min(...values), max = Math.max(...values);
    if (spec.type === 'bar' && key === 'y') { min = Math.min(0, min); max = Math.max(0, max); }
    if (min === max) { const pad = Math.max(.5, Math.abs(min) * .05); min -= pad; max += pad; }
    if (!Number.isFinite(max - min) || max <= min) return null;
    return [min, max];
  };
  const ranges = { x: bounds('x'), y: bounds('y'), z: bounds('z') };
  if (Object.values(ranges).some(range => !range)) return null;
  return {
    kind: spec.type, points, ranges,
    series: sets.map((s, i) => s.label || `Series ${i + 1}`),
    categories: data.labels || [],
    axes: [options.x_label || 'Category', options.y_label || 'Value', options.z_label || (spec.type === 'bar' ? 'Series' : 'Z')],
    formats: [options.format_x || '', options.format_y || '', options.format_z || ''],
  };
}

export function formatSpatialValue(value, format = '') {
  if (format === 'currency_m') return `${value < 0 ? '-' : ''}$${Math.abs(value) / 1e6}M`;
  if (format === 'currency_k') return `${value < 0 ? '-' : ''}$${Math.abs(value) / 1e3}K`;
  return String(value) + (format === 'percent' ? '%' : '');
}

export function immersiveChartHTML(model, chart, language = 'en') {
  const t = {
    spatial: '3D view', flat: '2D view', data: 'Values', reset: 'Reset view', left: 'Rotate left', right: 'Rotate right',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', explore: 'Explore data',
    help: 'Drag to orbit · Arrow keys · + / − to zoom',
    status: 'Orthographic projection · exact values', select: 'Observation', series: 'Series',
  };
  const json = JSON.stringify(model).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
  const value = (p, axis) => escapeHtml(formatSpatialValue(p[axis], model.formats['xyz'.indexOf(axis)]));
  const rows = model.points.map(p => `<tr><th scope="row">${escapeHtml(p.name)}</th><td>${escapeHtml(model.series[p.series])}</td>${(model.kind === 'bar' ? ['y'] : ['x', 'y', 'z']).map(axis => `<td>${value(p, axis)}</td>`).join('')}</tr>`).join('');
  const button = (action, label, content = label) => `<button type="button" data-spatial-action="${action}" aria-label="${label}">${content}</button>`;
  return `<div class="immersive-chart" data-immersive-view="flat" data-spatial-chart="${chart.id}">
    <script type="application/json" class="spatial-model">${json}</script>
    <div class="spatial-toolbar" role="group" aria-label="${t.explore}">
      <div class="spatial-views">${button('spatial', t.spatial)}${button('flat', t.flat)}${button('data', t.data)}</div>
      <div class="spatial-shots" role="group" aria-label="Viewpoint">${button('reset', t.reset, 'Overview')}${button('profile', 'Profile view', 'Profile')}${button('plan', 'Top view', 'Top')}</div>
      <details class="spatial-camera-tools"><summary>Camera</summary><div class="spatial-camera">${button('left', t.left, getIcon('rotate-left'))}${button('right', t.right, getIcon('rotate-right'))}${button('zoom-in', t.zoomIn, getIcon('plus'))}${button('zoom-out', t.zoomOut, getIcon('minus'))}</div></details>
    </div>
    <div class="spatial-body">
      <div class="spatial-viewport" tabindex="0" role="group" aria-label="${t.explore}. ${t.help}"><div class="spatial-labels" aria-hidden="true"></div></div>
      <div class="spatial-flat">${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}</div>
      <div class="spatial-table" tabindex="0" role="region" aria-label="${t.data}"><table><caption>${t.data}</caption><thead><tr><th scope="col">${t.select}</th><th scope="col">${t.series}</th>${(model.kind === 'bar' ? [1] : [0, 1, 2]).map(i => `<th scope="col">${escapeHtml(model.axes[i])}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
      <aside class="spatial-inspector"><output class="spatial-story" aria-live="polite"></output><output class="spatial-readout" aria-live="polite"></output><label>${t.select}<select class="spatial-selection">${model.points.map((p, i) => `<option value="${i}">${escapeHtml(p.name)} · ${escapeHtml(model.series[p.series])}</option>`).join('')}</select></label><div class="spatial-legend">${model.series.map((name, i) => `<span><i style="--series-index:${i}"></i>${escapeHtml(name)}</span>`).join('')}</div><p class="spatial-hint">${t.help}</p></aside>
    </div><p class="spatial-status" role="status">${t.status}</p>
  </div>`;
}

export function immersiveCSS() {
  return `
  .reveal .slides section.variant-immersive { justify-content:flex-start; }
  .reveal .slides section.variant-immersive > .slide-header { margin-bottom:12px; }
  .reveal .slides section.variant-immersive h2 { font-size:2.15em; letter-spacing:-.03em; }
  .immersive-chart { display:flex; flex-direction:column; flex:1; min-height:0; width:100%; text-align:left; --spatial-line:color-mix(in srgb,var(--gamma-muted) 30%,transparent); --spatial-label-size:12px; --spatial-value-size:24px; --spatial-caption-size:10px; }
  .spatial-toolbar { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:6px 0 0; border-top:1px solid var(--spatial-line); order:2; position:relative; }
  .spatial-views,.spatial-camera { display:flex; gap:4px; }
  .immersive-chart button { min-height:44px; min-width:44px; padding:6px 12px; border:0; border-radius:4px; background:transparent; color:var(--gamma-text); font:550 15px/1.2 Archivo,system-ui,sans-serif; cursor:pointer; }
  .immersive-chart button:hover { background:color-mix(in srgb,var(--gamma-primary) 12%,transparent); }
  .immersive-chart button[aria-pressed="true"] { background:var(--gamma-text); color:var(--gamma-bg); }
  .immersive-chart button:disabled { opacity:.45; cursor:default; }
  .immersive-chart :focus-visible { outline:2px solid var(--gamma-primary); outline-offset:3px; }
  .spatial-body { display:grid; grid-template-columns:260px minmax(0,1fr); flex:1; min-height:0; gap:18px; padding-top:12px; }
  .spatial-viewport,.spatial-flat { grid-column:2; grid-row:1; }
  .spatial-inspector { grid-column:1; grid-row:1; }
  .spatial-shots { display:flex; gap:4px; }
  .spatial-shots button { color:var(--gamma-muted); }
  .spatial-shots button[aria-pressed="true"] { background:transparent; color:var(--gamma-primary); box-shadow:inset 0 -2px var(--gamma-primary); border-radius:0; }
  .spatial-camera-tools { position:relative; }
  .spatial-camera-tools summary { min-height:44px; display:flex; align-items:center; cursor:pointer; color:var(--gamma-muted); font:500 13px/1 Archivo,system-ui,sans-serif; list-style:none; padding:0 12px; }
  .spatial-camera-tools summary::-webkit-details-marker { display:none; }
  .spatial-camera-tools .spatial-camera { position:absolute; bottom:48px; right:0; padding:6px; border:1px solid var(--spatial-line); background:var(--gamma-bg); z-index:5; }
  .spatial-viewport { position:relative; min-width:0; min-height:0; overflow:hidden; cursor:grab; touch-action:none; }
  .spatial-viewport:active { cursor:grabbing; }
  .spatial-viewport canvas,.spatial-labels { position:absolute; inset:0; width:100%; height:100%; }
  .spatial-labels { pointer-events:none; }
  .spatial-marker { position:absolute; width:18px; height:18px; border:2px solid var(--gamma-text); border-radius:50%; transform:translate(-50%,-50%); pointer-events:none; }
  .spatial-labels span { position:absolute; font:500 12px/1.2 Archivo,system-ui,sans-serif; color:var(--gamma-muted); white-space:nowrap; transform:translate(-50%,-50%); padding:2px 4px; background:var(--gamma-bg); }
  .spatial-labels span.axis-title { color:var(--gamma-text); font-weight:650; }
  .spatial-flat { min-width:0; min-height:0; }
  .spatial-flat .chart-container { height:100%; }
  .spatial-inspector { padding:12px 10px 8px 0; display:flex; flex-direction:column; min-height:0; overflow:auto; }
  .spatial-story { display:block; }
  .spatial-story b { display:block; font:600 24px/1.15 Archivo,system-ui,sans-serif; color:var(--gamma-text); letter-spacing:-.025em; }
  .spatial-story strong { display:block; margin:14px 0 8px; font:550 64px/.95 Archivo,system-ui,sans-serif; letter-spacing:-.04em; color:var(--gamma-primary); }
  .spatial-story small { display:block; color:var(--gamma-muted); font:450 14px/1.4 Archivo,system-ui,sans-serif; }
  .spatial-inspector label { color:var(--gamma-muted); font:500 13px/1.4 Archivo,system-ui,sans-serif; }
  .spatial-selection { display:block; width:100%; margin-top:8px; border:1px solid var(--spatial-line); border-radius:4px; padding:10px 6px; background:var(--gamma-bg); color:var(--gamma-text); font:500 14px/1.3 Archivo,system-ui,sans-serif; }
  .spatial-readout { display:block; margin:18px 0; color:var(--gamma-text); }
  .spatial-readout strong { display:block; font:550 24px/1.15 Archivo,system-ui,sans-serif; letter-spacing:-.03em; overflow-wrap:anywhere; }
  .spatial-readout small { display:block; margin:6px 0 12px; font:500 13px/1.3 Archivo,system-ui,sans-serif; color:var(--gamma-muted); }
  .spatial-legend { display:flex; flex-direction:row; flex-wrap:wrap; gap:14px; margin-top:14px; }
  .spatial-legend span { color:var(--gamma-text); font:500 14px/1.2 Archivo,system-ui,sans-serif; }
  .spatial-legend i { display:inline-block; width:9px; height:9px; margin-right:9px; }
  .reveal .spatial-hint { margin-top:auto; padding-top:18px; font:450 12px/1.5 Archivo,system-ui,sans-serif; color:var(--gamma-muted); }
  .reveal .spatial-status { margin:4px 0 6px; font:500 12px/1.2 Archivo,system-ui,sans-serif; color:var(--gamma-muted); order:3; }
  .spatial-table { overflow:auto; min-height:0; grid-column:1/-1; }
  .spatial-table table { width:100%; border-collapse:collapse; font:450 15px/1.4 Archivo,system-ui,sans-serif; font-variant-numeric:tabular-nums; }
  .spatial-table caption { text-align:left; padding-bottom:8px; }
  .spatial-table th,.spatial-table td { padding:8px 12px; border-bottom:1px solid var(--spatial-line); text-align:right; }
  .spatial-table th:first-child,.spatial-table td:nth-child(2) { text-align:left; }
  .spatial-table thead { position:sticky; top:0; background:var(--gamma-bg); }
  .immersive-chart:not([data-immersive-view="spatial"]) .spatial-viewport,
  .immersive-chart:not([data-immersive-view="flat"]) .spatial-flat,
  .immersive-chart:not([data-immersive-view="data"]) .spatial-table,
  .immersive-chart[data-immersive-view="data"] .spatial-inspector { display:none; }
  .immersive-chart:not([data-immersive-view="spatial"]) .spatial-camera { visibility:hidden; }
  .immersive-chart:not([data-immersive-view="spatial"]) .spatial-shots,.immersive-chart:not([data-immersive-view="spatial"]) .spatial-camera-tools { visibility:hidden; }
  .immersive-chart:not([data-immersive-view="spatial"]) .spatial-hint { visibility:hidden; }
  html.gamma-export .spatial-toolbar,html.gamma-export .spatial-inspector,html.gamma-export .spatial-status { display:none; }
  html.gamma-export .spatial-body { display:block; }
  html.gamma-export .spatial-flat { height:100%; }
  @media (max-width:900px) {
    body.gamma-immersive-mobile .reveal .slides { transform:none!important; zoom:1!important; inset:0!important; width:100%!important; height:100%!important; }
    body.gamma-immersive-mobile .reveal .slides section.present.variant-immersive { inset:0!important; width:100%!important; height:100%!important; padding:72px 16px 112px!important; font-size:16px; }
    body.gamma-immersive-mobile .reveal .slides section.present.variant-immersive h2 { font:650 24px/1.12 Archivo,system-ui,sans-serif; }
    body.gamma-immersive-mobile .slide-subtitle { font:450 12px/1.4 Archivo,system-ui,sans-serif; margin-top:5px; }
    body.gamma-immersive-mobile .spatial-toolbar { flex-wrap:wrap; justify-content:center; gap:0; padding:4px 0; }
    body.gamma-immersive-mobile .spatial-views { width:100%; }
    body.gamma-immersive-mobile .spatial-views button { flex:1; }
    body.gamma-immersive-mobile .spatial-camera { justify-content:center; }
    body.gamma-immersive-mobile .spatial-body { grid-template-columns:minmax(0,1fr); grid-template-rows:minmax(100px,1fr) auto; gap:8px; padding-top:8px; }
    body.gamma-immersive-mobile .spatial-viewport,body.gamma-immersive-mobile .spatial-flat { grid-column:1; }
    body.gamma-immersive-mobile .spatial-inspector { grid-row:2; }
    body.gamma-immersive-mobile .spatial-story { display:grid; grid-template-columns:1fr auto; align-items:baseline; gap:4px 12px; margin-bottom:10px; }
    body.gamma-immersive-mobile .spatial-story b { font:600 18px/1.2 Archivo,system-ui,sans-serif; }
    body.gamma-immersive-mobile .spatial-story strong { font:550 28px/1 Archivo,system-ui,sans-serif; margin:0; }
    body.gamma-immersive-mobile .spatial-story small { display:block; grid-column:1/-1; font:450 11px/1.2 Archivo,system-ui,sans-serif; }
    body.gamma-immersive-mobile .spatial-camera-tools { display:none; }
    body.gamma-immersive-mobile .spatial-inspector { display:grid; grid-template-columns:1fr; border-left:0; border-top:1px solid var(--spatial-line); padding:8px 0 0; overflow:visible; }
    body.gamma-immersive-mobile .spatial-inspector label { display:flex; align-items:center; gap:10px; }
    body.gamma-immersive-mobile .spatial-selection { flex:1; min-width:0; margin:0; min-height:44px; }
    body.gamma-immersive-mobile .spatial-readout { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); column-gap:8px; margin:8px 0 0; }
    body.gamma-immersive-mobile .spatial-readout strong { grid-row:1; font-size:var(--spatial-value-size); }
    body.gamma-immersive-mobile .spatial-readout small { grid-row:2; font-size:var(--spatial-label-size); margin:4px 0; }
    body.gamma-immersive-mobile .spatial-readout small:last-child { display:none; }
    body.gamma-immersive-mobile .spatial-legend { flex-direction:row; flex-wrap:wrap; gap:8px; margin-top:4px; }
    body.gamma-immersive-mobile .spatial-legend span { font-size:var(--spatial-label-size); }
    body.gamma-immersive-mobile .spatial-hint { display:none; }
    body.gamma-immersive-mobile .spatial-status { font-size:var(--spatial-caption-size); }
    body.gamma-immersive-mobile .immersive-chart[data-immersive-view="data"] .spatial-inspector { display:none; }
    body.gamma-immersive-mobile .immersive-chart[data-immersive-view="data"] .spatial-body { display:block; overflow:auto; }
    body.gamma-immersive-mobile .immersive-chart:not([data-immersive-view="spatial"]) .spatial-camera { display:none; }
    body.gamma-immersive-mobile .reveal .slides section.present > .slide-source { left:16px; right:16px; bottom:64px; font:450 9px/1.35 Archivo,system-ui,sans-serif; flex-direction:column; gap:3px; }
    body.gamma-immersive-mobile .theme-stage { display:none; }
  }
  @media print { .spatial-toolbar,.spatial-inspector,.spatial-status { display:none!important; } .spatial-body { display:block; } .spatial-flat { display:block!important; height:100%; } .spatial-viewport,.spatial-table { display:none!important; } }
  `;
}
