import { getIcon } from '../components/icons.js';
import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderInsight, renderSource } from '../components/slide-header.js';

export function renderBullets(slide, theme) {
  if (slide.variant === 'pillars') {
    const pillars = (slide.items || []).map((item, index) => `<div class="strategy-item">
      <span class="strategy-number">${String(index + 1).padStart(2, '0')}</span>
      <h3>${escapeHtml(item.title || item.text || '')}</h3>
      ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
    </div>`).join('');
    return `${renderSlideHeader(slide)}<div class="strategy-grid">${pillars}</div>${renderInsight(slide)}${renderSource(slide)}`;
  }
  const items = (slide.items || []).map(item => {
    const iconSvg = item.icon ? getIcon(item.icon, theme.primary, 18) : getIcon('check-circle', theme.primary, 18);
    return `
      <div class="bullet-item">
        <div class="bullet-icon">${iconSvg}</div>
        <div class="bullet-text">${escapeHtml(item.text || item.title || '')}</div>
      </div>`;
  }).join('');

  const columns = Math.min(Math.max(Number(slide.columns) || ((slide.items || []).length > 4 ? 2 : 1), 1), 2);

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${escapeHtml(slide.title)}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <div class="bullet-list bullet-list-${columns}">
      ${items}
    </div>
  `;
}
