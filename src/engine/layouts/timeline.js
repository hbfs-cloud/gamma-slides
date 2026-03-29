import { getIcon } from '../components/icons.js';

export function renderTimeline(slide, theme) {
  const items = (slide.items || []).map(item => {
    const icon = item.icon ? `<span style="margin-right: 4px; vertical-align: -2px;">${getIcon(item.icon, theme.primary, 14)}</span>` : '';
    return `
      <div class="timeline-item">
        <h4>${icon}${item.title || ''}</h4>
        <p>${item.description || item.text || ''}</p>
      </div>`;
  }).join('');

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${slide.title}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${slide.subtitle}</p>` : ''}
    <div class="timeline" style="margin-top: 18px; max-width: 700px; margin-left: auto; margin-right: auto;">
      ${items}
    </div>
  `;
}
