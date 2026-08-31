import { getIcon } from '../components/icons.js';
import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderInsight, renderSource } from '../components/slide-header.js';

export function renderTimeline(slide, theme) {
  const orientation = ['vertical', 'horizontal'].includes(slide.orientation) ? slide.orientation : null;
  const items = (slide.items || []).map(item => {
    const icon = item.icon ? `<span style="margin-right: 4px; vertical-align: -2px;">${getIcon(item.icon, theme.primary, 14)}</span>` : '';
    return `
      <div class="timeline-item">
        <h4>${icon}${escapeHtml(item.title || '')}</h4>
        <p>${escapeHtml(item.description || item.text || '')}</p>
      </div>`;
  }).join('');

  if (slide.variant === 'editorial') {
    return `${renderSlideHeader(slide)}<div class="timeline timeline-${orientation || 'horizontal'}">${items}</div>${renderInsight(slide)}${renderSource(slide)}`;
  }

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${escapeHtml(slide.title)}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <div class="timeline timeline-${orientation || 'vertical'}">
      ${items}
    </div>
  `;
}
