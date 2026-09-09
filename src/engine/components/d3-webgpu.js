import * as d3 from 'd3';
import { escapeHtml } from '../html.js';
import { buildGPUScene, sceneToSVG, initGPUCharts } from './d3-webgpu-runtime.js';

let nextChartId = 0;

export function d3WebGPUModel(chart) {
  const type = chart?.type === 'bubble' ? 'scatter' : chart?.type;
  if (!['bar', 'scatter', 'network'].includes(type)) throw new Error(`Unsupported GPU chart: ${chart?.type}`);
  const options = chart.options || {};
  const data = chart.data || {};
  const model = { type, options, bubble: chart.type === 'bubble' };
  if (type === 'bar') {
    model.labels = data.labels || [];
    model.series = (data.datasets || []).map((series, index) => ({ name: series.label || `Series ${index + 1}`, values: series.values }));
    if (!model.labels.length || !model.series.length || model.series.some(series => series.values?.length !== model.labels.length || series.values.some(value => !Number.isFinite(value)))) throw new Error('GPU bar charts require finite values aligned with category labels.');
    if (options.stacked || data.datasets.some(series => series.y_axis === 'right')) throw new Error('GPU bar charts require comparable unstacked series on one axis.');
  } else if (type === 'scatter') {
    model.points = (data.datasets || []).flatMap((series, index) => (series.points || []).map(point => ({ name: point.name || series.label || `Point ${index + 1}`, x: point.x, y: point.y, size: Number.isFinite(point.size) ? point.size : null, group: series.label || '' })));
    if (!model.points.length || model.points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) throw new Error('GPU scatter charts require numeric x and y coordinates.');
  } else {
    model.nodes = (data.graph_nodes || []).map(node => ({ name: node.name, value: node.value, category: node.category || '' }));
    model.links = (data.graph_links || []).map(link => ({ source: link.source, target: link.target, value: link.value }));
    const names = new Set(model.nodes.map(node => node.name));
    if (!names.size || names.size !== model.nodes.length || model.nodes.some(node => !Number.isFinite(node.value) || node.value < 0) || model.links.some(link => !names.has(link.source) || !names.has(link.target) || !Number.isFinite(link.value) || link.value < 0)) throw new Error('GPU networks require unique nodes and finite, nonnegative node and edge values.');
  }
  return model;
}

function sourceTable(model, fr) {
  const row = values => `<tr>${values.map((value, index) => `<${index ? 'td' : 'th scope="row"'}>${escapeHtml(String(value ?? '—'))}</${index ? 'td' : 'th'}>`).join('')}</tr>`;
  let headers, rows;
  if (model.type === 'bar') {
    headers = ['Segment', ...model.series.map(series => series.name)];
    rows = model.labels.map((label, index) => [label, ...model.series.map(series => series.values[index])]);
  } else if (model.type === 'scatter') {
    headers = ['Observation', model.options.x_label || 'X', model.options.y_label || 'Y', model.options.size_label || (fr ? 'Taille' : 'Size')];
    rows = model.points.map(point => [point.name, point.x, point.y, point.size]);
  } else {
    headers = [fr ? 'Nœud' : 'Node', fr ? 'Catégorie' : 'Category', fr ? 'Exposition' : 'Exposure'];
    rows = model.nodes.map(node => [node.name, node.category, node.value]);
  }
  const table = (caption, heads, body) => `<table><caption>${escapeHtml(caption)}</caption><thead><tr>${heads.map(head => `<th scope="col">${escapeHtml(head)}</th>`).join('')}</tr></thead><tbody>${body.map(row).join('')}</tbody></table>`;
  return table(fr ? 'Données exactes' : 'Exact source values', headers, rows) + (model.type === 'network' ? table(fr ? 'Relations' : 'Connections', ['Source', fr ? 'Cible' : 'Target', fr ? 'Exposition' : 'Exposure'], model.links.map(link => [link.source, link.target, link.value])) : '');
}

