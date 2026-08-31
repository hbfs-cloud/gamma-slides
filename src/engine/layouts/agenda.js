import { getIcon } from '../components/icons.js';
import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderSource } from '../components/slide-header.js';

export function renderAgenda(slide, theme) {
  if (slide.variant === 'editorial') {
    const rows = (slide.items || []).map((item, index) => `<div class="agenda-editorial-row">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <h3>${escapeHtml(item.title || item.text || '')}</h3>
      <p>${escapeHtml(item.description || '')}</p>
    </div>`).join('');
    return `<div class="editorial-agenda">${renderSlideHeader(slide)}<div class="agenda-editorial-list">${rows}</div></div>${renderSource(slide)}`;
  }
  const items = (slide.items || []).map((item, index) => {
    const title = typeof item === 'string' ? item : item.title || item.text || '';
    const description = typeof item === 'string' ? '' : item.description || '';
    const icon = typeof item === 'object' && item.icon
      ? `<span class="agenda-icon">${getIcon(item.icon, theme.primary, 18)}</span>`
      : `<span class="agenda-number">${String(index + 1).padStart(2, '0')}</span>`;

    return `<div class="agenda-item">
      <div class="agenda-marker">${icon}</div>
      <div>
        <h3>${escapeHtml(title)}</h3>
        ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      </div>
    </div>`;
  }).join('');

  return `
    ${slide.badge ? `<div class="gamma-badge">${escapeHtml(slide.badge)}</div>` : ''}
    ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <div class="agenda-grid agenda-grid-${Math.min(Math.max(items ? (slide.items || []).length : 1, 1), 6)}">
      ${items}
    </div>
  `;
}
