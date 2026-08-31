import { escapeHtml, safeUrl } from '../html.js';

export function renderImage(slide, theme) {
  const img = slide.image || {};
  const fit = ['contain', 'cover', 'fill'].includes(img.fit) ? img.fit : 'contain';
  const caption = img.caption ? `<p style="color: ${theme.textMuted}; font-size: 0.7em; margin-top: 10px; font-style: italic;">${escapeHtml(img.caption)}</p>` : '';

  return `
    ${slide.title ? `<h2 style="color: ${theme.text};">${escapeHtml(slide.title)}</h2>` : ''}
    <div style="margin-top: 18px;">
      <img src="${safeUrl(img.src)}" alt="${escapeHtml(img.alt || '')}" loading="lazy" decoding="async" style="max-width: 90%; max-height: 480px; object-fit: ${fit}; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
      ${caption}
    </div>
  `;
}
