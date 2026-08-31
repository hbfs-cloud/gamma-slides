import { getIcon } from '../components/icons.js';
import { escapeHtml } from '../html.js';
import { renderSlideHeader, renderInsight, renderSource } from '../components/slide-header.js';

export function renderComparison(slide, theme) {
  if (slide.variant === 'story' && Array.isArray(slide.columns) && slide.columns.length >= 2) {
    const [before, after] = slide.columns;
    const count = Math.max(before.items?.length || 0, after.items?.length || 0);
    const rows = Array.from({ length: count }, (_, index) => `<div class="comparison-editorial-row">
      <div class="before">${escapeHtml(before.items?.[index] || '')}</div><div class="comparison-arrow">${getIcon('arrow-right', theme.primary, 18)}</div><div class="after">${escapeHtml(after.items?.[index] || '')}</div>
    </div>`).join('');
    return `${renderSlideHeader(slide)}<div class="comparison-editorial">
      <div class="comparison-editorial-head"><span>${escapeHtml(before.heading || 'Before')}</span><span></span><span>${escapeHtml(after.heading || 'After')}</span></div>${rows}
    </div>${renderInsight(slide)}${renderSource(slide)}`;
  }
  const columns = (Array.isArray(slide.columns) ? slide.columns : []).map(col => {
    const style = ['positive', 'negative', 'neutral'].includes(col.style) ? col.style : 'neutral';
    const iconName = style === 'positive' ? 'check-circle' : style === 'negative' ? 'alert-triangle' : 'star';
    const iconColor = style === 'positive' ? (theme.positive || theme.secondary) : style === 'negative' ? (theme.negative || theme.accent) : theme.textMuted;
    const headColor = style === 'positive' ? (theme.positive || theme.secondary) : style === 'negative' ? (theme.negative || theme.accent) : theme.text;

    const items = (col.items || []).map(item =>
      `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 0.82em; color: ${theme.text}; line-height: 1.4;">
        ${getIcon(iconName, iconColor, 15)}
        <span>${escapeHtml(item)}</span>
      </div>`
    ).join('');

    return `
      <div class="comparison-col ${style}">
        <h3 style="color: ${headColor};">${escapeHtml(col.heading || '')}</h3>
        ${items}
      </div>`;
  }).join('');

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${escapeHtml(slide.title)}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
    <div style="display: flex; gap: 20px; margin-top: 18px; max-width: 900px; margin-left: auto; margin-right: auto;">
      ${columns}
    </div>
  `;
}
