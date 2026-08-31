import { escapeHtml } from '../html.js';

export function renderSlideHeader(slide) {
  return `<header class="slide-header">
    ${slide.title ? `<h2>${escapeHtml(slide.title)}</h2>` : ''}
    ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
  </header>`;
}

export function renderInsight(slide) {
  if (!slide.insight) return '';
  return `<aside class="slide-insight"><span>Key read</span><p>${escapeHtml(slide.insight)}</p></aside>`;
}

export function renderSource(slide, { context = true } = {}) {
  const section = context && slide.kicker ? `<b class="slide-context">${escapeHtml(slide.kicker)}</b>` : '';
  const provenance = slide.source ? `${section ? '<i aria-hidden="true">·</i>' : ''}Source: ${escapeHtml(slide.source)}` : '';
  if (!section && !provenance && !slide.footnote) return '';
  return `<div class="slide-source">
    ${(section || provenance) ? `<span>${section}${provenance}</span>` : ''}
    ${slide.footnote ? `<span>${escapeHtml(slide.footnote)}</span>` : ''}
  </div>`;
}
