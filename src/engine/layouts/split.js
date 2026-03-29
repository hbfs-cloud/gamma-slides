import { buildChartHTML } from '../components/chart-builder.js';

export function renderSplit(slide, theme) {
  const leftHtml = renderPanel(slide.left, theme);
  const rightHtml = renderPanel(slide.right, theme);

  const callout = slide.callout
    ? `<div class="highlight-box">
        ${slide.callout.text ? slide.callout.text.replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`) : ''}
      </div>`
    : '';

  // Determine if one side is a chart — give it more space
  const leftIsChart = slide.left?.type === 'chart';
  const rightIsChart = slide.right?.type === 'chart';
  const gridCols = leftIsChart && !rightIsChart ? '1.2fr 0.8fr'
    : !leftIsChart && rightIsChart ? '0.8fr 1.2fr'
    : '1fr 1fr';

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${slide.title}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${slide.subtitle}</p>` : ''}
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
      const chart = buildChartHTML(panel.chart);
      return chart.html.replace('min-height: 280px', 'min-height: 260px; height: 100%');
    }
    case 'table': {
      const spec = panel.table || panel;
      const headers = (spec.headers || []).map(h => `<th>${h}</th>`).join('');
      const rows = (spec.rows || []).map(row =>
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
      ).join('');
      return `<table class="data-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    case 'bullets': {
      return (panel.items || []).map(item =>
        `<div class="bullet-item"><div class="bullet-text">${typeof item === 'string' ? item : item.text}</div></div>`
      ).join('');
    }
    case 'image': {
      const img = panel.image || {};
      return `<img src="${img.src}" alt="${img.alt || ''}" style="max-width: 100%; max-height: 380px; object-fit: ${img.fit || 'contain'}; border-radius: 10px;">`;
    }
    case 'metrics': {
      return (panel.metrics || []).map(m =>
        `<div class="metric-card" style="margin-bottom: 10px;">
          <div class="label">${m.label}</div>
          <div class="value" style="font-size: 1.5em;">${m.value}</div>
          ${m.delta ? `<div class="delta ${m.trend || 'up'}">${m.delta}</div>` : ''}
        </div>`
      ).join('');
    }
    default:
      return '';
  }
}
