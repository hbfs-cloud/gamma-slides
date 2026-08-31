import { escapeHtml, safeUrl } from '../html.js';

export function renderQuote(slide, theme) {
  const imageSource = typeof slide.image === 'string' ? slide.image : slide.image?.src;
  const avatar = imageSource
    ? `<img src="${safeUrl(imageSource)}" alt="${escapeHtml(slide.author || slide.image?.alt || '')}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; margin-bottom: 20px; border: 3px solid rgba(${hexToRgb(theme.primary)}, 0.25);">`
    : '';

  if (slide.variant === 'editorial') {
    const proof = slide.metrics?.[0];
    return `<div class="editorial-quote"><div>
      ${slide.kicker ? `<div class="slide-kicker">${escapeHtml(slide.kicker)}</div>` : ''}
      <blockquote>${escapeHtml(slide.quote || '')}</blockquote>
      <div class="quote-author">${escapeHtml(slide.author || '')}${slide.role ? `<br>${escapeHtml(slide.role)}` : ''}</div>
    </div>${proof ? `<aside class="quote-proof"><strong>${escapeHtml(proof.value)}</strong><span>${escapeHtml(proof.label)}</span></aside>` : ''}</div>`;
  }

  return `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;">
      ${avatar}
      <div class="quote-block">${escapeHtml(slide.quote || '')}</div>
      <div class="quote-author">
        <strong style="color: ${theme.text};">${escapeHtml(slide.author || '')}</strong>
        ${slide.role ? `<br><span style="opacity: 0.7;">${escapeHtml(slide.role)}</span>` : ''}
      </div>
    </div>
  `;
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '128, 128, 128';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
