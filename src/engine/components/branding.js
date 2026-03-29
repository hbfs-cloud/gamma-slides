import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export function renderFooter(deck, theme) {
  const branding = deck.branding || {};
  const meta = deck.meta || {};

  const logoHtml = branding.logo ? renderLogo(branding.logo) : renderTextLogo(meta.company || 'gamma-slides', theme);
  const titleHtml = meta.title || '';
  const urlHtml = branding.company_url || '';

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
  return `<div class="watermark">${watermark}</div>`;
}

function renderLogo(logoPath) {
  if (logoPath.startsWith('http')) {
    return `<img src="${logoPath}" alt="Logo" style="height: 24px; object-fit: contain;">`;
  }
  const absPath = resolve(logoPath);
  if (existsSync(absPath) && absPath.endsWith('.svg')) {
    return readFileSync(absPath, 'utf-8');
  }
  return `<img src="${logoPath}" alt="Logo" style="height: 24px; object-fit: contain;">`;
}

function renderTextLogo(text, theme) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${text.length * 14} 30" width="${text.length * 12}">
    <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${theme.primary}"/>
      <stop offset="100%" style="stop-color:${theme.secondary}"/>
    </linearGradient></defs>
    <text x="2" y="22" font-family="system-ui" font-size="20" font-weight="800" fill="url(#lg)">${text}</text>
  </svg>`;
}
