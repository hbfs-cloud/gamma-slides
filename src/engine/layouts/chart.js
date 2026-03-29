import { buildChartHTML } from '../components/chart-builder.js';

export function renderChart(slide, theme) {
  const chart = buildChartHTML(slide.chart);

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${slide.title}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${slide.subtitle}</p>` : ''}
    <div style="flex: 1; min-height: 0; margin-top: 10px; width: 100%;">
      ${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}
    </div>
  `;
}
