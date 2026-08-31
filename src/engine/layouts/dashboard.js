import { buildChartHTML } from '../components/chart-builder.js';
import { getIcon } from '../components/icons.js';
import { escapeHtml, safeUrl } from '../html.js';
import { renderSlideHeader, renderSource } from '../components/slide-header.js';

function renderPanel(panel, theme) {
  const heading = panel.title ? `<div class="dashboard-panel-title">${panel.icon ? getIcon(panel.icon, theme.primary, 15) : ''}<span>${escapeHtml(panel.title)}</span></div>` : '';
  if (panel.type === 'chart') {
    if (!panel.chart) return `${heading}<div class="empty-state">Chart data is missing</div>`;
    const chart = buildChartHTML(panel.chart);
    return `${heading}<div class="dashboard-chart">${chart.html.replace('min-height: 280px', 'height: 100%; min-height: 0')}</div>`;
  }
  if (panel.type === 'metric') {
    return `${heading}<div class="dashboard-metric"><strong>${escapeHtml(panel.value || '')}</strong>${panel.delta ? `<span class="${String(panel.delta).startsWith('-') ? 'negative' : 'positive'}">${escapeHtml(panel.delta)}</span>` : ''}${panel.subtitle ? `<p>${escapeHtml(panel.subtitle)}</p>` : ''}</div>`;
  }
  if (panel.type === 'table') {
    const spec = panel.table || panel;
    const headers = (spec.headers || []).map(header => `<th>${escapeHtml(header)}</th>`).join('');
    const rows = (spec.rows || []).filter(Array.isArray).map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
    return `${heading}<table class="data-table dashboard-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  }
  if (panel.type === 'bullets') {
    const items = (panel.items || []).map(item => `<li>${escapeHtml(typeof item === 'string' ? item : item.text || item.title || '')}</li>`).join('');
    return `${heading}<ul class="dashboard-list">${items}</ul>`;
  }
  if (panel.type === 'image') {
    const image = panel.image || {};
    const fit = ['contain', 'cover', 'fill'].includes(image.fit) ? image.fit : 'contain';
    return `${heading}<img class="dashboard-image" src="${safeUrl(image.src)}" alt="${escapeHtml(image.alt || '')}" style="object-fit:${fit}">`;
  }
  if (panel.type === 'metrics') {
    const metrics = (panel.metrics || []).map(metric => `<div class="dashboard-mini-metric"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong>${metric.delta ? `<small>${escapeHtml(metric.delta)}</small>` : ''}</div>`).join('');
    return `${heading}<div class="dashboard-mini-metrics">${metrics}</div>`;
  }
  return `${heading}<div class="empty-state">Unsupported panel</div>`;
}

export function renderDashboard(slide, theme) {
  const safeTypes = new Set(['chart', 'metric', 'table', 'bullets', 'image', 'metrics']);
  const panels = (slide.panels || []).map(panel => `<article class="dashboard-panel type-${safeTypes.has(panel.type) ? panel.type : 'unknown'} span-${Math.min(Math.max(Number(panel.span) || 1, 1), 3)}">${renderPanel(panel, theme)}</article>`).join('');
  return `${renderSlideHeader(slide)}<div class="dashboard-grid dashboard-grid-${Math.min(Math.max(Number(slide.columns) || 3, 2), 4)}">${panels}</div>${renderSource(slide)}`;
}
