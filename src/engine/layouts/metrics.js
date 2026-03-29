import { getIcon } from '../components/icons.js';

export function renderMetrics(slide, theme) {
  const cols = slide.columns || Math.min((slide.metrics || []).length, 4);
  const items = (slide.metrics || []).map(m => {
    const trend = m.trend || (m.delta?.startsWith('+') ? 'up' : m.delta?.startsWith('-') ? 'down' : 'neutral');
    const icon = m.icon ? `<div class="metric-icon">${getIcon(m.icon, theme.primary, 18)}</div>` : '';
    return `
      <div class="metric-card">
        ${icon}
        <div class="label">${m.label}</div>
        <div class="value">${m.value}</div>
        ${m.delta ? `<div class="delta ${trend}">${m.delta}</div>` : ''}
      </div>`;
  }).join('');

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${slide.title}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${slide.subtitle}</p>` : ''}
    <div class="grid-${cols}" style="margin-top: 16px; width: 100%;">
      ${items}
    </div>
  `;
}