export function d3WebGPUHTML(slide, chart, language = 'en') {
  const model = d3WebGPUModel(chart); model.language = language;
  const fr = language.startsWith('fr'), id = `gpu-chart-${++nextChartId}`;
  const json = JSON.stringify(model).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
  const initialScene = buildGPUScene(model, 1100, 380, d3);
  const hint = model.type === 'network' ? (fr ? 'Sélectionnez un nœud pour suivre ses connexions.' : 'Select a node to trace its connections.') : (fr ? 'Sélectionnez une observation pour lire ses valeurs.' : 'Select an observation to inspect its values.');
  return `<div class="d3-webgpu-stage" data-d3-type="${model.type}" data-d3-renderer="svg" data-d3-state="idle" data-d3-draws="0" data-d3-marks="0">
    <script type="application/json" class="d3-webgpu-model">${json}</script>
    <header class="d3-webgpu-heading"><h2 id="${id}-title">${escapeHtml(slide.title || '')}</h2>${slide.subtitle ? `<p>${escapeHtml(slide.subtitle)}</p>` : ''}</header>
    <div class="d3-webgpu-plot" tabindex="0" role="group" aria-labelledby="${id}-title" aria-describedby="${id}-hint">
      <canvas class="d3-webgpu-canvas" aria-hidden="true"></canvas>
      <svg class="d3-webgpu-fallback" viewBox="0 0 1100 380" role="img" aria-label="${escapeHtml(slide.title || '')}">${sceneToSVG(initialScene)}</svg>
    </div>
    <footer class="d3-webgpu-caption"><div><p class="d3-webgpu-insight">${escapeHtml(slide.insight || '')}</p><p class="d3-webgpu-readout" id="${id}-hint" aria-live="polite" aria-atomic="true">${escapeHtml(hint)}</p></div><nav class="d3-webgpu-actions" aria-label="${fr ? 'Explorer les données' : 'Explore data'}">${model.type === 'scatter' && model.options.depth_label ? `<button type="button" class="d3-depth-toggle" aria-pressed="false">${fr ? 'Explorer en 3D' : 'Explore in 3D'}</button>` : ''}<button type="button" data-d3-action="values">${fr ? 'Voir les données' : 'View data'}<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4h12v12H4zM4 8h12M4 12h12M9 4v12"/></svg></button></nav></footer>
    <dialog class="d3-webgpu-data" aria-labelledby="${id}-data-title"><div class="d3-webgpu-data-heading"><h3 id="${id}-data-title">${escapeHtml(slide.title || '')}</h3><button type="button" data-d3-action="close">${fr ? 'Fermer' : 'Close'}</button></div>${sourceTable(model, fr)}</dialog>
  </div>`;
}

