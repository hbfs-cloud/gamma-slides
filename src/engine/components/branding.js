import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { escapeHtml, safeUrl } from '../html.js';

export function renderFooter(deck, theme) {
  const branding = deck.branding || {};
  const meta = deck.meta || {};
  const company = meta.company || 'Gamma Slides';
  const deckTitle = meta.title || 'Untitled Presentation';
  const watermark = branding.watermark || company;

  const logoHtml = branding.logo ? renderLogo(branding.logo, company) : renderTextLogo(company);
  const titleHtml = escapeHtml(deckTitle);
  const urlHtml = escapeHtml(branding.company_url || '');
  const watermarkHtml = escapeHtml(watermark);

  return `
    <footer class="footer-bar brand-rail" aria-label="Presentation identity">
      <div class="brand-lockup">${logoHtml}</div>
      <div class="brand-deck-title" title="${titleHtml}">${titleHtml}</div>
      <div class="brand-publication">
        <span class="brand-classification">${watermarkHtml}</span>
        ${urlHtml ? `<span class="brand-url">${urlHtml}</span>` : ''}
      </div>
    </footer>
  `;
}

export function renderWatermark(deck) {
  const watermark = deck.branding?.watermark || deck.meta?.company || 'Gamma Slides';
  return `<div class="watermark brand-watermark" aria-hidden="true"><span>${escapeHtml(watermark)}</span></div>`;
}

function renderLogo(logoPath, company) {
  const alt = `${escapeHtml(company)} logo`;
  if (logoPath.startsWith('http')) {
    return `<img class="brand-logo-image" src="${safeUrl(logoPath)}" alt="${alt}">`;
  }
  const absPath = resolve(logoPath);
  if (existsSync(absPath) && absPath.endsWith('.svg')) {
    const svg = readFileSync(absPath).toString('base64');
    return `<img class="brand-logo-image" src="data:image/svg+xml;base64,${svg}" alt="${alt}">`;
  }
  return `<img class="brand-logo-image" src="${safeUrl(logoPath)}" alt="${alt}">`;
}

function renderTextLogo(text) {
  const safeText = escapeHtml(text);
  const initial = escapeHtml(Array.from(text.trim())[0]?.toUpperCase() || 'G');
  return `<span class="brand-monogram" aria-hidden="true">${initial}</span><span class="footer-wordmark">${safeText}</span>`;
}
