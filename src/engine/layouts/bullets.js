import { getIcon } from '../components/icons.js';

export function renderBullets(slide, theme) {
  const items = (slide.items || []).map(item => {
    const iconSvg = item.icon ? getIcon(item.icon, theme.primary, 18) : getIcon('check-circle', theme.primary, 18);
    return `
      <div class="bullet-item">
        <div class="bullet-icon">${iconSvg}</div>
        <div class="bullet-text">${item.text || item.title || ''}</div>
      </div>`;
  }).join('');

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${slide.title}</h2>` : ''}
    ${slide.subtitle ? `<p style="color: ${theme.textMuted}; font-size: 0.75em;">${slide.subtitle}</p>` : ''}
    <div style="margin-top: 18px; max-width: 700px; margin-left: auto; margin-right: auto;">
      ${items}
    </div>
  `;
}
