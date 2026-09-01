import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { renderDeck } from '../engine/renderer.js';

export function buildStaticSite(deck, outputDir = './site') {
  const siteDir = resolve(outputDir);
  const indexPath = resolve(siteDir, 'index.html');
  mkdirSync(siteDir, { recursive: true });
  writeFileSync(indexPath, renderDeck(deck), 'utf-8');
  writeFileSync(resolve(siteDir, '.nojekyll'), '', 'utf-8');
  return {
    siteDir,
    indexPath,
    slides: deck.slides.length,
    theme: deck.theme,
    title: deck.meta?.title || 'Presentation',
  };
}
