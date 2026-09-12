import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { renderDeck } from '../engine/renderer.js';

function addLibraryReturn(html, homeHref) {
  if (!homeHref) return html;
  const control = `<style id="gamma-library-return-style">#gamma-library-return{position:fixed;z-index:2147483647;top:16px;right:18px;display:inline-flex;align-items:center;gap:9px;min-height:40px;padding:0 14px;border:1px solid #F3F6F2;border-radius:999px;background:color-mix(in srgb,#0A101B,transparent 14%);color:#F3F6F2;font:700 13px/1.2 system-ui,-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:-.01em;text-decoration:none;box-shadow:0 12px 26px color-mix(in srgb,#05070A,transparent 76%);backdrop-filter:blur(12px);transition:transform .18s ease,background .18s ease}#gamma-library-return:hover{background:#315DFF;transform:translateY(-1px)}#gamma-library-return:focus-visible{outline:3px solid #FFB000;outline-offset:3px}#gamma-library-return svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2}@media(max-width:640px){#gamma-library-return{top:10px;right:10px;min-height:34px;padding:0 11px;font-size:12px}}@media(prefers-reduced-motion:reduce){#gamma-library-return{transition:none}#gamma-library-return:hover{transform:none}}</style><a id="gamma-library-return" href="${homeHref}" aria-label="Return to the Gamma Presenter home page"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 8H2m5-5L2 8l5 5"/></svg><span>Gamma Presenter</span></a>`;
  const favicon = `<link rel="icon" href="${homeHref}assets/gamma-presenter-icon.svg" type="image/svg+xml">`;
  const mobileReturn = '<style>@media(max-width:900px){body.gamma-experience #gamma-library-return{top:4px;right:72px;min-height:44px}}</style>';
  html = html.replace('</head>', '<style>html[data-gamma-preview] #gamma-library-return{display:none}</style></head>');
  const closingHead = html.search(/<\/head>\s*<body\b/i);
  const withFavicon = closingHead < 0 ? `${favicon}${html}` : `${html.slice(0, closingHead)}${favicon}${html.slice(closingHead)}`;
  const closingBody = withFavicon.search(/<\/body>\s*<\/html>\s*$/i);
  return closingBody < 0 ? `${withFavicon}${control}${mobileReturn}` : `${withFavicon.slice(0, closingBody)}${control}${mobileReturn}${withFavicon.slice(closingBody)}`;
}

export function buildStaticSite(deck, outputDir = './site', { homeHref = '' } = {}) {
  const siteDir = resolve(outputDir);
  const indexPath = resolve(siteDir, 'index.html');
  mkdirSync(siteDir, { recursive: true });
  writeFileSync(indexPath, addLibraryReturn(renderDeck(deck), homeHref), 'utf-8');
  writeFileSync(resolve(siteDir, '.nojekyll'), '', 'utf-8');
  return {
    siteDir,
    indexPath,
    slides: deck.slides.length,
    theme: deck.theme,
    title: deck.meta?.title || 'Presentation',
  };
}