export function d3WebGPUCSS() { return `
  .reveal .slides section:has(> .d3-webgpu-stage) { padding:0!important; }
  .reveal .slides section:has(> .d3-webgpu-stage) > .theme-stage { display:none; }
  .d3-webgpu-stage { position:absolute!important; inset:0!important; display:flex; flex-direction:column; gap:24px; padding:48px 72px 82px; box-sizing:border-box; color:var(--gamma-text); background:var(--gamma-bg); text-align:left; overflow:hidden; }
  .d3-webgpu-heading { flex:none; max-width:1050px; }
  .reveal .d3-webgpu-heading h2 { color:var(--gamma-text); font:550 1.75em/1.08 'Source Serif 4',Georgia,serif; letter-spacing:-.025em; text-transform:none; text-wrap:balance; margin:0; }
  .reveal .d3-webgpu-heading p { color:var(--gamma-muted); font:450 16px/1.45 Archivo,sans-serif; margin:12px 0 0; max-width:75ch; }
  .d3-webgpu-plot { position:relative; min-height:200px; flex:1 1 0; width:100%; outline-offset:4px; }
  .d3-webgpu-canvas,.d3-webgpu-fallback { position:absolute; inset:0; display:block; width:100%; height:100%; }
  .d3-webgpu-canvas { visibility:hidden; }
  .d3-webgpu-stage[data-d3-renderer^="pixijs-"] .d3-webgpu-canvas { visibility:visible; }
  .d3-webgpu-stage[data-d3-renderer^="pixijs-"] .d3-webgpu-fallback { visibility:hidden; }
  .d3-webgpu-stage[data-d3-renderer="svg"] .d3-webgpu-fallback { visibility:visible; }
  .d3-webgpu-caption { display:flex; align-items:flex-end; justify-content:space-between; gap:32px; flex:none; }
  .d3-webgpu-caption > div { min-width:0; max-width:80%; }
  .d3-webgpu-actions { display:flex; gap:18px; flex-shrink:0; }
  .reveal .d3-webgpu-insight { color:var(--gamma-text); font:500 16px/1.45 Archivo,sans-serif; margin:0; max-width:75ch; }
  .reveal .d3-webgpu-readout { color:var(--gamma-muted); font:450 12px/1.4 Archivo,sans-serif; margin:8px 0 0; min-height:1.4em; }
  .d3-webgpu-stage button { color:var(--gamma-text); background:transparent; border:0; border-bottom:1px solid var(--gamma-primary); padding:10px 0; min-height:44px; font:550 12px/1.4 Archivo,sans-serif; white-space:nowrap; cursor:pointer; }
  .d3-webgpu-stage button svg { width:18px; height:18px; margin-left:12px; fill:none; stroke:currentColor; stroke-width:1.25; vertical-align:middle; }
  .d3-webgpu-stage :is(button,.d3-webgpu-plot):focus-visible { outline:2px solid var(--gamma-primary); outline-offset:5px; }
  .d3-webgpu-data { width:min(860px,calc(100vw - 48px)); max-height:80vh; padding:24px; border:1px solid var(--gamma-muted); background:var(--gamma-bg); color:var(--gamma-text); font:450 16px/1.45 Archivo,sans-serif; overflow:auto; box-sizing:border-box; }
  .d3-webgpu-data::backdrop { background:color-mix(in srgb,var(--gamma-bg) 85%,transparent); }
  .d3-webgpu-data-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:32px; }
  .reveal .d3-webgpu-data-heading h3 { color:var(--gamma-text); font:550 24px/1.2 Archivo,sans-serif; margin:0; }
  .d3-webgpu-data table { border-collapse:collapse; width:100%; margin-top:24px; font-variant-numeric:tabular-nums; }
  .d3-webgpu-data caption { color:var(--gamma-muted); text-align:left; margin-bottom:12px; font-size:12px; }
  .d3-webgpu-data :is(th,td) { padding:12px 8px; border-bottom:1px solid color-mix(in srgb,var(--gamma-muted) 30%,transparent); text-align:right; font-size:12px; }
  .d3-webgpu-data th:first-child { text-align:left; }
  @media(max-width:900px) {
    .d3-webgpu-stage { position:relative!important; inset:auto!important; flex:none; width:100%; gap:24px; padding:32px 24px 24px; overflow:visible; }
    .reveal .d3-webgpu-heading h2 { font-size:2rem; line-height:1.12; }
    .reveal .d3-webgpu-heading p { font-size:12px; line-height:1.5; }
    .d3-webgpu-plot { min-height:360px; flex:none; }
    .d3-webgpu-stage[data-d3-type="network"] .d3-webgpu-plot { min-height:440px; }
    .d3-webgpu-caption { gap:18px; align-items:flex-start; flex-direction:column; }
    .d3-webgpu-caption > div { max-width:100%; }
    .reveal .d3-webgpu-insight { font-size:12px; line-height:1.5; }
    .d3-webgpu-data { padding:18px; }
    .d3-webgpu-data :is(th,td) { font-size:10px; padding:8px 4px; }
    .reveal .d3-webgpu-data-heading h3 { font-size:16px; }
  }
  @media print { .d3-webgpu-canvas { display:none!important; } .d3-webgpu-fallback { visibility:visible!important; } .d3-webgpu-caption button,.d3-webgpu-readout { visibility:hidden; } }
`; }

export function d3WebGPUJS() {
  return `function initD3WebGPU() { return (${initGPUCharts.toString()})(${buildGPUScene.toString()}, ${sceneToSVG.toString()}); }`;
}
