import { cinematicModel, cinematicHTML } from '../components/cinematic-comparison.js';
import { buildChartHTML } from '../components/chart-builder.js';
import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderInsight, renderSource } from '../components/slide-header.js';
import { spatialModel, immersiveChartHTML, formatSpatialValue } from '../components/immersive-data.js';
import { d3WebGPUHTML } from '../components/d3-webgpu.js';

export function renderChart(slide, theme, deck) {
  if (!slide.chart) return `<div class="empty-state">Chart data is missing</div>`;
  if (slide.variant === 'd3-webgpu') return d3WebGPUHTML(slide, slide.chart, deck?.meta?.language)+renderSource(slide);
  const chart = buildChartHTML(slide.chart);

  if (slide.variant === 'cinematic') {
    const model=cinematicModel(slide.chart);
    if(model)return cinematicHTML(slide,chart,model,deck?.meta?.language)+renderSource(slide);
    return `${renderSlideHeader(slide)}<div style="flex:1; min-height:0;">${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}</div>${renderSource(slide)}`;
  }

  if (slide.variant === 'immersive') {
    const model = spatialModel(slide.chart);
    if (model) return `${renderSlideHeader(slide)}${immersiveChartHTML(model, chart, deck?.meta?.language)}${renderSource(slide)}`;
    return `${renderSlideHeader(slide)}<div style="flex:1; min-height:0;">${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}</div>${renderSource(slide)}`;
  }

  if (slide.variant === 'story') {
    let mobileKey = '';
    if (deck?.meta?.experience && slide.chart.type === 'sankey') mobileKey = `<details class="experience-flow-labels"><summary>Full flow labels</summary><ul>${(slide.chart.data.nodes || []).map(node => `<li>${escapeHtml(typeof node === 'string' ? node : node.name)}</li>`).join('')}</ul></details>`;
    if (deck?.meta?.experience && slide.chart.type === 'waterfall') mobileKey = `<ol class="experience-chart-key" aria-label="Bridge components">${slide.chart.data.labels.map((label, index) => `<li><b>${index + 1}</b><span>${escapeHtml(label)}</span><strong>${escapeHtml(formatSpatialValue(slide.chart.data.datasets[0].values[index], slide.chart.options?.format_y))}</strong></li>`).join('')}</ol>`;
    return `<div class="story-chart">
      <div class="story-chart-copy">${renderSlideHeader(slide)}${renderInsight(slide)}</div>
      <div class="story-chart-visual">${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}</div>
      ${mobileKey}
    </div>${renderSource(slide)}`;
  }

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${escapeHtml(slide.title)}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <div style="flex: 1; min-height: 0; margin-top: 10px; width: 100%;">
      ${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}
    </div>
  `;
}
