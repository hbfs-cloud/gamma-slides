import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { escapeHtml, safeUrl } from '../html.js';

export function renderFooter(deck, theme) {
  const branding = deck.branding || {};
  const meta = deck.meta || {};

  const logoHtml = branding.logo ? renderLogo(branding.logo) : renderTextLogo(meta.company || 'gamma-slides', theme);
  const titleHtml = escapeHtml(meta.title || '');
  const urlHtml = escapeHtml(branding.company_url || '');

  return `
    <div class="footer-bar">
      <div>${logoHtml}</div>
      <div>${titleHtml}</div>
      <div>${urlHtml}</div>
    </div>
  `;
}

export function renderWatermark(deck) {
  const watermark = deck.branding?.watermark;
  if (!watermark) return '';
  return `<div class="watermark">${escapeHtml(watermark)}</div>`;
}

function renderLogo(logoPath) {
  if (logoPath.startsWith('http')) {
    return `<img src="${safeUrl(logoPath)}" alt="Logo" style="height: 24px; object-fit: contain;">`;
  }
  const absPath = resolve(logoPath);
  if (existsSync(absPath) && absPath.endsWith('.svg')) {
    const svg = readFileSync(absPath).toString('base64');
    return `<img src="data:image/svg+xml;base64,${svg}" alt="Logo" style="height: 24px; object-fit: contain;">`;
  }
  return `<img src="${safeUrl(logoPath)}" alt="Logo" style="height: 24px; object-fit: contain;">`;
}

function renderTextLogo(text, theme) {
  const safeText = escapeHtml(text);
  return `<span class="footer-wordmark" style="color:${theme.primary};font-family:'${theme.fontHeading}',sans-serif;font-weight:700;letter-spacing:-.02em">${safeText}</span>`;
}
