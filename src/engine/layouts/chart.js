import { buildChartHTML } from '../components/chart-builder.js';
import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderInsight, renderSource } from '../components/slide-header.js';

export function renderChart(slide, theme) {
  if (!slide.chart) return `<div class="empty-state">Chart data is missing</div>`;
  const chart = buildChartHTML(slide.chart);

  if (slide.variant === 'story') {
    return `<div class="story-chart">
      <div class="story-chart-copy">${renderSlideHeader(slide)}${renderInsight(slide)}</div>
      <div class="story-chart-visual">${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}</div>
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
