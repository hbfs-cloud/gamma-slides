import { escapeHtml } from '../html.js';
import { renderSource } from '../components/slide-header.js';
import { experienceTitleHTML } from '../components/experience.js';

export function renderTitle(slide, theme, deck) {
  if (deck?.meta?.experience) return experienceTitleHTML(slide, deck);
  const badge = slide.badge ? `<div class="gamma-badge">${escapeHtml(slide.badge)}</div>` : '';
  const subtitle = slide.subtitle ? `<h3 style="color: ${theme.textMuted}; font-weight: 400; font-family: 'Archivo', system-ui, sans-serif; margin-top: 8px;">${escapeHtml(slide.subtitle)}</h3>` : '';
  const meta = deck?.meta || {};
  const details = slide.show_meta === false ? [] : [meta.author, meta.date].filter(Boolean);
  const metaLine = details.length
    ? `<div class="title-meta">${details.map(item => `<span>${escapeHtml(item)}</span>`).join('<i></i>')}</div>`
    : '';

  // A Presenter Markdown document is intentionally sparse. Its opening slide
  // must still demonstrate the selected publishing system rather than falling
  // back to the generic engine title treatment. Rich decks opt in explicitly
  // with `variant: editorial`; plain engine decks retain their existing output.
  if (slide.variant === 'editorial' || meta.presentation === 'direct') {
    const strip = (slide.metrics || []).map(metric =>
      `<span><strong>${escapeHtml(metric.value)}</strong> ${escapeHtml(metric.label)}</span>`
    ).join('');
    return `<div class="editorial-cover">
      <div class="cover-index"><span>${escapeHtml(slide.kicker || slide.badge || meta.title || 'Presentation')}</span><strong>${escapeHtml(slide.label || '01')}</strong></div>
      <div class="cover-content">
        ${badge}
        <h1>${escapeHtml(slide.title || '')}</h1>
        ${subtitle}
        ${metaLine}
      </div>
      ${strip ? `<div class="cover-strip">${strip}</div>` : ''}
    </div>${renderSource(slide, { context: false })}`;
  }

  return `
    ${badge}
    <h1 style="color: ${theme.text}; margin: 14px 0 0; line-height: 1.05;">
      ${escapeHtml(slide.title || '')}
    </h1>
    ${subtitle}
    ${metaLine}
    ${renderSource(slide, { context: false })}
  `;
}
