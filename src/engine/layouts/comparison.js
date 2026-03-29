import { getIcon } from '../components/icons.js';

export function renderComparison(slide, theme) {
  const columns = (slide.columns || []).map(col => {
    const style = col.style || 'neutral';
    const iconName = style === 'positive' ? 'check-circle' : style === 'negative' ? 'alert-triangle' : 'star';
    const iconColor = style === 'positive' ? (theme.positive || theme.secondary) : style === 'negative' ? (theme.negative || theme.accent) : theme.textMuted;
    const headColor = style === 'positive' ? (theme.positive || theme.secondary) : style === 'negative' ? (theme.negative || theme.accent) : theme.text;

    const items = (col.items || []).map(item =>
      `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 0.82em; color: ${theme.text}; line-height: 1.4;">
        ${getIcon(iconName, iconColor, 15)}
        <span>${item}</span>
      </div>`
    ).join('');

    return `
      <div class="comparison-col ${style}">
        <h3 style="color: ${headColor};">${col.heading || ''}</h3>
        ${items}
      </div>`;
  }).join('');

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${slide.title}</h2>` : ''}
    <div style="display: flex; gap: 20px; margin-top: 18px; max-width: 900px; margin-left: auto; margin-right: auto;">
      ${columns}
    </div>
  `;
}
