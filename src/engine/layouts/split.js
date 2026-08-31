import { buildChartHTML } from '../components/chart-builder.js';
import { escapeHtml, richText, safeUrl } from '../html.js';

export function renderSplit(slide, theme) {
  const leftHtml = renderPanel(slide.left, theme);
  const rightHtml = renderPanel(slide.right, theme);

  const callout = slide.callout
    ? `<div class="highlight-box">
        ${slide.callout.text ? richText(slide.callout.text) : ''}
      </div>`
    : '';

  // Determine if one side is a chart — give it more space
  const leftIsChart = slide.left?.type === 'chart';
  const rightIsChart = slide.right?.type === 'chart';
  const gridCols = leftIsChart && !rightIsChart ? '1.2fr 0.8fr'
    : !leftIsChart && rightIsChart ? '0.8fr 1.2fr'
    : '1fr 1fr';

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${escapeHtml(slide.title)}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <div style="display: grid; grid-template-columns: ${gridCols}; gap: 20px; margin-top: 14px; flex: 1; min-height: 0; align-items: center;">
      <div style="height: 100%; display: flex; flex-direction: column; justify-content: center;">${leftHtml}</div>
      <div style="height: 100%; display: flex; flex-direction: column; justify-content: center;">${rightHtml}</div>
    </div>
    ${callout}
  `;
}

function renderPanel(panel, theme) {
  if (!panel) return '';

  switch (panel.type) {
    case 'chart': {
      if (!panel.chart) return `<div class="empty-state">Chart data is missing</div>`;
      const chart = buildChartHTML(panel.chart);
      return chart.html.replace('min-height: 280px', 'min-height: 260px; height: 100%');
    }
    case 'table': {
      const spec = panel.table || panel;
      const headers = (spec.headers || []).map(h => `<th scope="col">${escapeHtml(h)}</th>`).join('');
      const rows = (spec.rows || []).filter(Array.isArray).map(row =>
        `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
      ).join('');
      return `<table class="data-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    case 'bullets': {
      return (panel.items || []).map(item =>
        `<div class="bullet-item"><div class="bullet-text">${escapeHtml(typeof item === 'string' ? item : item.text)}</div></div>`
      ).join('');
    }
    case 'image': {
      const img = panel.image || {};
      const fit = ['contain', 'cover', 'fill'].includes(img.fit) ? img.fit : 'contain';
      return `<img src="${safeUrl(img.src)}" alt="${escapeHtml(img.alt || '')}" loading="lazy" decoding="async" style="max-width: 100%; max-height: 380px; object-fit: ${fit}; border-radius: 10px;">`;
    }
    case 'metrics': {
      return (panel.metrics || []).map(m => {
        const trend = ['up', 'down', 'neutral'].includes(m.trend) ? m.trend : 'up';
        return `<div class="metric-card" style="margin-bottom: 10px;">
          <div class="label">${escapeHtml(m.label)}</div>
          <div class="value" style="font-size: 1.5em;">${escapeHtml(m.value)}</div>
          ${m.delta ? `<div class="delta ${trend}">${escapeHtml(m.delta)}</div>` : ''}
        </div>`;
      }).join('');
    }
    default:
      return '';
  }
}
