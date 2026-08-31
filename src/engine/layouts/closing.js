import { escapeHtml } from '../html.js';
import { renderSource } from '../components/slide-header.js';

export function renderClosing(slide, theme, deck) {
  const badge = slide.badge ? `<div class="gamma-badge">${escapeHtml(slide.badge)}</div>` : '';
  const metrics = (slide.metrics || []).map(m =>
    `<div class="metric-card" style="text-align: center;">
      <div class="label">${escapeHtml(m.label)}</div>
      <div class="value" style="font-size: 1.5em;">${escapeHtml(m.value)}</div>
    </div>`
  ).join('');

  const metricsGrid = metrics
    ? `<div class="grid-${Math.min(slide.metrics.length, 4)}" style="margin-top: 20px; max-width: 750px; margin-left: auto; margin-right: auto;">${metrics}</div>`
    : '';

  const contact = slide.contact
    ? `<p style="color: ${theme.textMuted}; font-size: 0.65em; margin-top: 18px; font-family: 'General Sans', system-ui, sans-serif;">
        ${escapeHtml(slide.contact.email || '')} ${slide.contact.website ? `&middot; ${escapeHtml(slide.contact.website)}` : ''}
      </p>`
    : '';

  const meta = deck.meta || {};

  if (slide.variant === 'decisions') {
    const decisions = (slide.items || []).map((item, index) => `<div class="closing-decision"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(item.title || item.text || '')}</strong>${item.description ? `<small>${escapeHtml(item.description)}</small>` : ''}</div></div>`).join('');
    return `<div class="editorial-closing"><div class="closing-message">
      <h1>${escapeHtml(slide.title || '')}</h1>${slide.subtitle ? `<p>${escapeHtml(slide.subtitle)}</p>` : ''}
    </div><div class="closing-decisions">${decisions}</div></div>${renderSource(slide)}`;
  }

  return `
    ${badge}
    <h1 style="background: ${theme.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 14px 0 0;">
      ${escapeHtml(slide.title || 'Thank You')}
    </h1>
    ${slide.subtitle ? `<h3 style="color: ${theme.textMuted}; font-weight: 400; margin-top: 6px;">${escapeHtml(slide.subtitle)}</h3>` : ''}
    ${metricsGrid}
    ${contact}
    ${renderSource(slide)}
  `;
}
