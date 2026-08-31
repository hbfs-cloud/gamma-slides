import { getIcon } from '../components/icons.js';
import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderInsight, renderSource } from '../components/slide-header.js';

export function renderMetrics(slide, theme) {
  const cols = Math.min(Math.max(Number(slide.columns) || Math.min((slide.metrics || []).length, 4), 1), 4);
  const items = (slide.metrics || []).map(m => {
    const inferredTrend = m.delta?.startsWith('+') ? 'up' : m.delta?.startsWith('-') ? 'down' : 'neutral';
    const trend = ['up', 'down', 'neutral'].includes(m.trend) ? m.trend : inferredTrend;
    const icon = m.icon ? `<div class="metric-icon">${getIcon(m.icon, theme.primary, 18)}</div>` : '';
    return `
      <div class="metric-card${m.featured ? ' metric-featured' : ''}" role="group" aria-label="${escapeHtml(m.label)}">
        ${icon}
        <div class="label">${escapeHtml(m.label)}</div>
        <div class="value">${escapeHtml(m.value)}</div>
        ${m.delta ? `<div class="delta ${trend}">${escapeHtml(m.delta)}</div>` : ''}
      </div>`;
  }).join('');

  if (slide.variant === 'hero') {
    const metrics = slide.metrics || [];
    const primary = metrics.find(metric => metric.featured) || metrics[0];
    const support = metrics.filter(metric => metric !== primary).slice(0, 3).map(metric => {
      const inferredTrend = metric.delta?.startsWith('-') ? 'down' : 'up';
      const trend = ['up', 'down', 'neutral'].includes(metric.trend) ? metric.trend : inferredTrend;
      return `<div class="metric-support-row">
        <div class="label">${escapeHtml(metric.label)}</div>
        <div class="value">${escapeHtml(metric.value)}</div>
        ${metric.delta ? `<div class="delta ${trend}">${escapeHtml(metric.delta)}</div>` : ''}
      </div>`;
    }).join('');
    return `${renderSlideHeader(slide)}<div class="metrics-hero">
      <div class="metric-hero-primary"><div class="label">${escapeHtml(primary?.label || '')}</div><div class="value">${escapeHtml(primary?.value || '')}</div>${primary?.delta ? `<div class="delta">${escapeHtml(primary.delta)}</div>` : ''}</div>
      <div class="metrics-support">${support}</div>
    </div>${renderInsight(slide)}${renderSource(slide)}`;
  }

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${escapeHtml(slide.title)}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <div class="grid-${cols}" style="margin-top: 16px; width: 100%;">
      ${items}
    </div>
  `;
}
