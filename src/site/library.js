import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
import { escapeHtml } from '../engine/html.js';
import { loadDeckFile } from '../loader/index.js';
import { buildStaticSite } from './build.js';
import { presentationSlug } from './github-pages.js';

function catalogHtml(entries) {
  const cards = entries.map(entry => `
    <article class="deck-card">
      <div class="deck-index">${String(entry.index).padStart(2, '0')}</div>
      <div>
        <p>${escapeHtml(entry.theme)}</p>
        <h2>${escapeHtml(entry.title)}</h2>
        <span>${entry.slides} slides</span>
      </div>
      <a href="./${encodeURIComponent(entry.slug)}/">Open presentation <span aria-hidden="true">↗</span></a>
    </article>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>Gamma Slides — Presentation Library</title>
  <style>
    :root{font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#F4F0E7;background:#05070A}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#05070A;color:#F4F0E7}header,main,footer{width:min(1120px,calc(100% - 40px));margin:auto}header{display:grid;grid-template-columns:auto 1fr;gap:24px;padding:72px 0 52px;border-bottom:1px solid #26313D}.mark{display:grid;place-items:center;width:50px;height:50px;background:#315DFF;color:white;font:850 22px/1 ui-monospace,monospace}.eyebrow,.deck-card p,footer{font:700 11px/1.2 ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase}.eyebrow{margin:0 0 13px;color:#87A2FF}h1{max-width:780px;margin:0;font:500 clamp(38px,7vw,76px)/.98 ui-serif,Georgia,serif;letter-spacing:-.045em}main{display:grid;gap:0;padding:22px 0 90px}.deck-card{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:26px;align-items:center;min-height:150px;border-bottom:1px solid #26313D}.deck-index{color:#A3ADB8;font:500 14px/1 ui-monospace,monospace}.deck-card p{margin:0 0 10px;color:#87A2FF}.deck-card h2{margin:0 0 10px;font:550 clamp(23px,3vw,36px)/1.08 ui-serif,Georgia,serif;letter-spacing:-.025em}.deck-card span{color:#A3ADB8;font-size:11px}.deck-card>a{min-height:44px;display:flex;align-items:center;gap:9px;padding:0 2px;border-bottom:1px solid #87A2FF;color:#F4F0E7;text-decoration:none;font-weight:750}.deck-card>a:hover,.deck-card>a:focus-visible{color:#8BA8FF;outline:2px solid #87A2FF;outline-offset:7px}footer{padding:24px 0 38px;border-top:1px solid #26313D;color:#A3ADB8}@media(max-width:700px){header{padding-top:42px}.deck-card{grid-template-columns:36px 1fr;padding:24px 0}.deck-card>a{grid-column:2;justify-self:start}}
  </style>
</head>
<body>
  <header><div class="mark" aria-hidden="true">G</div><div><p class="eyebrow">Gamma Slides / Live library</p><h1>Presentations built to be explored.</h1></div></header>
  <main>${cards || '<p>No presentations deployed yet.</p>'}</main>
  <footer>Interactive HTML · Live ECharts · Static hosting</footer>
</body>
</html>`;
}

export function buildPresentationLibrary({ inputDir = './presentations', outputDir = './_site', include = [] } = {}) {
  const destination = resolve(outputDir);
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  const files = [];
  const sourceDir = resolve(inputDir);
  if (existsSync(sourceDir)) {
    readdirSync(sourceDir)
      .filter(name => /\.(?:ya?ml|json)$/i.test(name))
      .sort()
      .forEach(name => files.push({ file: resolve(sourceDir, name), slug: presentationSlug(basename(name, extname(name))) }));
  }
  include.forEach(file => {
    const path = resolve(file);
    const slug = presentationSlug(basename(file, extname(file)));
    if (!files.some(entry => entry.slug === slug)) files.push({ file: path, slug });
  });
  const entries = files.map(({ file, slug }, index) => {
    const deck = loadDeckFile(file);
    const result = buildStaticSite(deck, resolve(destination, slug));
    return { index: index + 1, slug, title: result.title, slides: result.slides, theme: result.theme };
  });
  writeFileSync(resolve(destination, 'index.html'), catalogHtml(entries), 'utf-8');
  writeFileSync(resolve(destination, '.nojekyll'), '', 'utf-8');
  writeFileSync(resolve(destination, 'presentations.json'), JSON.stringify(entries, null, 2), 'utf-8');
  return { outputDir: destination, entries };
}
